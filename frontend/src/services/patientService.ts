import api from './api';
import { 
  Patient, PatientCreate, PatientUpdate, PaginatedResponse,
  MedicalRecord, MedicalRecordCreate, Prescription, PrescriptionCreate 
} from '../types';

// Patient endpoints
export const getPatients = async (skip = 0, limit = 100): Promise<PaginatedResponse<Patient>> => {
  const response = await api.get(`/patients/?skip=${skip}&limit=${limit}`);
  return response.data;
};

export const getPatient = async (id: string): Promise<Patient> => {
  const response = await api.get(`/patients/${id}`);
  return response.data;
};

export const createPatient = async (patient: PatientCreate): Promise<Patient> => {
  const response = await api.post('/patients/', patient);
  return response.data;
};

export const updatePatient = async (id: string, patient: PatientUpdate): Promise<Patient> => {
  const response = await api.put(`/patients/${id}`, patient);
  return response.data;
};

export const deletePatient = async (id: string): Promise<Patient> => {
  const response = await api.delete(`/patients/${id}`);
  return response.data;
};

// Medical Records endpoints
export const getMedicalRecords = async (
  patientId: string, 
  skip = 0, 
  limit = 100
): Promise<PaginatedResponse<MedicalRecord>> => {
  const response = await api.get(`/patients/${patientId}/medical-records/?skip=${skip}&limit=${limit}`);
  return response.data;
};

export const getMedicalRecord = async (patientId: string, recordId: string): Promise<MedicalRecord> => {
  const response = await api.get(`/patients/${patientId}/medical-records/${recordId}`);
  return response.data;
};

export const createMedicalRecord = async (
  patientId: string, 
  record: MedicalRecordCreate
): Promise<MedicalRecord> => {
  const response = await api.post(`/patients/${patientId}/medical-records/`, record);
  return response.data;
};

export const deleteMedicalRecord = async (patientId: string, recordId: string): Promise<MedicalRecord> => {
  const response = await api.delete(`/patients/${patientId}/medical-records/${recordId}`);
  return response.data;
};

// Prescription endpoints
export const getPrescriptions = async (
  patientId: string, 
  skip = 0, 
  limit = 100
): Promise<PaginatedResponse<Prescription>> => {
  const response = await api.get(`/patients/${patientId}/prescriptions/?skip=${skip}&limit=${limit}`);
  return response.data;
};

export const getPrescription = async (patientId: string, prescriptionId: string): Promise<Prescription> => {
  const response = await api.get(`/patients/${patientId}/prescriptions/${prescriptionId}`);
  return response.data;
};

export const createPrescription = async (
  patientId: string, 
  prescription: PrescriptionCreate
): Promise<Prescription> => {
  const response = await api.post(`/patients/${patientId}/prescriptions/`, prescription);
  return response.data;
};

export const deletePrescription = async (patientId: string, prescriptionId: string): Promise<Prescription> => {
  const response = await api.delete(`/patients/${patientId}/prescriptions/${prescriptionId}`);
  return response.data;
}; 