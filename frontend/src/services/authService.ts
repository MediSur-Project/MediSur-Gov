import api from './api';
import { TokenResponse, UserLogin, User } from '../types';

// For MVP: Set this to true to bypass login
const BYPASS_AUTH_FOR_MVP = true;

export const login = async (credentials: UserLogin): Promise<TokenResponse> => {
  if (BYPASS_AUTH_FOR_MVP) {
    // For MVP, set a dummy token
    const dummyToken = 'dummy-token-for-development';
    localStorage.setItem('token', dummyToken);
    return {
      access_token: dummyToken,
      token_type: 'bearer'
    };
  }

  const formData = new FormData();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);
  
  const response = await api.post('/login/access-token', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  // Save token to localStorage
  if (response.data.access_token) {
    localStorage.setItem('token', response.data.access_token);
  }
  
  return response.data;
};

export const getMe = async (): Promise<User> => {
  if (BYPASS_AUTH_FOR_MVP) {
    // Return mock user for MVP
    return {
      id: 'mock-user-id',
      email: 'admin@example.com',
      is_active: true,
      is_superuser: true,
      full_name: 'Admin User'
    };
  }

  const response = await api.get('/users/me');
  return response.data;
};

export const logout = (): void => {
  localStorage.removeItem('token');
  // You might want to redirect to login page or perform other actions after logout
};

export const isAuthenticated = (): boolean => {
  if (BYPASS_AUTH_FOR_MVP) {
    return true;
  }
  
  const token = localStorage.getItem('token');
  return !!token;
}; 