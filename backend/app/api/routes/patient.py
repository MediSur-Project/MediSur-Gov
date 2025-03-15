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
from pathlib import Path

from app.models import Appointment, AppointmentCreate, AppointmentResponse, AppointmentStatus, AppointmentUpdate
from app.api.deps import get_db

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
        information="",
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
        if not appointment:
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
    
    try:
        # Enviar mensajes históricos al cliente cuando se conecta
        for message in appointment_messages[appointment_id]:
            await websocket.send_json(message)
        
        # Bucle principal para recibir mensajes
        while True:
            # Recibir mensaje como texto o binario
            data_type = await websocket.receive_text()
            
            if data_type == "text":
                # Procesar mensaje de texto
                data = await websocket.receive_json()
                message = {
                    "type": "text",
                    "timestamp": datetime.now().isoformat(),
                    "content": data.get("content", ""),
                    "sender": data.get("sender", "patient")
                }
                
                # Guardar el mensaje en el historial
                appointment_messages[appointment_id].append(message)
                
                # Enviar el mensaje de vuelta como confirmación
                await websocket.send_json(message)
                
            elif data_type == "audio":
                # Recibir datos de audio
                data = await websocket.receive_json()
                
                # Extraer datos de audio en base64
                audio_data = data.get("audio_data", "")
                audio_format = data.get("format", "wav")
                
                if audio_data:
                    # Generar nombre de archivo único
                    filename = f"{appointment_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{audio_format}"
                    file_path = AUDIO_DIR / filename
                    
                    # Decodificar y guardar el archivo de audio
                    try:
                        audio_bytes = base64.b64decode(audio_data)
                        with open(file_path, "wb") as f:
                            f.write(audio_bytes)
                        
                        # Crear mensaje con referencia al archivo de audio
                        message = {
                            "type": "audio",
                            "timestamp": datetime.now().isoformat(),
                            "filename": filename,
                            "sender": data.get("sender", "patient")
                        }
                        
                        # Guardar el mensaje en el historial
                        appointment_messages[appointment_id].append(message)
                        
                        # Enviar confirmación
                        await websocket.send_json({
                            "type": "audio_received",
                            "filename": filename,
                            "timestamp": datetime.now().isoformat()
                        })
                    except Exception as e:
                        # Enviar error si no se pudo procesar el audio
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Error processing audio: {str(e)}"
                        })
                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": "No audio data provided"
                    })
            
            elif data_type == "binary":
                # Alternativa: recibir datos binarios directamente
                binary_data = await websocket.receive_bytes()
                
                # Generar nombre de archivo único
                filename = f"{appointment_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.bin"
                file_path = AUDIO_DIR / filename
                
                # Guardar el archivo binario
                with open(file_path, "wb") as f:
                    f.write(binary_data)
                
                # Crear mensaje con referencia al archivo
                message = {
                    "type": "binary",
                    "timestamp": datetime.now().isoformat(),
                    "filename": filename,
                    "sender": "patient"  # Asumimos que es del paciente
                }
                
                # Guardar el mensaje en el historial
                appointment_messages[appointment_id].append(message)
                
                # Enviar confirmación
                await websocket.send_json({
                    "type": "binary_received",
                    "filename": filename,
                    "timestamp": datetime.now().isoformat()
                })
            
            else:
                # Tipo de mensaje no reconocido
                await websocket.send_json({
                    "type": "error",
                    "message": f"Unsupported message type: {data_type}"
                })
            
    except WebSocketDisconnect:
        # Manejar la desconexión del cliente
        if appointment_id in active_connections:
            del active_connections[appointment_id]
    except Exception as e:
        # Manejar otros errores
        if appointment_id in active_connections:
            del active_connections[appointment_id]
        # En un entorno de producción, deberías registrar este error
        print(f"Error in WebSocket connection: {str(e)}")


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
