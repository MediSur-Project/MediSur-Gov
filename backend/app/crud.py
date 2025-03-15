import uuid
from typing import Any
from datetime import datetime

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import (
    Hospital, HospitalCreate, HospitalUpdate, HospitalResponse,
    Item, ItemCreate, 
    User, UserCreate, UserUpdate,
    Patient, PatientCreate, PatientUpdate,
    MedicalRecord, MedicalRecordCreate,
    Prescription, PrescriptionCreate
)


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item

# Hospital CRUD operations
def get_hospitals(*, session: Session, skip: int = 0, limit: int = 100) -> list[Hospital]:
    statement = select(Hospital).offset(skip).limit(limit)
    hospitals = session.exec(statement).all()
    return hospitals

def get_hospital_by_id(*, session: Session, hospital_id: uuid.UUID) -> Hospital | None:
    statement = select(Hospital).where(Hospital.id == hospital_id)
    return session.exec(statement).first()

def create_hospital(*, session: Session, hospital_in: HospitalCreate) -> Hospital:
    db_hospital = Hospital.model_validate(hospital_in)
    session.add(db_hospital)
    session.commit()
    session.refresh(db_hospital)
    return db_hospital

def update_hospital(*, session: Session, db_hospital: Hospital, hospital_in: HospitalUpdate) -> Hospital:
    hospital_data = hospital_in.model_dump(exclude_unset=True)
    db_hospital.sqlmodel_update(hospital_data)
    session.add(db_hospital)
    session.commit()
    session.refresh(db_hospital)
    return db_hospital

def delete_hospital(*, session: Session, hospital_id: uuid.UUID) -> Hospital | None:
    hospital = get_hospital_by_id(session=session, hospital_id=hospital_id)
    if hospital:
        session.delete(hospital)
        session.commit()
    return hospital

# Patient CRUD operations
def get_patients(*, session: Session, skip: int = 0, limit: int = 100) -> list[Patient]:
    statement = select(Patient).offset(skip).limit(limit)
    patients = session.exec(statement).all()
    return patients

def get_patient_by_id(*, session: Session, patient_id: uuid.UUID) -> Patient | None:
    statement = select(Patient).where(Patient.id == patient_id)
    return session.exec(statement).first()

def get_patient_by_national_id(*, session: Session, national_id: str) -> Patient | None:
    statement = select(Patient).where(Patient.national_id == national_id)
    return session.exec(statement).first()

def create_patient(*, session: Session, patient_in: PatientCreate) -> Patient:
    db_patient = Patient.model_validate(patient_in)
    session.add(db_patient)
    session.commit()
    session.refresh(db_patient)
    return db_patient

def update_patient(*, session: Session, db_patient: Patient, patient_in: PatientUpdate) -> Patient:
    patient_data = patient_in.model_dump(exclude_unset=True)
    db_patient.sqlmodel_update(patient_data)
    session.add(db_patient)
    session.commit()
    session.refresh(db_patient)
    return db_patient

def delete_patient(*, session: Session, patient_id: uuid.UUID) -> Patient | None:
    patient = get_patient_by_id(session=session, patient_id=patient_id)
    if patient:
        session.delete(patient)
        session.commit()
    return patient

# Medical Record CRUD operations
def get_medical_records(*, session: Session, patient_id: uuid.UUID = None, skip: int = 0, limit: int = 100) -> list[MedicalRecord]:
    statement = select(MedicalRecord)
    if patient_id:
        statement = statement.where(MedicalRecord.patient_id == patient_id)
    statement = statement.offset(skip).limit(limit)
    medical_records = session.exec(statement).all()
    return medical_records

def get_medical_record_by_id(*, session: Session, record_id: uuid.UUID) -> MedicalRecord | None:
    statement = select(MedicalRecord).where(MedicalRecord.id == record_id)
    return session.exec(statement).first()

def create_medical_record(*, session: Session, record_in: MedicalRecordCreate) -> MedicalRecord:
    db_record = MedicalRecord.model_validate(record_in)
    session.add(db_record)
    session.commit()
    session.refresh(db_record)
    return db_record

def delete_medical_record(*, session: Session, record_id: uuid.UUID) -> MedicalRecord | None:
    record = get_medical_record_by_id(session=session, record_id=record_id)
    if record:
        session.delete(record)
        session.commit()
    return record

# Prescription CRUD operations
def get_prescriptions(*, session: Session, patient_id: uuid.UUID = None, skip: int = 0, limit: int = 100) -> list[Prescription]:
    statement = select(Prescription)
    if patient_id:
        statement = statement.where(Prescription.patient_id == patient_id)
    statement = statement.offset(skip).limit(limit)
    prescriptions = session.exec(statement).all()
    return prescriptions

def get_prescription_by_id(*, session: Session, prescription_id: uuid.UUID) -> Prescription | None:
    statement = select(Prescription).where(Prescription.id == prescription_id)
    return session.exec(statement).first()

def create_prescription(*, session: Session, prescription_in: PrescriptionCreate) -> Prescription:
    db_prescription = Prescription.model_validate(prescription_in)
    session.add(db_prescription)
    session.commit()
    session.refresh(db_prescription)
    return db_prescription

def delete_prescription(*, session: Session, prescription_id: uuid.UUID) -> Prescription | None:
    prescription = get_prescription_by_id(session=session, prescription_id=prescription_id)
    if prescription:
        session.delete(prescription)
        session.commit()
    return prescription