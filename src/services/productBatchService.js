import axiosInstance from "./axios";

const productBatchService = {
  // Lấy danh sách product batches với filter, search, sort, pagination
  getAll: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/product-batches", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Lấy chi tiết product batch theo ID
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/product-batches/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Lấy inventory logs của batch
  getBatchLogs: async (id) => {
    try {
      const response = await axiosInstance.get(`/product-batches/${id}/logs`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Cập nhật trạng thái batch
  updateStatus: async (id, status) => {
    try {
      const response = await axiosInstance.patch(
        `/product-batches/${id}/status`,
        { status },
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Từ chối batch (soft delete)
  rejectBatch: async (id, note) => {
    try {
      const response = await axiosInstance.post(
        `/product-batches/${id}/reject`,
        { note },
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default productBatchService;
