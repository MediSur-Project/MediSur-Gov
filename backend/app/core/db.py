from sqlmodel import Session, create_engine, select, SQLModel, inspect

from app import crud
from app.core.config import settings
from app.models import User, UserCreate, HospitalBase

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28


def create_db_and_tables():
    """Create database tables if they don't exist."""
    # This works because the models are already imported and registered from app.models
    SQLModel.metadata.create_all(engine)
    

def init_hospitals(session: Session) -> None:
    hospitals = [
        {
            "name": "Hospital General",
            "address": "Calle 1 #123",
            "phone_number": "1234567890",
            "email": "example@example.com",
            "contact_person": "Dr. Juan Perez",
        },
        {
            "name": "Hospital Especializado",
            "address": "Calle 2 #456",
            "phone_number": "0987654321",
            "email": "example@example.com",
            "contact_person": "Dr. Maria Lopez",
        },
    ]
    for hospital in hospitals:
        hospital_in = HospitalBase(**hospital)
        # Check if hospital already exists
        existing_hospital = session.exec(
            select(HospitalBase).where(HospitalBase.name == hospital_in.name)
        ).first()
        if not existing_hospital:
            session.add(hospital_in)
    session.commit()
        

def init_db(session: Session) -> None:
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create
    # the tables un-commenting the next lines
    # Create tables if they don't exist
    create_db_and_tables()

    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = crud.create_user(session=session, user_create=user_in)
    # Init hospital data
    init_hospitals(session)