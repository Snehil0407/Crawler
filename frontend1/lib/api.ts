import axios from 'axios';
import { auth } from './firebase';
import { ScanResult, ScanStatus, RecentScan } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
});

// Add request interceptor to include authentication token
api.interceptors.request.use(
  async (config) => {
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Check for demo user in localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          if (user.id === 'demo-user-id') {
            config.headers.Authorization = `Bearer demo-token`;
          }
        }
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
      // Fallback to demo token if available
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.id === 'demo-user-id') {
          config.headers.Authorization = `Bearer demo-token`;
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Only redirect to login for critical auth endpoints, not all 401/403 errors
      const url = error.config?.url || '';
      const isCriticalAuthEndpoint = url.includes('/api/scans') || url.includes('/api/scan/') || url.includes('/api/start-scan');
      
      if (isCriticalAuthEndpoint && typeof window !== 'undefined') {
        // Check if user is still authenticated before redirecting
        const userData = localStorage.getItem('user');
        if (!userData && !auth.currentUser) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

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

  stopScan: async (scanId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/api/scan/${scanId}/stop`);
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

  deleteScan: async (scanId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/api/scan/${scanId}`);
    return response.data;
  },

  healthCheck: async (): Promise<{ status: string }> => {
    const response = await api.get('/api/health');
    return response.data;
  }
};
