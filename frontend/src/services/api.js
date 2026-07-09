import axios from 'axios';
import { getMockData } from '../utils/mockDataEngine';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api';
  }
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${hostname}:3000/api`;
};

const baseURL = getBaseURL();

const api = axios.create({
  baseURL,
  withCredentials: true, // Crucial for sending/receiving HTTP-Only cookies
});

api.interceptors.request.use(
  (config) => {
    if (localStorage.getItem('ewap_demo_mode') === 'true') {
      config.adapter = async (cfg) => {
        const mockResponse = await getMockData(cfg.url, cfg.method, cfg.data);
        return {
          data: mockResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: cfg
        };
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);


let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor for Token Rotation
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.data?.code === 'ACCOUNT_SUSPENDED' || (error.response?.status === 403 && error.response?.data?.code === 'ACCOUNT_SUSPENDED')) {
      window.location.href = '/account-suspended';
      return Promise.reject(error);
    }
    const originalRequest = error.config;

    // Only attempt refresh on 401 errors, and not on the refresh/login endpoints themselves
    const isAuthEndpoint = originalRequest.url?.includes('/auth/refresh') ||
                           originalRequest.url?.includes('/auth/login');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest))
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token using the refresh token cookie
        await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );


        processQueue(null);
        isRefreshing = false;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
