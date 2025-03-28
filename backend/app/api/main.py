from fastapi import APIRouter

from app.api.routes import hospitals, login, private, users, utils, appointments, patients, speech
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(appointments.router)
api_router.include_router(hospitals.router)
api_router.include_router(patients.router)
api_router.include_router(speech.router)

if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
