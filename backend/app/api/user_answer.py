import random
from app.crud import get_hospitals
import openai
import requests
from typing import Optional, List
from pydantic import BaseModel, Field
from openai import OpenAI
from app.core.config import settings
import os
from app.models import AppointmentInfo
from sqlmodel import select
from sqlalchemy.orm import Session
# Constants (Replace with real API keys)
OPENAI_API_KEY = settings.OPENAI_API_KEY
PERPLEXITY_API_KEY = settings.PERPLEXITY_API_KEY
client = OpenAI(api_key=OPENAI_API_KEY)
especialidad = [
    "Anestesiología",
    "Cardiología",
    "Dermatología",
    "Cirugía General",
    "Medicina de Emergencias",
    "Endocrinología",
    "Medicina Familiar",
    "Gastroenterología",
    "Geriatría",
    "Hematología",
    "Enfermedades Infecciosas",
    "Medicina Interna",
    "Nefrología",
    "Neumología",
    "Neurología",
    "Obstetricia y Ginecología",
    "Oncología",
    "Oftalmología",
    "Otorrinolaringología",
    "Ortopedia",
    "Patología",
    "Pediatría",
    "Psiquiatría",
    "Radiología",
    "Reumatología",
    "Urología",
    "Medicina Nuclear",
    "Cirugía Plástica",
    "Cirugía Cardiovascular",
    "Neurocirugía"
]

# --- SCHEMA DEFINITIONS --- #

class RawUserInput(BaseModel):
    """Raw, unstructured input from user"""
    user_id: str
    chat: list # List of chat messages
    num_previous_questions: Optional[int] = 0

class StructuredUserInput(BaseModel):
    """Structured form of user input after processing by an LLM"""
    symptoms: List[str] = Field(..., description="List of detected symptoms")
    duration: Optional[str] = Field(None, description="Parsed duration of symptoms")
    severity: Optional[str] = Field(None, description="Severity level (e.g., 'mild', 'moderate', 'severe')")
    medical_history: Optional[List[str]] = Field(None, description="User's medical history, if detected")
    age: Optional[int] = Field(None, description="User's age, if detected")
    gender: Optional[str] = Field(None, description="User's gender, if detected")


class LLMQuestionResponse(BaseModel):
    """Response from LLM indicating whether further questions are needed"""
    further_questions: Optional[List[str]]


class TriageResult(BaseModel):
    """Output of the triage system, determining urgency and specialty"""
    urgency: str  # "Low", "Moderate", "High", "Emergency"
    specialty: str  # Suggested medical specialty


class DoctorSuggestions(BaseModel):
    """Medical information retrieved from Perplexity API"""
    possible_diagnoses: List[str]
    treatment_guidelines: List[str]


# --- LLM INTEGRATION --- #

def call_openai(prompt: str, output: type, model: str = "gpt-4o-mini") -> str:
    """Generic function to query OpenAI API."""
    response = client.beta.chat.completions.parse(model=model,
        messages=[{"role": "system", "content": "You are a medical assistant for latin american countries. The user is a patient with a medical issue. He may speak most probably in Spanish or Portuguese. Answer in the same language. Parts of the text instructions are in English."},
                  {"role": "user", "content": prompt}],
        temperature=0.2,
        response_format=output)
    return response.choices[0].message.parsed

def parse_user_input(raw_input: RawUserInput) -> StructuredUserInput:
    """Uses OpenAI to convert unstructured user input into structured format."""
    chat_str = "---".join(raw_input.chat)
    prompt = f"""
    Extract structured medical information from the following patient input:
    "{chat_str}"
    
    Return a JSON object with keys:
    - symptoms (list of symptoms)
    - duration (text-based duration e.g., "3 days")
    - severity (mild, moderate, severe)
    - medical_history (list of past conditions, if mentioned)
    - age (integer, if mentioned)
    - gender (male, female, or unknown, if mentioned)
    """
    
    return call_openai(prompt, StructuredUserInput)

def get_further_questions(context: StructuredUserInput) -> LLMQuestionResponse:
    """Asks OpenAI if additional information is needed."""
    prompt = f"""
    Given this structured patient data:
    {context.model_dump_json()}
    
    Determine if any crucial medical details are missing and list up to 3 additional questions to ask.
    Return as a JSON object with key 'further_questions' as a list of questions.
    """
    
    return call_openai(prompt, LLMQuestionResponse)


