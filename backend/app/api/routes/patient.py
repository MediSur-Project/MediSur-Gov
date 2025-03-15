from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, Response
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from typing import Dict, List, Optional
import uuid
from datetime import datetime
import enum
import base64
import json
import os
from app.api.audio_transcriptor import process_audio
from pathlib import Path
from app.core.config import settings
from app.models import Appointment, AppointmentCreate, AppointmentResponse, AppointmentStatus, AppointmentUpdate, AppointmentInfo
from app.api.deps import get_db
from app.api.user_answer import ask_more_questions
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
        if "text" in message:
            try:
                # Get the current highest order
                stmt = select(AppointmentInfo).where(AppointmentInfo.appointment_id == uuid_id).order_by(AppointmentInfo.order.desc())
                last_info = db.exec(stmt).first()
                next_order = 1 if last_info is None else last_info.order + 1
                
                # Create a new AppointmentInfo entry
                new_info = AppointmentInfo(
                    appointment_id=uuid_id,
                    content=message["text"],
                    order=next_order,
                    source_type="text",
                    created_at=datetime.now()
                )
                
                db.add(new_info)
                db.commit()
                db.refresh(new_info)
                
                # Save the message in the history
                message_data = {
                    "type": "text",
                    "text": message["text"],
                    "timestamp": datetime.now().isoformat(),
                    "info_id": str(new_info.id)
                }
                appointment_messages[appointment_id].append(message_data)
                
                # Send confirmation back to the client
                await websocket.send_json({
                    "type": "confirmation",
                    "text": "Mensaje recibido",
                    "timestamp": datetime.now().isoformat(),
                    "info_id": str(new_info.id)
                })
            except Exception as e:
                print(f"Error processing text message: {str(e)}")
                await websocket.send_json({
                    "type": "error",
                    "text": f"Error processing message: {str(e)}",
                    "timestamp": datetime.now().isoformat()
                })
            ask_more_questions(db, appointment_id)
        elif "bytes" in message:
            try:
                # Get the binary data from the message
                audio_data = message["bytes"]

                # Create audio directory if it doesn't exist
                AUDIO_DIR = Path("audio_files")
                AUDIO_DIR.mkdir(exist_ok=True)
                
                # Generate a unique filename for the audio
                audio_filename = f"{appointment_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.wav"
                audio_path = AUDIO_DIR / audio_filename
                
                # Save the audio file
                with open(audio_path, "wb") as audio_file:
                    audio_file.write(audio_data)
                
                print(f"Audio saved to {audio_path}")
                transcription = process_audio(api_key=settings.OPENAI_API_KEY, audio_path=str(audio_path))
                
                # Get the current highest order
                stmt = select(AppointmentInfo).where(AppointmentInfo.appointment_id == uuid_id).order_by(AppointmentInfo.order.desc())
                last_info = db.exec(stmt).first()
                next_order = 1 if last_info is None else last_info.order + 1
                
                # Create a new AppointmentInfo entry
                new_info = AppointmentInfo(
                    appointment_id=uuid_id,
                    content=transcription,
                    order=next_order,
                    source_type="audio",
                    created_at=datetime.now()
                )
                
                db.add(new_info)
                db.commit()
                db.refresh(new_info)
                
                # Send the transcription back to the client
                message_data = {
                    "type": "transcription",
                    "text": transcription,
                    "timestamp": datetime.now().isoformat(),
                    "info_id": str(new_info.id),
                    "audio_file": audio_filename
                }
                
                await websocket.send_json(message_data)
                
                # Save the message in the history
                appointment_messages[appointment_id].append(message_data)
            except Exception as e:
                print(f"Error processing audio: {str(e)}")
                await websocket.send_json({
                    "type": "error",
                    "text": f"Error processing audio: {str(e)}",
                    "timestamp": datetime.now().isoformat()
                })
            ask_more_questions(db, appointment_id)
        else:
            print(f"Incorrect message format: {message.keys()}")

# Endpoint para acceder a los archivos de audio
@router.get("/audio/{filename}")
async def get_audio_file(filename: str):
    """
    Recupera un archivo de audio por su nombre de archivo
    """
    file_path = AUDIO_DIR / filename
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio file not found"
        )
    
    # Devolver el archivo directamente
    return FileResponse(
        path=file_path,
        media_type="audio/wav",  # Ajustar según el formato real
        filename=filename
    )
