import axiosInstance from './axios';

const authService = {
  // Sign in - token is now stored in HTTP-only cookie automatically
  SignIn: async (email, password) => {
    try {
      const response = await axiosInstance.post('/auth/signin', {
        email,
        password,
      });

      // Server sets HTTP-only cookie, we just return user data
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || {};
      throw {
        status: error.response?.status,
        message: errorData.error,
        ...errorData
      };
    }
  },

  // Logout - clear HTTP-only cookie on server
  logout: async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      // Even if request fails, we treat as logged out
      console.error('Logout error:', error);
    }
  },

  // Get current user from server (requires valid cookie)
  getUser: async () => {
    try {
      const response = await axiosInstance.get('/auth/me');
      return response.data.user;
    } catch (error) {
      return null;
    }
  },

  // Check authentication by trying to get current user
  isAuthenticated: async () => {
    try {
      await axiosInstance.get('/auth/me');
      return true;
    } catch (error) {
      return false;
    }
  },

  // Staff/Admin Login with Email Verification
  staffAdminLogin: async (email, password, sessionId) => {
    try {
      const response = await axiosInstance.post('/auth/staff-admin-login', {
        email,
        password,
        sessionId
      });

      return response.data;
    } catch (error) {
      const errorData = error.response?.data || {};
      throw {
        status: error.response?.status,
        message: errorData.error || errorData.message,
        ...errorData
      };
    }
  },

  // Verify account invitation token
  verifyInvitation: async (token) => {
    try {
      const response = await axiosInstance.get('/auth/verify-invitation', {
        params: { token }
      });
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || {};
      throw {
        status: error.response?.status,
        message: errorData.message,
        ...errorData
      };
    }
  },

  // Set password for new account after email verification
  setPasswordForNewAccount: async (token, password, confirmPassword) => {
    try {
      const response = await axiosInstance.post('/auth/set-password', {
        token,
        password,
        confirmPassword
      });
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || {};
      throw {
        status: error.response?.status,
        message: errorData.message,
        ...errorData
      };
    }
  },
};

export default authService;
