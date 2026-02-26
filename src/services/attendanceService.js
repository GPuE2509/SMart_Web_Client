import api from './axios';

const attendanceService = {
  // Admin: Register face for staff
  registerStaffFace: async (userId, faceDescriptor, faceImage) => {
    try {
      const response = await api.post('/attendance/register-face', {
        userId,
        faceDescriptor,
        faceImage
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Staff: Check-in
  checkIn: async (userId, faceDescriptor, matchConfidence) => {
    try {
      const response = await api.post('/attendance/check-in', {
        userId,
        faceDescriptor,
        matchConfidence
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Staff: Check-out
  checkOut: async (userId, faceDescriptor, matchConfidence) => {
    try {
      const response = await api.post('/attendance/check-out', {
        userId,
        faceDescriptor,
        matchConfidence
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get attendance history for a staff member
  getAttendanceHistory: async (userId, startDate, endDate) => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get(`/attendance/history/${userId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Admin: Get all staff attendance
  getAllStaffAttendance: async (startDate, endDate, role, search, page = 1, limit = 10) => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (role) params.role = role;
      if (search) params.search = search;
      params.page = page;
      params.limit = limit;

      const response = await api.get('/attendance/all', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get staff face data
  getStaffFaceData: async (userId) => {
    try {
      const response = await api.get(`/attendance/face-data/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Admin: Get all staff with face registered
  getAllStaffWithFace: async () => {
    try {
      const response = await api.get('/attendance/staff-with-face');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default attendanceService;
