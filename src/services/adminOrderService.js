import axiosInstance from "./axios";

const adminOrderService = {
  getOrderList: async (params = {}) => {
    const response = await axiosInstance.get("/admin/orders", { params });
    return response.data;
  },
  confirmPayment: async (orderId) => {
    const response = await axiosInstance.patch(`/admin/orders/${orderId}/confirm-payment`);
    return response.data;
  },
};

export default adminOrderService;
