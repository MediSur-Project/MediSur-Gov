from fastapi import APIRouter, WebSocket, Depends, HTTPException, status
from sqlmodel import Session
from requests import post
from typing import Dict, List
import uuid
from datetime import datetime
from app.api.services.audio_transcriptor import process_audio, save_audio_file
from app.api.routes.utils import register_message
from pathlib import Path
from app.core.config import settings
from app.models import Appointment, AppointmentCreate, AppointmentResponse, AppointmentStatus, AppointmentUpdate, AppointmentInfo, AppointmentsPublic
from app.api.deps import get_db
from app.api.services.user_answer import ask_more_questions, MedicalCaseResult
import json
from sqlmodel import Session, select
from app.models import Hospital
    
router = APIRouter(prefix="/appointments", tags=["appointments"])

# Almacenamiento en memoria para las conexiones WebSocket activas
# En un entorno de producción, esto debería ser reemplazado por una solución más robusta
active_connections: Dict[str, WebSocket] = {}

# Almacenamiento en memoria para los mensajes
# En un entorno de producción, esto debería ser almacenado en una base de datos
appointment_messages: Dict[str, List[Dict]] = {}

# Directorio para guardar archivos de audio
AUDIO_DIR = Path("./audio_files")
AUDIO_DIR.mkdir(exist_ok=True)

@router.post("/appointments", response_model=AppointmentResponse)
async def create_appointment(
    appointment_data: AppointmentCreate,
    db: Session = Depends(get_db)
):
    """
    Crea una nueva solicitud de cita y devuelve un ID único para seguimiento
    """
    # Crear la cita en la base de datos
    new_appointment = Appointment(
        patient_id=appointment_data.patient_id,
        additional_data={},
        request_start_time=datetime.now()
    )
    
    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)
    
    # Inicializar el registro de mensajes para esta cita
    appointment_messages[str(new_appointment.id)] = []
    
    return new_appointment


@router.put("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: uuid.UUID,
    appointment_data: AppointmentUpdate,
    db: Session = Depends(get_db)
):
    """
    Actualiza una cita existente con información del médico y hora asignada
    """
    appointment = db.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    if appointment_data.scheduled_time is not None:
        appointment.scheduled_time = appointment_data.scheduled_time
    
    if appointment_data.status is not None:
        appointment.status = appointment_data.status
        
    db.commit()
    db.refresh(appointment)
    
    return appointment

@router.get("/all", response_model=AppointmentsPublic)
async def get_appointments(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    Obtiene todas las citas
    """
    statement = select(Appointment).offset(skip).limit(limit)
    appointments = db.exec(statement).all()
    return AppointmentsPublic(data=appointments, count=len(appointments))


@router.get("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """
    Obtiene información sobre una cita específica
    """
    appointment = db.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    return appointment


@router.websocket("/ws/{appointment_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    appointment_id: str,
    db: Session = Depends(get_db)
):
    """
    Endpoint WebSocket para comunicación en tiempo real relacionada con una cita específica.
    Soporta mensajes de texto y archivos de audio.
    """
    # Verificar si el appointment_id existe
    try:
        uuid_id = uuid.UUID(appointment_id)
        appointment = db.get(Appointment, uuid_id)
        if not appointment or (appointment.status != AppointmentStatus.PENDING and appointment.status != AppointmentStatus.MISSING_DATA):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except ValueError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    # Inicializar el historial de mensajes si no existe
    if appointment_id not in appointment_messages:
        appointment_messages[appointment_id] = []
    
    await websocket.accept()
    active_connections[appointment_id] = websocket
    
    # Enviar mensajes históricos al cliente cuando se conecta
    for message in appointment_messages[appointment_id]:
        await websocket.send_json(message)
    
    while True:
        message = await websocket.receive()  # Recibe el mensaje como dict
        print(message.keys())

        if "bytes" in message:
            try:
                # Get the binary data from the message
                audio_data = message["bytes"]
                audio_path = save_audio_file(appointment_id, audio_data)               
                message_from_user = process_audio(api_key=settings.OPENAI_API_KEY, audio_path=str(audio_path))
                
            except Exception as e:
                print(f"Error processing audio: {str(e)}")
                await websocket.send_json({
                    "type": "error",
                    "text": f"Error processing audio: {str(e)}",
                    "timestamp": datetime.now().isoformat()
                })
        elif "text" in message:
            message_from_user = message["text"]
        else:
            print(f"Incorrect message format: {message.keys()}")

        register_message(db, appointment_id, message_from_user, "user")
        

        ## PREGUNTAMOS A LA LLM SI HAY QUE HACER MAS PREGUNTAS
        result: MedicalCaseResult = ask_more_questions(db, appointment.patient_id, appointment_id)
        if result.extra_questions is not None and len(result.extra_questions.further_questions) > 0:
            appointment.status = AppointmentStatus.MISSING_DATA
            db.commit()
            db.refresh(appointment)
            await websocket.send_json({
                "type": "questions",
                "value": result.extra_questions.further_questions,
            })
            for question in result.extra_questions.further_questions:
                register_message(db, appointment_id, question, "assistant")
    
            # Close the WebSocket connection
        
        else:
            appointment.status = AppointmentStatus.PENDING
            appointment.hospital_assigned = result.assigned_hospital
            appointment.medical_specialty = result.triage.specialty
            appointment.prority = result.triage.urgency
            db.commit()
            db.refresh(appointment)
            await websocket.send_json({
                "type": "done",
                "value": f"Tu cita ha sido creada con éxito y asignada al hospital {result.assigned_hospital}. En breves asignarán una hora para usted. Revisa en el panel de citas para más información."
            })

            # Close the WebSocket connection
            await websocket.close()
            notify_hospital(db, appointment_id, result.assigned_hospital, result.triage.urgency, result.triage.specialty, result.raw_input.user_id, message_from_user)
            break

def notify_hospital(db, appointment_id: str, hospital: str, urgency: str, specialty: str, user_id: str, message: str):
    hospital = db.get(Hospital, hospital)
    if hospital is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found"
        )
    if hospital.uri is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital URI not found"
        )
    
    appointment_data = {
    "patient_id": user_id,
    "specialty": specialty,
    "appointment_type": "consulta",
    "urgency": urgency,
    "reason": message,
    "notes": f"Test de sistema de citas (Urgencia: {urgency}, Tipo: {specialty})"
    }

    # Realizar la solicitud
    print(f"DNI paciente: {appointment_data['patient_id']}")
    print(f"Razón: {appointment_data['reason']}")

    response = requests.post(
        f"{hospital.uri}/specialty-appointments/",
        json=appointment_data
    )


    pass