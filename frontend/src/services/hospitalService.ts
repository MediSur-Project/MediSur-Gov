import api from './api';
import { Hospital, HospitalCreate, HospitalUpdate, PaginatedResponse } from '../types';

// Mock data for MVP
const MOCK_HOSPITALS: Hospital[] = [
  {
    id: '1',
    name: 'Hospital Central',
    address: 'Calle Principal 123, Ciudad',
    phone_number: '+34 91 123 4567',
    email: 'info@hospitalcentral.com',
    contact_person: 'Dr. Juan Pérez'
  },
  {
    id: '2',
    name: 'Hospital Norte',
    address: 'Avenida Norte 45, Ciudad',
    phone_number: '+34 91 456 7890',
    email: 'info@hospitalnorte.com',
    contact_person: 'Dra. María García'
  },
  {
    id: '3',
    name: 'Hospital Este',
    address: 'Plaza Este 78, Ciudad',
    phone_number: '+34 91 789 0123',
    email: 'info@hospitaleste.com',
    contact_person: 'Dr. Carlos Rodríguez'
  },
  {
    id: '4',
    name: 'Hospital Sur',
    address: 'Paseo Sur 22, Ciudad',
    phone_number: '+34 91 012 3456',
    email: 'info@hospitalsur.com',
    contact_person: 'Dra. Ana Martínez'
  }
];

// For MVP development
const USE_MOCK_DATA = false;

export const getHospitals = async (skip = 0, limit = 100): Promise<PaginatedResponse<Hospital>> => {
  if (USE_MOCK_DATA) {
    const mockedData = MOCK_HOSPITALS.slice(skip, skip + limit);
    return {
      data: mockedData,
      count: MOCK_HOSPITALS.length
    };
  }

  try {
    const response = await api.get(`/hospitals/?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching hospitals, using mock data', error);
    const mockedData = MOCK_HOSPITALS.slice(skip, skip + limit);
    return {
      data: mockedData,
      count: MOCK_HOSPITALS.length
    };
  }
};

export const getHospital = async (id: string): Promise<Hospital> => {
  if (USE_MOCK_DATA) {
    const hospital = MOCK_HOSPITALS.find(h => h.id === id);
    if (!hospital) {
      throw new Error('Hospital not found');
    }
    return hospital;
  }

  const response = await api.get(`/hospitals/${id}`);
  return response.data;
};

export const createHospital = async (hospital: HospitalCreate): Promise<Hospital> => {
  if (USE_MOCK_DATA) {
    const newHospital: Hospital = {
      id: Math.random().toString(36).substring(2, 9),
      ...hospital
    };
    MOCK_HOSPITALS.push(newHospital);
    return newHospital;
  }

  const response = await api.post('/hospitals/', hospital);
  return response.data;
};

export const updateHospital = async (id: string, hospital: HospitalUpdate): Promise<Hospital> => {
  if (USE_MOCK_DATA) {
    const index = MOCK_HOSPITALS.findIndex(h => h.id === id);
    if (index === -1) {
      throw new Error('Hospital not found');
    }
    
    const updatedHospital = {
      ...MOCK_HOSPITALS[index],
      ...hospital
    };
    
    MOCK_HOSPITALS[index] = updatedHospital;
    return updatedHospital;
  }

  const response = await api.put(`/hospitals/${id}`, hospital);
  return response.data;
};

export const deleteHospital = async (id: string): Promise<Hospital> => {
  if (USE_MOCK_DATA) {
    const index = MOCK_HOSPITALS.findIndex(h => h.id === id);
    if (index === -1) {
      throw new Error('Hospital not found');
    }
    
    const deletedHospital = MOCK_HOSPITALS[index];
    MOCK_HOSPITALS.splice(index, 1);
    return deletedHospital;
  }

  const response = await api.delete(`/hospitals/${id}`);
  return response.data;
}; 