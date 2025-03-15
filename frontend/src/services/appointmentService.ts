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

export const getContagiousAppointments = async (
  params: {
    hospitalId?: string;
    startDate?: string;
    endDate?: string;
    skip?: number;
    limit?: number;
  } = {}
): Promise<PaginatedResponse<Appointment>> => {
  try {
    const { hospitalId, startDate, endDate, skip = 0, limit = 1000 } = params;
    let url = `/appointments/all?skip=${skip}&limit=${limit}&contagious=true`;
    
    if (hospitalId) {
      url += `&hospital_assigned=${hospitalId}`;
    }
    
    if (startDate) {
      url += `&start_date=${startDate}`;
    }
    
    if (endDate) {
      url += `&end_date=${endDate}`;
    }
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching contagious appointments:', error);
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