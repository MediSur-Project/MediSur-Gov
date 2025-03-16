import uuid
import random
import math
from datetime import datetime, timedelta

from faker import Faker
from sqlmodel import Session, create_engine, select, SQLModel, delete

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
    especialidad,
    severity
)

# Set seeds for deterministic data generation
RANDOM_SEED = 42
random.seed(RANDOM_SEED)
faker = Faker()
faker.seed_instance(RANDOM_SEED)
engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def check_table_has_data(session: Session, model_class) -> bool:
    """Check if a table has any data."""
    return session.exec(select(model_class).limit(1)).first() is not None

def clear_table(session: Session, model_class) -> None:
    """Clear all data from a table."""
    session.exec(delete(model_class))
    session.commit()

def init_hospitals(session: Session) -> None:
    # Check if hospitals already exist
    if check_table_has_data(session, Hospital):
        return
        
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
        session.add(hosp_in)
    session.commit()

def init_users(session: Session, patients: list[Patient], count: int = 10) -> list[User]:
    # Check if users already exist
    if check_table_has_data(session, User):
        return session.exec(select(User)).all()
        
    users = []
    for patient in patients:
        email = faker.email()
        user_in = UserCreate(
            email=email,
            password="Password123",  # In production, use a secure hash!
            full_name=faker.name(),
            patient_id=patient.id,
        )
        user = crud.create_user(session=session, user_create=user_in, patient=patient)
        users.append(user)
    return users

def init_items(session: Session, users: list[User], count_per_user: int = 3) -> None:
    # Check if items already exist
    if check_table_has_data(session, Item):
        return
        
    items_to_add = []
    for user in users:
        for _ in range(count_per_user):
            item = Item(
                id=uuid.uuid4(),
                title=faker.sentence(nb_words=4),
                description=faker.text(max_nb_chars=100),
                owner_id=user.id,
            )
            items_to_add.append(item)
    
    # Batch insert items
    session.add_all(items_to_add)
    session.commit()

def calculate_contagious_probability(days_from_now: int, pandemic_start: int = 15, baseline: float = 0.05, peak: float = 0.9) -> float:
    """
    Calculate probability of being contagious based on days from current date using an exponential function.
    
    Args:
        days_from_now: Number of days from current date (positive = in the past)
        pandemic_start: When the pandemic started (days ago)
        baseline: Base probability before pandemic starts
        peak: Maximum probability at present day
    
    Returns:
        Probability from 0.0 to 1.0
    """
    if days_from_now > pandemic_start:
        return baseline
    elif days_from_now < 0:
        return 0.3
    else:
        normalized_time = 1 - (days_from_now / pandemic_start)
        a = 5.0  # steepness factor, adjust as needed
        probability = baseline + (peak - baseline) * (1 - math.exp(-a * normalized_time))
        return probability

def init_appointments(session: Session, count: int = 3000) -> list[Appointment]:
    # Check if appointments already exist
    if check_table_has_data(session, Appointment):
        return session.exec(select(Appointment)).all()
    
    available_hospitals = session.exec(select(Hospital)).all()    
    appointments = []
    appointment_infos = []
    
    for _ in range(count):
        days_ago = random.randint(0, 60)
        request_time = datetime.now() - timedelta(days=days_ago)
        
        # Creation time is close to request time
        creation_time = request_time + timedelta(hours=random.randint(0, 24))
        
        # Calculate contagious probability based on days from now
        contagious_probability = calculate_contagious_probability(days_ago)
        is_contagious = random.random() < contagious_probability
        
        appointment = Appointment(
            id=uuid.uuid4(),
            patient_id=faker.uuid4(),
            status=random.choice(list(AppointmentStatus)),
            hospital_assigned=random.choice(available_hospitals).id,
            additional_data={"notes": faker.sentence()},
            prority=random.choice(severity),
            medical_specialty=random.choice(especialidad),
            request_start_time=request_time,
            appointment_creation_time=creation_time,
            pending_time=None,
            assigned_time=None,
            contagious=is_contagious,
            scheduled_time=datetime.now() + timedelta(days=random.randint(1, 50)),
        )
        appointments.append(appointment)
    
    # Batch insert appointments
    session.add_all(appointments)
    session.commit()  # Need to commit to get IDs
    
    # Create appointment info entries in batch
    for appointment in appointments:
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
            appointment_infos.append(info)
    
    # Batch insert appointment infos
    session.add_all(appointment_infos)
    session.commit()
    
    return appointments

def init_patients(session: Session, count: int = 5) -> list[Patient]:
    # Check if patients already exist
    if check_table_has_data(session, Patient):
        return session.exec(select(Patient)).all()
        
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
        patients.append(patient)
    
    # Batch insert patients
    session.add_all(patients)
    session.commit()
    return patients

def init_medical_records(session: Session, patients: list[Patient], count_per_patient: int = 2) -> None:
    # Check if medical records already exist
    if check_table_has_data(session, MedicalRecord):
        return
        
    records = []
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
            records.append(record)
    
    # Batch insert medical records
    session.add_all(records)
    session.commit()

def init_prescriptions(session: Session, patients: list[Patient], count_per_patient: int = 2) -> None:
    # Check if prescriptions already exist
    if check_table_has_data(session, Prescription):
        return
        
    prescriptions = []
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
            prescriptions.append(prescription)
    
    # Batch insert prescriptions
    session.add_all(prescriptions)
    session.commit()

def init_db(session: Session) -> None:
    create_db_and_tables()

    # Create superuser if not exists
    superuser = session.exec(select(User).where(User.email == settings.FIRST_SUPERUSER)).first()
    if not superuser:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            national_id=faker.uuid4(),
            is_superuser=True,
        )
        superuser = crud.create_user(session=session, user_create=user_in, patient=None)

    init_hospitals(session)
    patients = init_patients(session)

    # Create synthetic users and their items
    users = init_users(session, patients)

    # Create synthetic appointments with info entries
    init_appointments(session)  # Increased count for better pandemic simulation

    # Create synthetic patients and their records/prescriptions
    init_medical_records(session, patients)
    init_prescriptions(session, patients)

def full_init() -> None:
    with Session(engine) as session:
        init_db(session)

if __name__ == "__main__":
    full_init()
