import api from './api';
import { Appointment, AppointmentCreate, AppointmentUpdate, PaginatedResponse, AppointmentStatus } from '../types';

export const getAppointments = async (skip = 0, limit = 100): Promise<PaginatedResponse<Appointment>> => {
  try {
    const response = await api.get(`/appointments/all?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
};

export const getAppointment = async (id: string): Promise<Appointment> => {
  const response = await api.get(`/appointments/appointments/${id}`);
  return response.data;
};

export const createAppointment = async (appointment: AppointmentCreate): Promise<Appointment> => {
  const response = await api.post('/appointments/appointments', appointment);
  return response.data;
};

export const updateAppointment = async (id: string, appointment: AppointmentUpdate): Promise<Appointment> => {
  const response = await api.put(`/appointments/appointments/${id}`, appointment);
  return response.data;
}; 