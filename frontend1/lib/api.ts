import axios from 'axios';
import { ScanResult, ScanStatus, RecentScan } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
});

export const scanAPI = {
  startScan: async (url: string): Promise<{ scanId: string }> => {
    const response = await api.post('/api/start-scan', { url });
    return response.data;
  },

  getScanStatus: async (scanId: string): Promise<ScanStatus> => {
    const response = await api.get(`/api/scan/${scanId}/status`);
    return response.data;
  },

  getScanResults: async (scanId: string): Promise<{ success: boolean; results: ScanResult }> => {
    const response = await api.get(`/api/scan/${scanId}/results`);
    return response.data;
  },

  getRecentScans: async (limit: number = 5): Promise<{ success: boolean; scans: RecentScan[] }> => {
    const response = await api.get(`/api/scans?limit=${limit}`);
    return response.data;
  },

  getDashboardRecentScans: async (limit: number = 5): Promise<{ success: boolean; scans: RecentScan[] }> => {
    const response = await api.get(`/api/dashboard/recent-scans?limit=${limit}`);
    return response.data;
  },

  healthCheck: async (): Promise<{ status: string }> => {
    const response = await api.get('/api/health');
    return response.data;
  }
};
