import axios from 'axios';
import Cookies from 'js-cookie';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Cho phép gửi cookies
});

// Request interceptor - thêm token vào header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - xử lý lỗi
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Chỉ redirect nếu KHÔNG ở trang sign in/auth
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.startsWith('/SignIn') || 
                        currentPath.startsWith('/forgot-password');
      
      if (!isAuthPage) {
        // Token hết hạn hoặc không hợp lệ - redirect về sign in
        Cookies.remove('token');
        Cookies.remove('user');
        window.location.href = '/SignIn';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
