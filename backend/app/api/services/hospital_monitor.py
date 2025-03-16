import asyncio
import aiohttp
from datetime import datetime
from sqlmodel import Session, select
from app.models import Hospital, StatusHospital
from app.core.db import engine
import logging
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_hospital(db: Session, hospital_id: str) -> Hospital:
    """Get a hospital by ID"""
    return db.exec(select(Hospital).where(Hospital.id == hospital_id)).first()

async def check_hospital_status(session: aiohttp.ClientSession, hospital: Hospital) -> bool:
    """Check if a hospital's API is responding"""
    if not hospital.uri:
        return False
        
    try:
        async with session.get(f"http://{hospital.uri}:8000/health", timeout=5) as response:
            # Any response (even error) means the server is up
            return True
    except Exception as e:
        logger.error(f"Error checking hospital {hospital.name}: {str(e)}")
        return False

async def update_hospital_statuses():
    """Update the status of all hospitals in the database"""
    try:
        async with aiohttp.ClientSession() as session:
            # Get all hospitals
            db = Session(engine)
            statement = select(Hospital)
            hospitals = db.exec(statement).all()
            
            # Check each hospital's status
            for hospital in hospitals:
                is_active = await check_hospital_status(session, hospital)
                new_status = StatusHospital.ACTIVE if is_active else StatusHospital.INACTIVE
                
                if hospital.status != new_status:
                    hospital.status = new_status
                    logger.info(f"Hospital {hospital.name} status changed to {new_status}")
            
            # Commit changes
            db.commit()
            db.close()
            
    except Exception as e:
        logger.error(f"Error in update_hospital_statuses: {str(e)}")

@asynccontextmanager
async def lifespan_monitor(app):
    """Lifespan context manager for the monitoring service"""
    monitor_task = asyncio.create_task(monitor_hospitals())
    yield
    monitor_task.cancel()
    try:
        await monitor_task
    except asyncio.CancelledError:
        pass

async def monitor_hospitals():
    """Main monitoring loop"""
    while True:
        await update_hospital_statuses()
        await asyncio.sleep(10)  # Wait for 10 seconds

def start_monitoring():
    """Start the monitoring service"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        loop.run_until_complete(monitor_hospitals())
    except KeyboardInterrupt:
        pass
    finally:
        loop.close()

if __name__ == "__main__":
    start_monitoring() 