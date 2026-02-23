import axiosInstance from './axios';

const profileService = {
  // Get current user profile
  getMyProfile: async () => {
    try {
      const response = await axiosInstance.get('/users/profile/me');
      return response.data;
    } catch (error) {
      throw {
        status: error.response?.status,
        message: error.response?.data?.error || error.response?.data?.message || 'Lỗi khi lấy thông tin profile',
        ...error.response?.data
      };
    }
  },

  // Update current user profile
  updateMyProfile: async (profileData) => {
    try {
      const response = await axiosInstance.put('/users/profile/me', profileData);
      return response.data;
    } catch (error) {
      throw {
        status: error.response?.status,
        message: error.response?.data?.error || error.response?.data?.message || 'Lỗi khi cập nhật profile',
        ...error.response?.data
      };
    }
  },

  // Admin: Get all users
  getAllUsers: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/users', { params });
      return response.data;
    } catch (error) {
      throw {
        status: error.response?.status,
        message: error.response?.data?.error || error.response?.data?.message || 'Lỗi khi lấy danh sách người dùng',
        ...error.response?.data
      };
    }
  },

  // Admin: Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await axiosInstance.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw {
        status: error.response?.status,
        message: error.response?.data?.error || error.response?.data?.message || 'Lỗi khi lấy thông tin người dùng',
        ...error.response?.data
      };
    }
  },

  // Admin: Update user profile
  updateUserProfile: async (userId, profileData) => {
    try {
      const response = await axiosInstance.put(`/users/${userId}`, profileData);
      return response.data;
    } catch (error) {
      throw {
        status: error.response?.status,
        message: error.response?.data?.error || error.response?.data?.message || 'Lỗi khi cập nhật thông tin người dùng',
        ...error.response?.data
      };
    }
  },

  // Admin: Update user status
  updateUserStatus: async (userId, status) => {
    try {
      const response = await axiosInstance.put(`/users/${userId}/status`, { status });
      return response.data;
    } catch (error) {
      throw {
        status: error.response?.status,
        message: error.response?.data?.error || error.response?.data?.message || 'Lỗi khi cập nhật trạng thái người dùng',
        ...error.response?.data
      };
    }
  },

  // Admin: Update user role
  updateUserRole: async (userId, role) => {
    try {
      const response = await axiosInstance.put(`/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      throw {
        status: error.response?.status,
        message: error.response?.data?.error || error.response?.data?.message || 'Lỗi khi cập nhật vai trò người dùng',
        ...error.response?.data
      };
    }
  },

  // Admin: Delete user
  deleteUser: async (userId) => {
    try {
      const response = await axiosInstance.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw {
        status: error.response?.status,
        message: error.response?.data?.error || error.response?.data?.message || 'Lỗi khi xóa người dùng',
        ...error.response?.data
      };
    }
  }
};

export default profileService;
