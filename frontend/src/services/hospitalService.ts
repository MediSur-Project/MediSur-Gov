import api from './api';
import { Hospital, HospitalCreate, HospitalUpdate, PaginatedResponse } from '../types';



export const getHospitals = async (skip = 0, limit = 100): Promise<PaginatedResponse<Hospital>> => {
  const response = await api.get(`/hospitals/?skip=${skip}&limit=${limit}`);
  return response.data;
};

export const getHospital = async (id: string): Promise<Hospital> => {
  const response = await api.get(`/hospitals/${id}`);
  return response.data;
};

export const createHospital = async (hospital: HospitalCreate): Promise<Hospital> => {
  const response = await api.post('/hospitals/', hospital);
  return response.data;
};

export const updateHospital = async (id: string, hospital: HospitalUpdate): Promise<Hospital> => {
  const response = await api.put(`/hospitals/${id}`, hospital);
  return response.data;
};

export const deleteHospital = async (id: string): Promise<Hospital> => {
  const response = await api.delete(`/hospitals/${id}`);
  return response.data;
}; 