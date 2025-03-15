from fastapi import APIRouter, WebSocket, Depends, HTTPException, status
from sqlmodel import Session
from typing import Dict, List
import uuid
from datetime import datetime
from app.api.audio_transcriptor import process_audio, save_audio_file
from app.api.routes.utils import register_message
from pathlib import Path
from app.core.config import settings
from app.models import Appointment, AppointmentCreate, AppointmentResponse, AppointmentStatus, AppointmentUpdate, AppointmentInfo
from app.api.deps import get_db
from app.api.user_answer import ask_more_questions, MedicalCaseResult
import json
import paho.mqtt.client as mqtt
    
    
router = APIRouter(prefix="/patient", tags=["patient"])

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
            result: MedicalCaseResult = ask_more_questions(db, appointment_id)
        elif "text" in message:
            message_from_user = message["text"]
        else:
            print(f"Incorrect message format: {message.keys()}")

        register_message(db, appointment_id, message_from_user)
        

        ## PREGUNTAMOS A LA LLM SI HAY QUE HACER MAS PREGUNTAS
        result: MedicalCaseResult = ask_more_questions(db, appointment_id)
        if result.extra_questions is not None and len(result.extra_questions.further_questions) > 0:
            appointment.status = AppointmentStatus.MISSING_DATA
            db.commit()
            db.refresh(appointment)
            await websocket.send_json({
                "type": "questions",
                "value": result.extra_questions.further_questions,
            })
        
        else:
            appointment.status = AppointmentStatus.PENDING
            db.commit()
            db.refresh(appointment)
            await websocket.send_json({
                "type": "done",
                "value": f"Tu cita ha sido creada con éxito y asignada al hospital {result.assigned_hospital}. En breves asignarán una hora para usted. Revisa en el panel de citas para más información."
            })

            # Close the WebSocket connection
            await websocket.close()
            #notify_hospital(appointment_id, result.assigned_hospital, result.triage.urgency, result.triage.specialty, result.raw_input.user_id, message_from_user)
            break

def notify_hospital(appointment_id: str, hospital: str, urgency: str, specialty: str, user_id: str, message: str):

    try:
        # Create MQTT client
        client = mqtt.Client()
        
        # Set credentials if configured
        if hasattr(settings, 'MQTT_USERNAME') and hasattr(settings, 'MQTT_PASSWORD'):
            client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD)
        
        # Connect to the broker
        mqtt_host = getattr(settings, 'MQTT_HOST', 'localhost')
        mqtt_port = getattr(settings, 'MQTT_PORT', 1883)
        client.connect(mqtt_host, mqtt_port, 60)
        
        # Prepare the message payload
        payload = {
            "appointment_id": appointment_id,
            "hospital": hospital,
            "urgency": urgency,
            "specialty": specialty,
            "user_id": user_id,
            "message": message
        }
        
        # Convert payload to JSON
        json_payload = json.dumps(payload)
        
        # Publish to the topic
        topic = f"hospital/{hospital}/create_appointment"
        client.publish(topic, json_payload)
        
        # Disconnect from the broker
        client.disconnect()
        
        print(f"Notification sent to {topic}")
    except Exception as e:
        print(f"Error sending MQTT notification: {str(e)}")
    pass
