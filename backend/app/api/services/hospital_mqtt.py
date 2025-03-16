import asyncio
import json
from typing import Dict
import logging
from sqlmodel import Session, select
from app.models import Hospital, StatusHospital
from app.core.db import engine
from asyncio_mqtt import Client
from contextlib import asynccontextmanager
from fastapi import FastAPI

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def hospital_subscriber(hospital: Hospital):
    """Coroutine to handle MQTT subscription for a single hospital"""
    if not hospital.uri:
        logger.warning(f"Hospital {hospital.name} has no URI configured, skipping MQTT subscription")
        return

    try:
        # Configure MQTT client with explicit hostname and port
        hostname = hospital.uri
        port = 1883  # Default MQTT port
        
        logger.info(f"Connecting to MQTT broker at {hostname}:{port}")
        async with Client(hostname, port=port) as client:
            logger.info(f"Starting MQTT subscription for hospital: {hospital.name}")
            async with client.filtered_messages("medisur/#") as messages:
                await client.subscribe("medisur/#")
                async for message in messages:
                    try:
                        payload = json.loads(message.payload.decode())
                        # Extract topic parts to determine the action
                        topic = message.topic
                        topic_parts = topic.split('/')
                        
                        if len(topic_parts) < 2:
                            logger.warning(f"Invalid topic format: {topic}")
                            continue
                            
                        action_type = topic_parts[-1]  # Get the last part of the topic
                        
                        # Open a new database session for each message
                        with Session(engine) as db_session:
                            try:
                                # Handle different types of messages based on topic suffix
                                if action_type == "patients":
                                    # Handle patient creation or update
                                    if "id" in payload:
                                        # Update existing patient
                                        from app.models import Patient
                                        patient = db_session.exec(select(Patient).where(Patient.id == payload["id"])).first()
                                        
                                        if patient:
                                            # Update patient fields
                                            for key, value in payload.items():
                                                if hasattr(patient, key):
                                                    setattr(patient, key, value)
                                            db_session.commit()
                                            logger.info(f"Updated patient: {patient.id}")
                                        else:
                                            # Create new patient with provided ID
                                            from app.models import Patient
                                            new_patient = Patient(**payload)
                                            db_session.add(new_patient)
                                            db_session.commit()
                                            logger.info(f"Created new patient with ID: {new_patient.id}")
                                    else:
                                        # Create new patient
                                        from app.models import Patient
                                        new_patient = Patient(**payload)
                                        db_session.add(new_patient)
                                        db_session.commit()
                                        logger.info(f"Created new patient: {new_patient.id}")
                                
                                elif action_type == "appointments":
                                    # Handle appointment creation or update
                                    from app.models import Appointment
                                    
                                    if "id" in payload:
                                        # Update existing appointment
                                        appointment = db_session.exec(select(Appointment).where(Appointment.id == payload["id"])).first()
                                        
                                        if appointment:
                                            # Update appointment fields
                                            for key, value in payload.items():
                                                if hasattr(appointment, key):
                                                    setattr(appointment, key, value)
                                            db_session.commit()
                                            logger.info(f"Updated appointment: {appointment.id}")
                                        else:
                                            # Create new appointment with provided ID
                                            new_appointment = Appointment(**payload)
                                            db_session.add(new_appointment)
                                            db_session.commit()
                                            logger.info(f"Created new appointment with ID: {new_appointment.id}")
                                    else:
                                        # Create new appointment
                                        new_appointment = Appointment(**payload)
                                        db_session.add(new_appointment)
                                        db_session.commit()
                                        logger.info(f"Created new appointment: {new_appointment.id}")
                                
                                elif action_type == "diagnoses":
                                    # Handle diagnosis creation or update
                                    from app.models import Diagnosis
                                    
                                    if "id" in payload:
                                        # Update existing diagnosis
                                        diagnosis = db_session.exec(select(Diagnosis).where(Diagnosis.id == payload["id"])).first()
                                        
                                        if diagnosis:
                                            # Update diagnosis fields
                                            for key, value in payload.items():
                                                if hasattr(diagnosis, key):
                                                    setattr(diagnosis, key, value)
                                            db_session.commit()
                                            logger.info(f"Updated diagnosis: {diagnosis.id}")
                                        else:
                                            # Create new diagnosis with provided ID
                                            new_diagnosis = Diagnosis(**payload)
                                            db_session.add(new_diagnosis)
                                            db_session.commit()
                                            logger.info(f"Created new diagnosis with ID: {new_diagnosis.id}")
                                    else:
                                        # Create new diagnosis
                                        new_diagnosis = Diagnosis(**payload)
                                        db_session.add(new_diagnosis)
                                        db_session.commit()
                                        logger.info(f"Created new diagnosis: {new_diagnosis.id}")
                                else:
                                    logger.info(f"Unhandled action type: {action_type}")
                            except Exception as db_error:
                                db_session.rollback()
                                logger.error(f"Database error processing MQTT message: {db_error}")
                        logger.info(f"Hospital {hospital.name} received message: {payload}")
                    except json.JSONDecodeError as e:
                        logger.error(f"Error decoding message for hospital {hospital.name}: {e}")
    except Exception as error:
        logger.error(f"MQTT error for hospital {hospital.name}: {error}")
        await asyncio.sleep(5)  # Wait before reconnecting

async def start_hospital_subscribers():
    """Start MQTT subscribers for all active hospitals"""
    tasks: Dict[str, asyncio.Task] = {}
    
    while True:
        try:
            # Get all active hospitals
            db = Session(engine)
            statement = select(Hospital).where(Hospital.status == StatusHospital.ACTIVE)
            active_hospitals = db.exec(statement).all()
            db.close()

            # Create or update tasks for each active hospital
            for hospital in active_hospitals:
                if hospital.id not in tasks and hospital.uri:
                    task = asyncio.create_task(
                        hospital_subscriber(hospital)
                    )
                    tasks[str(hospital.id)] = task
                    logger.info(f"Created MQTT subscription task for hospital: {hospital.name}")

            # Clean up completed tasks
            for hospital_id in list(tasks.keys()):
                if tasks[hospital_id].done():
                    tasks.pop(hospital_id)

            # Wait for a while before checking for new active hospitals
            await asyncio.sleep(30)

        except Exception as e:
            logger.error(f"Error in start_hospital_subscribers: {e}")
            await asyncio.sleep(5)  # Wait before retrying

@asynccontextmanager
async def lifespan_mqtt(app: FastAPI):
    """Lifespan context manager for MQTT service"""
    # Start MQTT subscriber service
    mqtt_task = asyncio.create_task(start_hospital_subscribers())
    logger.info("Started MQTT subscriber service")
    
    yield
    
    # Cleanup
    mqtt_task.cancel()
    try:
        await mqtt_task
    except asyncio.CancelledError:
        logger.info("MQTT subscriber service shut down") 