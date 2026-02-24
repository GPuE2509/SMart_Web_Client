import axiosInstance from "./axios";

const productBatchService = {
  // Lấy danh sách batches với filter, search, sort, pagination
  getAll: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/batches", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Lấy chi tiết batch theo ID (kèm inventory logs)
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/batches/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Import batch mới
  importBatch: async (data) => {
    try {
      const response = await axiosInstance.post("/batches/import", data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Cập nhật batch
  update: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/batches/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Từ chối (xóa mềm) batch
  reject: async (id, reason = "") => {
    try {
      const response = await axiosInstance.delete(`/batches/${id}/reject`, {
        data: { reason },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Thay đổi trạng thái batch
  changeStatus: async (id, status) => {
    try {
      const response = await axiosInstance.patch(`/batches/${id}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default productBatchService;
