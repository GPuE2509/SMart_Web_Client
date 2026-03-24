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

  getOpenTransactions: async () => {
    try {
      const response = await axiosInstance.get('/seller/pos/transactions/open');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  holdTransaction: async (transactionId) => {
    try {
      const response = await axiosInstance.post(
        `/seller/pos/transactions/${transactionId}/hold`,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  resumeTransaction: async (transactionId) => {
    try {
      const response = await axiosInstance.post(
        `/seller/pos/transactions/${transactionId}/resume`,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  resolveCustomerByQr: async (qrData) => {
    try {
      const response = await axiosInstance.post('/seller/pos/customers/resolve-qr', {
        qr_data: qrData,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  searchCustomers: async (keyword, limit = 20) => {
    try {
      const response = await axiosInstance.get('/seller/pos/customers/search', {
        params: { keyword, limit },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  assignCustomer: async (transactionId, userId) => {
    try {
      const response = await axiosInstance.patch(
        `/seller/pos/transactions/${transactionId}/customer`,
        { user_id: userId },
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getCustomerCoupons: async (transactionId, params = {}) => {
    try {
      const response = await axiosInstance.get(
        `/seller/pos/transactions/${transactionId}/customer-coupons`,
        { params },
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  redeemCustomerCoupon: async (transactionId, couponId) => {
    try {
      const response = await axiosInstance.post(
        `/seller/pos/transactions/${transactionId}/customer-coupons/redeem`,
        { coupon_id: couponId },
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  applyCoupon: async (transactionId, couponCode) => {
    try {
      const response = await axiosInstance.post(
        `/seller/pos/transactions/${transactionId}/coupon/apply`,
        { coupon_code: couponCode },
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  removeCoupon: async (transactionId) => {
    try {
      const response = await axiosInstance.delete(
        `/seller/pos/transactions/${transactionId}/coupon`,
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

  addItemByBarcode: async (transactionId, payload) => {
    try {
      const response = await axiosInstance.post(
        `/seller/pos/transactions/${transactionId}/items/scan-barcode`,
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

  completeCodPayment: async (transactionId, payload) => {
    try {
      const response = await axiosInstance.post(
        `/seller/pos/transactions/${transactionId}/complete-cod`,
        payload,
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

  issueReceipt: async (transactionId, payload = {}) => {
    try {
      const response = await axiosInstance.post(
        `/seller/pos/transactions/${transactionId}/issue-receipt`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default posService;
