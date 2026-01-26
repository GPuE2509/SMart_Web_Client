import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required to send HTTP-only cookies
});

// Response interceptor - handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if NOT on auth pages
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.startsWith('/SignIn') || 
                        currentPath.startsWith('/forgot-password');
      
      if (!isAuthPage) {
        // Token expired or invalid - redirect to sign in
        window.location.href = '/SignIn';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
