import axios from 'axios';
import { 
  RegionListResponse, 
  ProvinceListResponse, 
  ReportListResponse, 
  TotalResponse 
} from '../types';

// Create a dedicated axios instance for the COVID API
const covidApi = axios.create({
  baseURL: 'https://covid-api.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Get a list of regions (countries)
 */
export const getRegions = async (): Promise<RegionListResponse> => {
  const response = await covidApi.get('/regions');
  return response.data;
};

/**
 * Get a list of provinces for a specific region
 * @param iso ISO code of the region (country)
 */
export const getProvinces = async (iso: string): Promise<ProvinceListResponse> => {
  const response = await covidApi.get('/provinces', {
    params: { iso }
  });
  return response.data;
};

/**
 * Get reports for a specific region
 * @param iso ISO code of the region (country)
 * @param date Date in format YYYY-MM-DD
 * @param regionName Optional region name
 * @param regionProvince Optional province name
 */
export const getReports = async (
  iso?: string, 
  date?: string,
  regionName?: string,
  regionProvince?: string
): Promise<ReportListResponse> => {
  const params: Record<string, string> = {};
  
  if (iso) params.iso = iso;
  if (date) params.date = date;
  if (regionName) params.name = regionName;
  if (regionProvince) params.province = regionProvince;
  
  const response = await covidApi.get('/reports', { params });
  return response.data;
};

/**
 * Get reports by region (country)
 * @param iso ISO code of the region (country)
 * @param date Date in format YYYY-MM-DD
 */
export const getReportsByRegion = async (
  iso: string,
  date?: string
): Promise<ReportListResponse> => {
  const params: Record<string, string> = { iso };
  if (date) params.date = date;
  
  const response = await covidApi.get('/reports', { params });
  return response.data;
};

/**
 * Get total reports
 * @param date Date in format YYYY-MM-DD
 */
export const getTotalReports = async (date?: string): Promise<TotalResponse> => {
  const params: Record<string, string> = {};
  if (date) params.date = date;
  
  const response = await covidApi.get('/reports/total', { params });
  return response.data;
}; 