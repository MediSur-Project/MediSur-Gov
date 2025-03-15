
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from typing import Any
import uuid

from app.api.deps import get_current_active_superuser, get_current_user, get_db
from app.crud import (
    create_patient, delete_patient, get_patient_by_id, get_patients, update_patient,
    create_medical_record, delete_medical_record, get_medical_record_by_id, get_medical_records,
    create_prescription, delete_prescription, get_prescription_by_id, get_prescriptions
)
from app.models import (
    Patient, PatientCreate, PatientResponse, PatientsPublic, PatientUpdate,
    MedicalRecord, MedicalRecordCreate, MedicalRecordResponse, MedicalRecordsPublic,
    Prescription, PrescriptionCreate, PrescriptionResponse, PrescriptionsPublic,
    User
)

router = APIRouter(prefix="/patients", tags=["patients"])

# Patient endpoints
@router.get("/", response_model=PatientsPublic)
def read_patients(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve patients.
    """
    patients = get_patients(session=db, skip=skip, limit=limit)
    return PatientsPublic(data=patients, count=len(patients))


@router.post("/", response_model=PatientResponse, status_code=201)
def create_patient_api(
    *,
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create new patient.
    """
    patient = create_patient(session=db, patient_in=patient_in)
    return patient


@router.get("/{patient_id}", response_model=PatientResponse)
def read_patient(
    *,
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get patient by ID.
    """
    patient = get_patient_by_id(session=db, patient_id=patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient_api(
    *,
    patient_id: uuid.UUID,
    patient_in: PatientUpdate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update a patient.
    """
    patient = get_patient_by_id(session=db, patient_id=patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient = update_patient(
        session=db, db_patient=patient, patient_in=patient_in
    )
    return patient


@router.delete("/{patient_id}", response_model=PatientResponse)
def delete_patient_api(
    *,
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    Delete a patient.
    """
    patient = get_patient_by_id(session=db, patient_id=patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient = delete_patient(session=db, patient_id=patient_id)
    return patient

# Medical Record endpoints
@router.get("/{patient_id}/medical-records/", response_model=MedicalRecordsPublic)
def read_medical_records(
    *,
    patient_id: uuid.UUID,
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve medical records for a patient.
    """
    patient = get_patient_by_id(session=db, patient_id=patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    records = get_medical_records(session=db, patient_id=patient_id, skip=skip, limit=limit)
    return MedicalRecordsPublic(data=records, count=len(records))


@router.post("/{patient_id}/medical-records/", response_model=MedicalRecordResponse, status_code=201)
def create_medical_record_api(
    *,
    patient_id: uuid.UUID,
    record_in: MedicalRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create new medical record for a patient.
    """
    patient = get_patient_by_id(session=db, patient_id=patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Ensure patient_id in path is used
    record_data = record_in.model_dump()
    record_data["patient_id"] = patient_id
    record_data["physician_id"] = current_user.id
    
    record = create_medical_record(session=db, record_in=MedicalRecordCreate(**record_data))
    return record


@router.get("/{patient_id}/medical-records/{record_id}", response_model=MedicalRecordResponse)
def read_medical_record(
    *,
    patient_id: uuid.UUID,
    record_id: uuid.UUID,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get medical record by ID.
    """
    patient = get_patient_by_id(session=db, patient_id=patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    record = get_medical_record_by_id(session=db, record_id=record_id)
    if not record or record.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="Medical record not found")
    
    return record


@router.delete("/{patient_id}/medical-records/{record_id}", response_model=MedicalRecordResponse)
def delete_medical_record_api(
    *,
    patient_id: uuid.UUID,
    record_id: uuid.UUID,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
) -> Any:
    """
    Delete a medical record.
    """
    patient = get_patient_by_id(session=db, patient_id=patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    record = get_medical_record_by_id(session=db, record_id=record_id)
    if not record or record.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="Medical record not found")
    
    record = delete_medical_record(session=db, record_id=record_id)
    return record

# Prescription endpoints
@router.get("/{patient_id}/prescriptions/", response_model=PrescriptionsPublic)
def read_prescriptions(
    *,
    patient_id: uuid.UUID,
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve prescriptions for a patient.
    """
    patient = get_patient_by_id(session=db, patient_id=patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    prescriptions = get_prescriptions(session=db, patient_id=patient_id, skip=skip, limit=limit)
    return PrescriptionsPublic(data=prescriptions, count=len(prescriptions))


@router.post("/{patient_id}/prescriptions/", response_model=PrescriptionResponse, status_code=201)
def create_prescription_api(
    *,
    patient_id: uuid.UUID,
    prescription_in: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create new prescription for a patient.
    """
    patient = get_patient_by_id(session=db, patient_id=patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Ensure patient_id in path is used
    prescription_data = prescription_in.model_dump()
    prescription_data["patient_id"] = patient_id
    prescription_data["physician_id"] = current_user.id
    
    prescription = create_prescription(session=db, prescription_in=PrescriptionCreate(**prescription_data))
    return prescription


@router.get("/{patient_id}/prescriptions/{prescription_id}", response_model=PrescriptionResponse)
def read_prescription(
    *,
    patient_id: uuid.UUID,
    prescription_id: uuid.UUID,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get prescription by ID.
    """
    patient = get_patient_by_id(session=db, patient_id=patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    prescription = get_prescription_by_id(session=db, prescription_id=prescription_id)
    if not prescription or prescription.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    return prescription


@router.delete("/{patient_id}/prescriptions/{prescription_id}", response_model=PrescriptionResponse)
def delete_prescription_api(
    *,
    patient_id: uuid.UUID,
    prescription_id: uuid.UUID,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
) -> Any:
    """
    Delete a prescription.
    """
    patient = get_patient_by_id(session=db, patient_id=patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    prescription = get_prescription_by_id(session=db, prescription_id=prescription_id)
    if not prescription or prescription.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    prescription = delete_prescription(session=db, prescription_id=prescription_id)
    return prescription 