import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // Crucial for sending/receiving HTTP-Only cookies
});

// Response Interceptor for Token Rotation
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized (Access Token Expired) and we haven't retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token using the refresh token cookie
        await axios.post('http://localhost:3000/api/auth/refresh', {}, { withCredentials: true });
        
        // If successful, retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token is expired or invalid -> let the calling code handle it
        // Don't do window.location.href as it causes a jarring reload loop
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
