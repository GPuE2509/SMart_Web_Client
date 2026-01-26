import axiosInstance from "./axios";

const categoryService = {
  // Lấy danh sách categories với filter, search, sort, pagination
  getAll: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/categories", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Lấy category tree (cấu trúc phân cấp)
  getTree: async () => {
    try {
      const response = await axiosInstance.get("/categories/tree");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Lấy chi tiết category theo ID
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Tạo category mới
  create: async (data) => {
    try {
      const response = await axiosInstance.post("/categories/create", data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Cập nhật category
  update: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/categories/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Xóa category (soft delete)
  delete: async (id) => {
    try {
      const response = await axiosInstance.delete(`/categories/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default categoryService;
