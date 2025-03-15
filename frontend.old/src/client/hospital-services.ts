// Hospital API client services

export interface HospitalResponse {
  id: string;
  name: string;
  address: string;
  phone_number: string;
  email: string;
  contact_person: string;
}

export interface HospitalCreate {
  name: string;
  address: string;
  phone_number: string;
  email: string;
  contact_person: string;
}

export interface HospitalUpdate {
  name?: string;
  address?: string;
  phone_number?: string;
  email?: string;
  contact_person?: string;
}

export interface HospitalsListResponse {
  data: HospitalResponse[];
  count: number;
}

const API_URL = "http://localhost:8000"
// Implement hospital API services
export const HospitalsService = {
  readHospitals: async ({ skip = 0, limit = 10 }: { skip?: number; limit?: number }) => {
    const response = await fetch(`${API_URL}/api/v1/hospitals/?skip=${skip}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch hospitals');
    }
    return await response.json() as HospitalsListResponse;
  },
  
  readHospital: async ({ hospitalId }: { hospitalId: string }) => {
    const response = await fetch(`${API_URL}/api/v1/hospitals/${hospitalId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch hospital');
    }
    return await response.json() as HospitalResponse;
  },
  
  createHospitalApi: async ({ requestBody }: { requestBody: HospitalCreate }) => {
    const response = await fetch(`${API_URL}/api/v1/hospitals/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      throw new Error('Failed to create hospital');
    }
    return await response.json() as HospitalResponse;
  },
  
  updateHospitalApi: async ({ hospitalId, requestBody }: { hospitalId: string; requestBody: HospitalUpdate }) => {
    const response = await fetch(`${API_URL}/api/v1/hospitals/${hospitalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      throw new Error('Failed to update hospital');
    }
    return await response.json() as HospitalResponse;
  },
  
  deleteHospitalApi: async ({ hospitalId }: { hospitalId: string }) => {
    const response = await fetch(`${API_URL}/api/v1/hospitals/${hospitalId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete hospital');
    }
    return await response.json() as HospitalResponse;
  },
}; 