import axiosInstance from "./axios";

const staffPayrollService = {
  // Get own payroll list
  getMyPayrollList: async (year, page = 1, limit = 12) => {
    try {
      const params = { page, limit };
      if (year) params.year = year;

      const response = await axiosInstance.get("/staff/payroll", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get yearly payroll summary
  getMyPayrollSummary: async (year) => {
    try {
      const params = {};
      if (year) params.year = year;

      const response = await axiosInstance.get("/staff/payroll/summary", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get current month attendance
  getMyCurrentMonthAttendance: async () => {
    try {
      const response = await axiosInstance.get("/staff/payroll/attendance");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get current month sales (seller_staff only)
  getMyCurrentMonthSales: async () => {
    try {
      const response = await axiosInstance.get("/staff/payroll/sales");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get payslip detail
  getMyPayslipDetail: async (payslipId) => {
    try {
      const response = await axiosInstance.get(`/staff/payroll/${payslipId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default staffPayrollService;
