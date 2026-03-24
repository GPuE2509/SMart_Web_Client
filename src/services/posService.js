import axiosInstance from "./axios";

const posService = {
  createTransaction: async () => {
    try {
      const response = await axiosInstance.post("/seller/pos/transactions");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getProducts: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/seller/pos/products", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getCategories: async () => {
    try {
      const response = await axiosInstance.get("/seller/pos/categories");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getTransactionDetail: async (transactionId) => {
    try {
      const response = await axiosInstance.get(
        `/seller/pos/transactions/${transactionId}`,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  addItem: async (transactionId, payload) => {
    try {
      const response = await axiosInstance.post(
        `/seller/pos/transactions/${transactionId}/items`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  removeItem: async (transactionId, itemId) => {
    try {
      const response = await axiosInstance.delete(
        `/seller/pos/transactions/${transactionId}/items/${itemId}`,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateItemQuantity: async (transactionId, itemId, quantity) => {
    try {
      const response = await axiosInstance.patch(
        `/seller/pos/transactions/${transactionId}/items/${itemId}`,
        { quantity },
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  createPayOSPayment: async (transactionId) => {
    try {
      const response = await axiosInstance.post(
        `/seller/pos/transactions/${transactionId}/payos/create-payment`,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  completeCashPayment: async (transactionId) => {
    try {
      const response = await axiosInstance.post(
        `/seller/pos/transactions/${transactionId}/complete-cash`,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  checkPaymentStatus: async (transactionId) => {
    try {
      const response = await axiosInstance.get(
        `/seller/pos/transactions/${transactionId}/payment-status`,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteTransaction: async (transactionId) => {
    try {
      const response = await axiosInstance.delete(
        `/seller/pos/transactions/${transactionId}`,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default posService;
