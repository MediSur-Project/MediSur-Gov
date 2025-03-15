import api from './api';
import { Appointment, AppointmentCreate, AppointmentUpdate, PaginatedResponse, AppointmentStatus } from '../types';

// Mock data for MVP
const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: '1',
    patient_id: 'P001',
    status: AppointmentStatus.PENDING,
    hospital_assigned: 'Hospital Central',
    prority: 'Medium',
    medical_specialty: 'Cardiology',
    request_start_time: new Date(2024, 6, 1, 10, 30).toISOString(),
    scheduled_time: new Date(2024, 6, 10, 14, 0).toISOString(),
    info_entries: []
  },
  {
    id: '2',
    patient_id: 'P002',
    status: AppointmentStatus.ASSIGNED,
    hospital_assigned: 'Hospital Norte',
    prority: 'High',
    medical_specialty: 'Neurology',
    request_start_time: new Date(2024, 6, 2, 9, 15).toISOString(),
    scheduled_time: new Date(2024, 6, 12, 10, 30).toISOString(),
    info_entries: []
  },
  {
    id: '3',
    patient_id: 'P003',
    status: AppointmentStatus.MISSING_DATA,
    request_start_time: new Date(2024, 6, 3, 11, 45).toISOString(),
    info_entries: []
  },
  {
    id: '4',
    patient_id: 'P004',
    status: AppointmentStatus.FINISHED,
    hospital_assigned: 'Hospital Este',
    prority: 'Low',
    medical_specialty: 'General',
    request_start_time: new Date(2024, 5, 25, 14, 0).toISOString(),
    scheduled_time: new Date(2024, 6, 5, 16, 15).toISOString(),
    info_entries: []
  }
];

// For MVP development
const USE_MOCK_DATA = true;

export const getAppointments = async (skip = 0, limit = 100): Promise<PaginatedResponse<Appointment>> => {
  if (USE_MOCK_DATA) {
    const mockedData = MOCK_APPOINTMENTS.slice(skip, skip + limit);
    return {
      data: mockedData,
      count: MOCK_APPOINTMENTS.length
    };
  }

  try {
    const response = await api.get(`/appointments/?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching appointments, using mock data', error);
    const mockedData = MOCK_APPOINTMENTS.slice(skip, skip + limit);
    return {
      data: mockedData,
      count: MOCK_APPOINTMENTS.length
    };
  }
};

export const getAppointment = async (id: string): Promise<Appointment> => {
  if (USE_MOCK_DATA) {
    const appointment = MOCK_APPOINTMENTS.find(a => a.id === id);
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    return appointment;
  }

  const response = await api.get(`/appointments/appointments/${id}`);
  return response.data;
};

export const createAppointment = async (appointment: AppointmentCreate): Promise<Appointment> => {
  if (USE_MOCK_DATA) {
    const newAppointment: Appointment = {
      id: Math.random().toString(36).substring(2, 9),
      patient_id: appointment.patient_id,
      status: AppointmentStatus.PENDING,
      request_start_time: new Date().toISOString(),
      info_entries: []
    };
    MOCK_APPOINTMENTS.push(newAppointment);
    return newAppointment;
  }

  const response = await api.post('/appointments/appointments', appointment);
  return response.data;
};

export const updateAppointment = async (id: string, appointment: AppointmentUpdate): Promise<Appointment> => {
  if (USE_MOCK_DATA) {
    const index = MOCK_APPOINTMENTS.findIndex(a => a.id === id);
    if (index === -1) {
      throw new Error('Appointment not found');
    }
    
    const updatedAppointment = {
      ...MOCK_APPOINTMENTS[index],
      ...appointment
    };
    
    MOCK_APPOINTMENTS[index] = updatedAppointment;
    return updatedAppointment;
  }

  const response = await api.put(`/appointments/appointments/${id}`, appointment);
  return response.data;
}; 