// Generic response type for paginated data
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
}

// Hospital Types
export enum HospitalStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  UNKNOWN = "unknown"
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone_number: string;
  email: string;
  contact_person: string;
  latitude: number;
  longitude: number;
  status: HospitalStatus;
  uri?: string;
}

export interface HospitalCreate {
  name: string;
  address: string;
  phone_number: string;
  email: string;
  contact_person: string;
  latitude: number;
  longitude: number;
  status: HospitalStatus;
  uri?: string;
}

export interface HospitalUpdate {
  name?: string;
  address?: string;
  phone_number?: string;
  email?: string;
  contact_person?: string;
  latitude?: number;
  longitude?: number;
  status?: HospitalStatus;
  uri?: string;
}

// Patient Types
export enum Gender {
  MALE = "M",
  FEMALE = "F",
  OTHER = "O",
}

export enum BloodType {
  UNKNOWN = "--",
  A_POSITIVE = "A+",
  A_NEGATIVE = "A-",
  B_POSITIVE = "B+",
  B_NEGATIVE = "B-",
  AB_POSITIVE = "AB+",
  AB_NEGATIVE = "AB-",
  O_POSITIVE = "O+",
  O_NEGATIVE = "O-",
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  national_id: string;
  date_of_birth: string;
  gender: Gender;
  email?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  blood_type: BloodType;
  allergies?: string;
  medical_conditions?: string;
  notes?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface PatientCreate {
  first_name: string;
  last_name: string;
  national_id: string;
  date_of_birth: string;
  gender: Gender;
  email?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  blood_type?: BloodType;
  allergies?: string;
  medical_conditions?: string;
  notes?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface PatientUpdate {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: Gender;
  email?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  blood_type?: BloodType;
  allergies?: string;
  medical_conditions?: string;
  notes?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

// Appointment Types
export enum AppointmentStatus {
  MISSING_DATA = "missing_data",
  PENDING = "pending",
  ASSIGNED = "assigned",
  FINISHED = "finished",
}

export interface AppointmentInfo {
  id: string;
  appointment_id: string;
  content: string;
  order: number;
  created_at: string;
  source_type: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  status: AppointmentStatus;
  hospital_assigned?: string;
  additional_data?: Record<string, any>;
  prority?: string;
  contagious?: boolean;
  medical_specialty?: string;
  request_start_time: string;
  appointment_creation_time?: string;
  pending_time?: string;
  assigned_time?: string;
  scheduled_time?: string;
  info_entries: AppointmentInfo[];
}

export interface AppointmentCreate {
  patient_id: string;
}

export interface AppointmentUpdate {
  status?: AppointmentStatus;
  hospital_assigned?: string;
  additional_data?: Record<string, any>;
  scheduled_time?: string;
}

// Medical Record Types
export interface MedicalRecord {
  id: string;
  patient_id: string;
  physician_id?: string;
  diagnosis: string;
  notes?: string;
  date: string;
}

export interface MedicalRecordCreate {
  diagnosis: string;
  notes?: string;
  date?: string;
}

// Prescription Types
export interface Prescription {
  id: string;
  patient_id: string;
  physician_id?: string;
  medication: string;
  dosage: string;
  instructions: string;
  duration: string;
  date: string;
}

export interface PrescriptionCreate {
  medication: string;
  dosage: string;
  instructions: string;
  duration: string;
  date?: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  full_name?: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
} 