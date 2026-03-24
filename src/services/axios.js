import axios from 'axios';
import { message } from 'antd';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required to send HTTP-only cookies
});

const CHECKIN_REQUIRED_MESSAGE_KEY = 'staff-checkin-required';
const CHECKIN_REQUIRED_FLASH_KEY = 'staff-checkin-required-flash';

const showCheckInRequiredMessage = (content) => {
  message.warning({
    key: CHECKIN_REQUIRED_MESSAGE_KEY,
    content,
    duration: 3,
  });
};

const consumePendingCheckInMessage = () => {
  if (typeof window === 'undefined') return;

  const pendingMessage = window.sessionStorage.getItem(CHECKIN_REQUIRED_FLASH_KEY);
  if (!pendingMessage) return;

  window.sessionStorage.removeItem(CHECKIN_REQUIRED_FLASH_KEY);
  setTimeout(() => {
    showCheckInRequiredMessage(pendingMessage);
  }, 0);
};

consumePendingCheckInMessage();

const isCheckInRequiredError = (error) => {
  const status = error?.response?.status;
  const code = error?.response?.data?.code;
  const serverMessage = String(error?.response?.data?.message || '');

  if (status !== 403) {
    return false;
  }

  if (code === 'STAFF_NOT_CHECKED_IN') {
    return true;
  }

  return /chua check-in|check-in truoc|checkin/i.test(serverMessage);
};

const getAttendanceRoute = (path) => {
  if (path.startsWith('/seller')) {
    return '/seller/attendance';
  }

  if (path.startsWith('/repository')) {
    return '/repository/attendance';
  }

  return null;
};

// Response interceptor - handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (isCheckInRequiredError(error)) {
      const currentPath = window.location.pathname;
      const attendancePath = getAttendanceRoute(currentPath);
      const serverMessage =
        error?.response?.data?.message ||
        'Ban chua check-in. Vui long check-in de su dung cac chuc nang.';

      if (attendancePath && currentPath !== attendancePath) {
        window.sessionStorage.setItem(CHECKIN_REQUIRED_FLASH_KEY, serverMessage);
        window.location.href = attendancePath;
      } else {
        showCheckInRequiredMessage(serverMessage);
      }
    }

    if (error.response?.status === 401) {
      // Only redirect if NOT on auth pages
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.startsWith('/SignIn') || 
                        currentPath.startsWith('/forgot-password') ||
                        currentPath.startsWith('/reset-password') ||
                        currentPath.startsWith('/set-password');
      
      if (!isAuthPage) {
        // Token expired or invalid - redirect to sign in
        window.location.href = '/SignIn';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
