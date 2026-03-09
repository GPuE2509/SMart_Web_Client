import axiosInstance from "./axios";

const couponService = {
  // Lấy danh sách coupons với filter, search, sort, pagination
  getAll: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/coupons", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Lấy chi tiết coupon theo ID
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/coupons/${id}`);
      return response.data;    
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Tạo coupon mới
  create: async (data) => {
    try {
      const response = await axiosInstance.post("/coupons", data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Cập nhật coupon
  update: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/coupons/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Xóa coupon
  delete: async (id) => {
    try {
      const response = await axiosInstance.delete(`/coupons/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default couponService;
