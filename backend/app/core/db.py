import uuid
import random
from datetime import datetime, timedelta

from faker import Faker
from sqlmodel import Session, create_engine, select, SQLModel

from app import crud
from app.core.config import settings
from app.models import (
    User,
    UserCreate,
    Item,
    Appointment,
    AppointmentInfo,
    AppointmentStatus,
    Hospital,
    Patient,
    MedicalRecord,
    Prescription,
    especialidad
)

faker = Faker()
engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def init_hospitals(session: Session) -> None:
    hospitals = [
        {
            "name": "Hospital General",
            "address": "Calle 1 #123",
            "phone_number": "1234567890",
            "email": "example@example.com",
            "contact_person": "Dr. Juan Perez",
            "latitude": 19.432607,
            "longitude": -99.133209,
            "uri": "",
        },
        {
            "name": "Hospital Especializado",
            "address": "Calle 2 #456",
            "phone_number": "0987654321",
            "email": "example@example.com",
            "contact_person": "Dr. Maria Lopez",
            "latitude": 19.432607,
            "longitude": -99.133209,
            "uri": "",

        },
        {
            "name": "Hospital Central",
            "address": "Avenida Central #789",
            "phone_number": "1122334455",
            "email": "central@example.com",
            "contact_person": "Dr. Carmen Garcia",
            "latitude": 19.432607,
            "longitude": -99.133209,
            "uri": "",
        },
    ]
    for hosp in hospitals:
        hosp_in = Hospital(id=uuid.uuid4(), **hosp)
        exists = session.exec(select(Hospital).where((Hospital.name == hosp_in.name) | (Hospital.id == hosp_in.id))).first()
        if not exists:
            session.add(hosp_in)
    session.commit()

def init_users(session: Session, count: int = 10) -> list[User]:
    users = []
    for _ in range(count):
        email = faker.email()
        user_in = UserCreate(
            email=email,
            password="Password123",  # In production, use a secure hash!
            full_name=faker.name(),
        )
        user = crud.create_user(session=session, user_create=user_in)
        users.append(user)
    return users

def init_items(session: Session, users: list[User], count_per_user: int = 3) -> None:
    for user in users:
        for _ in range(count_per_user):
            item = Item(
                id=uuid.uuid4(),
                title=faker.sentence(nb_words=4),
                description=faker.text(max_nb_chars=100),
                owner_id=user.id,
            )
            session.add(item)
    session.commit()

def init_appointments(session: Session, count: int = 20) -> list[Appointment]:
    available_hospitals = session.exec(select(Hospital)).all()    
    appointments = []
    for _ in range(count):
        appointment = Appointment(
            id=uuid.uuid4(),
            patient_id=faker.uuid4(),
            status=random.choice(list(AppointmentStatus)),
            hospital_assigned=random.choice(available_hospitals).id,
            additional_data={"notes": faker.sentence()},
            prority=random.choice(["low", "medium", "high"]),
            medical_specialty=random.choice(especialidad),
            request_start_time=datetime.now() - timedelta(days=random.randint(1, 100)),
            appointment_creation_time=datetime.now() - timedelta(days=random.randint(0, 99)),
            pending_time=None,
            assigned_time=None,
            scheduled_time=datetime.now() + timedelta(days=random.randint(1, 50)),
        )
        session.add(appointment)
        session.commit()  # Commit so appointment.id is available
        # Add AppointmentInfo entries
        for order in range(random.randint(1, 3)):
            info = AppointmentInfo(
                id=uuid.uuid4(),
                appointment_id=appointment.id,
                content=faker.sentence(),
                order=order,
                sender="user",
                created_at=datetime.now(),
                source_type="text",
            )
            session.add(info)
        appointments.append(appointment)
    session.commit()
    return appointments

def init_patients(session: Session, count: int = 5) -> list[Patient]:
    patients = []
    for _ in range(count):
        patient = Patient(
            id=uuid.uuid4(),
            first_name=faker.first_name(),
            last_name=faker.last_name(),
            national_id=faker.uuid4(),
            date_of_birth=faker.date_of_birth(minimum_age=18, maximum_age=90),
            gender=random.choice(["M", "F", "O"]),
            email=faker.email(),
            phone_number=faker.phone_number(),
            address=faker.address(),
            city=faker.city(),
            blood_type=random.choice(["--", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
            allergies=faker.word(),
            medical_conditions=faker.sentence(),
            notes=faker.text(max_nb_chars=100),
            emergency_contact_name=faker.name(),
            emergency_contact_phone=faker.phone_number(),
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        session.add(patient)
        patients.append(patient)
    session.commit()
    return patients

def init_medical_records(session: Session, patients: list[Patient], count_per_patient: int = 2) -> None:
    for patient in patients:
        for _ in range(count_per_patient):
            record = MedicalRecord(
                id=uuid.uuid4(),
                diagnosis=faker.sentence(),
                notes=faker.text(max_nb_chars=100),
                date=datetime.now() - timedelta(days=random.randint(0, 365)),
                patient_id=patient.id,
                physician_id=None,  # Optionally assign a random user id
            )
            session.add(record)
    session.commit()

def init_prescriptions(session: Session, patients: list[Patient], count_per_patient: int = 2) -> None:
    for patient in patients:
        for _ in range(count_per_patient):
            prescription = Prescription(
                id=uuid.uuid4(),
                medication=faker.word(),
                dosage=f"{random.randint(1, 2)} tablets",
                instructions=faker.sentence(),
                duration=f"{random.randint(5, 14)} days",
                date=datetime.now() - timedelta(days=random.randint(0, 365)),
                patient_id=patient.id,
                physician_id=None,
            )
            session.add(prescription)
    session.commit()

def init_db(session: Session) -> None:
    create_db_and_tables()

    # Create superuser if not exists
    superuser = session.exec(select(User).where(User.email == settings.FIRST_SUPERUSER)).first()
    if not superuser:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        superuser = crud.create_user(session=session, user_create=user_in)

    init_hospitals(session)

    # Create synthetic users and their items
    users = init_users(session)
    init_items(session, users)

    # Create synthetic appointments with info entries
    init_appointments(session)

    # Create synthetic patients and their records/prescriptions
    patients = init_patients(session)
    init_medical_records(session, patients)
    init_prescriptions(session, patients)

def full_init() -> None:
    with Session(engine) as session:
        init_db(session)

if __name__ == "__main__":
    full_init()
