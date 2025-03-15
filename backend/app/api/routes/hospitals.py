from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.api.deps import get_current_active_superuser, get_current_user, get_db
from app.crud import (
    create_hospital, delete_hospital, get_hospital_by_id, 
    get_hospitals, update_hospital
)
from app.models import (
    Hospital, HospitalCreate, HospitalResponse, 
    HospitalsPublic, HospitalUpdate, User
)

router = APIRouter(prefix="/hospitals", tags=["hospitals"])


@router.get("/", response_model=HospitalsPublic)
def read_hospitals(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve hospitals.
    """
    hospitals = get_hospitals(session=db, skip=skip, limit=limit)
    return HospitalsPublic(data=hospitals, count=len(hospitals))


@router.post("/", response_model=HospitalResponse, status_code=201)
def create_hospital_api(
    *,
    hospital_in: HospitalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    Create new hospital.
    """
    hospital = create_hospital(session=db, hospital_in=hospital_in)
    return hospital


@router.get("/{hospital_id}", response_model=HospitalResponse)
def read_hospital(
    *,
    hospital_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get hospital by ID.
    """
    hospital = get_hospital_by_id(session=db, hospital_id=hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital


@router.put("/{hospital_id}", response_model=HospitalResponse)
def update_hospital_api(
    *,
    hospital_id: uuid.UUID,
    hospital_in: HospitalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    Update a hospital.
    """
    hospital = get_hospital_by_id(session=db, hospital_id=hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    hospital = update_hospital(
        session=db, db_hospital=hospital, hospital_in=hospital_in
    )
    return hospital


@router.delete("/{hospital_id}", response_model=HospitalResponse)
def delete_hospital_api(
    *,
    hospital_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    Delete a hospital.
    """
    hospital = get_hospital_by_id(session=db, hospital_id=hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    hospital = delete_hospital(session=db, hospital_id=hospital_id)
    return hospital 