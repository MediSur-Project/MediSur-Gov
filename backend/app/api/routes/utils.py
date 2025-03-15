from fastapi import APIRouter, Depends
from pydantic.networks import EmailStr

from app.api.deps import get_current_active_superuser
from app.models import Message, AppointmentInfo
from app.utils import generate_test_email, send_email
from sqlmodel import select
from sqlalchemy.orm import Session
from datetime import datetime

router = APIRouter(prefix="/utils", tags=["utils"])


@router.post(
    "/test-email/",
    dependencies=[Depends(get_current_active_superuser)],
    status_code=201,
)
def test_email(email_to: EmailStr) -> Message:
    """
    Test emails.
    """
    email_data = generate_test_email(email_to=email_to)
    send_email(
        email_to=email_to,
        subject=email_data.subject,
        html_content=email_data.html_content,
    )
    return Message(message="Test email sent")


@router.get("/health-check/")
async def health_check() -> bool:
    return True


def register_message(db: Session, appointment_id: str, message: str):
        # Get the current highest order
        stmt = select(AppointmentInfo).where(AppointmentInfo.appointment_id == appointment_id).order_by(AppointmentInfo.order.desc())
        last_info = db.exec(stmt).first()
        next_order = 1 if last_info is None else last_info.order + 1
        
        # Create a new AppointmentInfo entry
        new_info = AppointmentInfo(
            appointment_id=appointment_id,
            content=message,
            order=next_order,
            source_type="text",
            created_at=datetime.now()
        )
        
        db.add(new_info)
        db.commit()
        db.refresh(new_info)