def triage_patient(context: StructuredUserInput) -> TriageResult:
    """Determines urgency and required specialty using OpenAI."""
    prompt = f"""
    Given this structured patient data:
    {context.model_dump_json()}
    
    Determine:
    - The urgency of the case (Low, Moderate, High, Emergency)
    - The best medical specialty to handle the case.
    
    Return JSON with keys:
    - urgency (string)
    - specialty (string)
    The options for specialty are:
    {', '.join(especialidad)}
    """
    
    return call_openai(prompt, TriageResult)


# --- PERPLEXITY INTEGRATION --- #

def get_doctor_suggestions(context: StructuredUserInput) -> DoctorSuggestions:
    """Queries Perplexity API for diagnosis and treatment suggestions."""
    query = f"""
    The patient presents with the following symptoms:
    {', '.join(context.symptoms)}

    Duration: {context.duration}
    Severity: {context.severity}
    Medical History: {context.medical_history or 'None'}

    What are the most likely diagnoses? What are standard treatment guidelines?
    """

    # Temporary switch to OpenAI for demo purposes
    return call_openai(query, DoctorSuggestions)
    
    headers = {"Authorization": f"Bearer {PERPLEXITY_API_KEY}"}
    response = requests.post(
        "https://api.perplexity.ai/v1/query",
        json={"query": query},
        headers=headers
    )
    
    if response.status_code == 200:
        result = response.json()
        return DoctorSuggestions(
            possible_diagnoses=result["diagnoses"],
            treatment_guidelines=result["treatment_guidelines"]
        )
    else:
        raise RuntimeError(f"Perplexity API error: {response.status_code}")

def get_hospital():
    hosp = get_hospitals()
    return random.choice(hosp)

# --- MAIN PROCESS FLOW --- #

class MedicalCaseResult(BaseModel):
    raw_input: RawUserInput
    extra_questions: Optional[LLMQuestionResponse] = None
    triage: Optional[TriageResult] = None
    doctor_suggestions: Optional[DoctorSuggestions] = None
    assigned_hospital: Optional[str] = None

def process_medical_case(raw_input: RawUserInput):
    """Orchestrates the entire process flow."""
    MAX_QUESTIONS = 1
    # Step 1: Parse raw input into structured format
    structured_input = parse_user_input(raw_input)
    ask_questions = raw_input.num_previous_questions is None or raw_input.num_previous_questions < MAX_QUESTIONS
    
    # Step 2: Check if more questions are needed
    if ask_questions:
        llm_response = get_further_questions(structured_input)
        if llm_response.further_questions:
            # Simulating user response (replace with actual user interaction)
            if raw_input.num_previous_questions is None or raw_input.num_previous_questions == 0:
                return MedicalCaseResult(raw_input=raw_input, extra_questions=llm_response)
    extra_questions = None    
    # Step 3: Run triage
    triage_result = triage_patient(structured_input)
    
    # Step 4: Fetch doctor suggestions from Perplexity
    doctor_suggestions = get_doctor_suggestions(structured_input)
    
    return MedicalCaseResult(
        raw_input=raw_input,
        triage=triage_result,
        doctor_suggestions=doctor_suggestions,
        assigned_hospital=get_hospital()
    )


# --- USAGE EXAMPLE --- #

if __name__ == "__main__":
    extra_questions = True
    raw_data = RawUserInput(user_id="12345", chat=["I've had a cough and fever for 4 days, it's getting worse."])
    while extra_questions:
        result = process_medical_case(raw_data)
        extra_questions = result.extra_questions is not None and len(result.extra_questions.further_questions) > 0
        if extra_questions:
            print("Additional questions needed:")
            for question in result.extra_questions.further_questions:
                print(question)
            user = input("Enter your response: ")
            extra_context = ' '.join(result.raw_input.chat)
            raw_data.chat.append(extra_context)
            raw_data.chat.append(user)
            raw_data.num_previous_questions = 1 + (raw_data.num_previous_questions or 0)
    print(result)


def ask_more_questions(db: Session, appointment_id: str):
    """Asks OpenAI if additional information is needed."""
    current_info = db.get(AppointmentInfo, appointment_id)
    """Asks OpenAI if additional information is needed."""
    # Get all information related to this appointment
    stmt = select(AppointmentInfo).where(AppointmentInfo.appointment_id == appointment_id).order_by(AppointmentInfo.order)
    appointment_info = db.exec(stmt).all()
    
    if not appointment_info:
        return  # No information to process
    
    # Combine all information into a single string
    patient_input = []
    for info in appointment_info:
        patient_input.append(info.content)
    
    print(patient_input)