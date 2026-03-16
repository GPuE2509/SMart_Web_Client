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

  // Lấy gợi ý nhập hàng thông minh từ AI
  getSmartSuggestions: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/batches/suggestions/smart", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Toggle rescue pricing for a batch item
  toggleRescuePricing: async (batchId, itemId, enabled) => {
    try {
      const response = await axiosInstance.patch(
        `/batches/${batchId}/items/${itemId}/rescue-pricing`,
        { enabled }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get rescue pricing info for a batch item
  getRescuePricingInfo: async (batchId, itemId) => {
    try {
      const response = await axiosInstance.get(
        `/batches/${batchId}/items/${itemId}/rescue-pricing`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get print label for batch item
  getPrintLabel: async (batchId, itemId) => {
    try {
      const response = await axiosInstance.get(
        `/batches/${batchId}/items/${itemId}/label`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get printable HTML from backend for batch item label
  getPrintLabelHtml: async (batchId, itemId, copies = 8) => {
    try {
      const response = await axiosInstance.get(
        `/batches/${batchId}/items/${itemId}/label`,
        {
          params: {
            format: "html",
            copies,
          },
          responseType: "text",
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Set manual discount percentage for a batch item
  setManualDiscount: async (batchId, itemId, discountPercentage) => {
    try {
      const response = await axiosInstance.patch(
        `/batches/${batchId}/items/${itemId}/manual-discount`,
        { discountPercentage }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default productBatchService;
