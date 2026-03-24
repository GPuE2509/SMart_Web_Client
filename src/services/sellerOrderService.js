import axiosInstance from "./axios";

const sellerOrderService = {
  // Get order list with filters
  getOrderList: async (options = {}) => {
    try {
      const response = await axiosInstance.get("/seller-staff/orders", {
        params: options,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get order detail
  getOrderDetail: async (orderId) => {
    try {
      const response = await axiosInstance.get(
        `/seller-staff/orders/${orderId}`,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Search by barcode
  searchByBarcode: async (barcode) => {
    try {
      const response = await axiosInstance.get(
        `/seller-staff/orders/scan/${barcode}`,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get order statistics
  getOrderStats: async (startDate, endDate) => {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await axiosInstance.get("/seller-staff/orders/stats", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default sellerOrderService;
