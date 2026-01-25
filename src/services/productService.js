import axiosInstance from "./axios";

const productService = {
  // Lấy danh sách products với filter, search, sort, pagination
  getAll: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/products", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Lấy chi tiết product theo ID
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Tạo product mới
  create: async (data) => {
    try {
      const response = await axiosInstance.post("/products/create", data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Cập nhật product
  update: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/products/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Xóa product (soft delete)
  delete: async (id) => {
    try {
      const response = await axiosInstance.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default productService;
