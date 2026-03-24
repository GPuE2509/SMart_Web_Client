import axiosInstance from "./axios";

const payrollService = {
  // Calculate payroll for a single staff
  calculatePayroll: async (userId, month, year, customConfig = {}) => {
    try {
      const response = await axiosInstance.post("/admin/payroll/calculate", {
        user_id: userId,
        month,
        year,
        ...customConfig,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Bulk calculate payroll for all staff
  bulkCalculatePayroll: async (month, year, customConfig = {}) => {
    try {
      const response = await axiosInstance.post(
        "/admin/payroll/calculate-all",
        {
          month,
          year,
          ...customConfig,
        },
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get payroll report
  getPayrollReport: async (month, year, options = {}) => {
    try {
      const params = { month, year, ...options };
      const response = await axiosInstance.get("/admin/payroll/report", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get payslip detail
  getPayslipDetail: async (payslipId) => {
    try {
      const response = await axiosInstance.get(`/admin/payroll/${payslipId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Add adjustment (bonus/deduction)
  addAdjustment: async (payslipId, adjustmentData) => {
    try {
      const response = await axiosInstance.post(
        `/admin/payroll/${payslipId}/adjustment`,
        adjustmentData,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Remove adjustment
  removeAdjustment: async (payslipId, adjustmentId) => {
    try {
      const response = await axiosInstance.delete(
        `/admin/payroll/${payslipId}/adjustment/${adjustmentId}`,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update payment status
  updatePaymentStatus: async (payslipId, status) => {
    try {
      const response = await axiosInstance.patch(
        `/admin/payroll/${payslipId}/status`,
        { status },
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Export to Excel - returns blob
  exportToExcel: async (month, year, options = {}) => {
    try {
      const params = { month, year };
      if (options.role) params.role = options.role;
      if (options.search) params.search = options.search;

      const response = await axiosInstance.get("/admin/payroll/export/excel", {
        params,
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Export to PDF - returns blob
  exportToPDF: async (month, year, options = {}) => {
    try {
      const params = { month, year };
      if (options.role) params.role = options.role;
      if (options.search) params.search = options.search;

      const response = await axiosInstance.get("/admin/payroll/export/pdf", {
        params,
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default payrollService;
