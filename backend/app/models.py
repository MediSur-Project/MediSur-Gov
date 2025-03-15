import uuid
import enum
from datetime import datetime

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import Column, JSON


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(max_length=255)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)


# Appointment status enum
class AppointmentStatus(str, enum.Enum):
    MISSING_DATA = "missing_data"
    PENDING = "pending"
    ASSIGNED = "assigned"
    FINISHED = "finished"


# Appointment model
class AppointmentBase(SQLModel):
    patient_id: str
    status: AppointmentStatus = Field(default=AppointmentStatus.MISSING_DATA)
    hospital_assigned: str | None = Field(default=None, max_length=255)
    additional_data: dict | None = Field(default=None, sa_column=Column(JSON))
    prority: str | None = Field(default=None, max_length=255)
    medical_specialty: str | None = Field(default=None, max_length=255)
    
    # Timestamps
    request_start_time: datetime = Field(default_factory=datetime.now)
    appointment_creation_time: datetime | None = Field(default=None)
    pending_time: datetime | None = Field(default=None)
    assigned_time: datetime | None = Field(default=None)
    scheduled_time: datetime | None = Field(default=None)


# Database model
class Appointment(AppointmentBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    info_entries: list["AppointmentInfo"] = Relationship(back_populates="appointment", sa_relationship_kwargs={"cascade": "all, delete-orphan"})


# Appointment Information Entry model
class AppointmentInfo(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    appointment_id: uuid.UUID = Field(foreign_key="appointment.id", nullable=False, ondelete="CASCADE")
    content: str = Field(...)
    order: int = Field(default=0)
    sender: str = Field(default="user")
    created_at: datetime = Field(default_factory=datetime.now)
    source_type: str = Field(default="text")  # Can be "text", "audio", etc.
    
    # Relationship back to the appointment
    appointment: Appointment = Relationship(back_populates="info_entries")


# AppointmentInfo creation model
class AppointmentInfoCreate(SQLModel):
    content: str
    order: int
    source_type: str = "text"


# AppointmentInfo response model
class AppointmentInfoResponse(SQLModel):
    id: uuid.UUID
    appointment_id: uuid.UUID
    content: str
    order: int
    created_at: datetime
    source_type: str


# Properties to receive on appointment creation
class AppointmentCreate(SQLModel):
    patient_id: str


# Properties to return via API
class AppointmentResponse(AppointmentBase):
    id: uuid.UUID
    info_entries: list[AppointmentInfoResponse] = []


# Properties to update appointment
class AppointmentUpdate(SQLModel):
    status: AppointmentStatus | None = Field(default=None)
    hospital_assigned: str | None = Field(default=None)
    additional_data: dict | None = Field(default=None)
    scheduled_time: datetime | None = Field(default=None)


# List of appointments
class AppointmentsPublic(SQLModel):
    data: list[AppointmentResponse]
    count: int

class HospitalBase(SQLModel):
    name: str = Field(max_length=255)
    address: str = Field(max_length=255)
    latitude: float = Field(default=0.0)
    longitude: float = Field(default=0.0)
    phone_number: str = Field(max_length=255)
    email: EmailStr = Field(max_length=255)
    contact_person: str = Field(max_length=255)


# Hospital database model
class Hospital(HospitalBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)


# Hospital create model
class HospitalCreate(HospitalBase):
    pass


# Hospital response model
class HospitalResponse(HospitalBase):
    id: uuid.UUID


# Hospital update model
class HospitalUpdate(SQLModel):
    name: str | None = Field(default=None)
    address: str | None = Field(default=None)
    phone_number: str | None = Field(default=None)
    email: EmailStr | None = Field(default=None)
    contact_person: str | None = Field(default=None)
    latitude: float | None = Field(default=None)
    longitude: float | None = Field(default=None)


# Hospitals list response
class HospitalsPublic(SQLModel):
    data: list[HospitalResponse]
    count: int


# Gender enum for Patient
class Gender(str, enum.Enum):
    MALE = "M"
    FEMALE = "F"
    OTHER = "O"


# Blood type enum for Patient
class BloodType(str, enum.Enum):
    UNKNOWN = "--"
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"


# Patient base model
class PatientBase(SQLModel):
    first_name: str
    last_name: str
    national_id: str = Field(unique=True, index=True)
    date_of_birth: datetime
    gender: Gender
    
    # Contact information
    email: EmailStr | None = Field(default=None)
    phone_number: str | None = Field(default=None)
    address: str | None = Field(default=None)
    city: str | None = Field(default=None)
    
    # Medical information
    blood_type: BloodType = Field(default=BloodType.UNKNOWN)
    allergies: str | None = Field(default=None)
    medical_conditions: str | None = Field(default=None)
    notes: str | None = Field(default=None)
    emergency_contact_name: str | None = Field(default=None)
    emergency_contact_phone: str | None = Field(default=None)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


# Patient database model
class Patient(PatientBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    medical_records: list["MedicalRecord"] = Relationship(back_populates="patient", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    prescriptions: list["Prescription"] = Relationship(back_populates="patient", sa_relationship_kwargs={"cascade": "all, delete-orphan"})


# Patient create model
class PatientCreate(PatientBase):
    pass


# Patient update model
class PatientUpdate(SQLModel):
    first_name: str | None = Field(default=None)
    last_name: str | None = Field(default=None)
    date_of_birth: datetime | None = Field(default=None)
    gender: Gender | None = Field(default=None)
    email: EmailStr | None = Field(default=None)
    phone_number: str | None = Field(default=None)
    address: str | None = Field(default=None)
    city: str | None = Field(default=None)
    blood_type: BloodType | None = Field(default=None)
    allergies: str | None = Field(default=None)
    medical_conditions: str | None = Field(default=None)
    notes: str | None = Field(default=None)
    emergency_contact_name: str | None = Field(default=None)
    emergency_contact_phone: str | None = Field(default=None)
    updated_at: datetime = Field(default_factory=datetime.now)


# Patient response model
class PatientResponse(PatientBase):
    id: uuid.UUID


# Patients list response
class PatientsPublic(SQLModel):
    data: list[PatientResponse]
    count: int


# MedicalRecord base model
class MedicalRecordBase(SQLModel):
    diagnosis: str
    notes: str | None = Field(default=None)
    date: datetime = Field(default_factory=datetime.now)


# MedicalRecord database model
class MedicalRecord(MedicalRecordBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: uuid.UUID = Field(foreign_key="patient.id", nullable=False, ondelete="CASCADE")
    patient: Patient = Relationship(back_populates="medical_records")
    physician_id: uuid.UUID | None = Field(foreign_key="user.id", nullable=True, ondelete="SET NULL")
    physician: User | None = Relationship()


# MedicalRecord create model
class MedicalRecordCreate(MedicalRecordBase):
    patient_id: uuid.UUID
    physician_id: uuid.UUID | None = None


# MedicalRecord response model
class MedicalRecordResponse(MedicalRecordBase):
    id: uuid.UUID
    patient_id: uuid.UUID
    physician_id: uuid.UUID | None = None


# MedicalRecords list response
class MedicalRecordsPublic(SQLModel):
    data: list[MedicalRecordResponse]
    count: int


# Prescription base model
class PrescriptionBase(SQLModel):
    medication: str
    dosage: str
    instructions: str
    duration: str
    date: datetime = Field(default_factory=datetime.now)


# Prescription database model
class Prescription(PrescriptionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: uuid.UUID = Field(foreign_key="patient.id", nullable=False, ondelete="CASCADE")
    patient: Patient = Relationship(back_populates="prescriptions")
    physician_id: uuid.UUID | None = Field(foreign_key="user.id", nullable=True, ondelete="SET NULL")
    physician: User | None = Relationship()


# Prescription create model
class PrescriptionCreate(PrescriptionBase):
    patient_id: uuid.UUID
    physician_id: uuid.UUID | None = None


# Prescription response model
class PrescriptionResponse(PrescriptionBase):
    id: uuid.UUID
    patient_id: uuid.UUID
    physician_id: uuid.UUID | None = None


# Prescriptions list response
class PrescriptionsPublic(SQLModel):
    data: list[PrescriptionResponse]
    count: int
