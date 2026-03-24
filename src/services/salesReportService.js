import axiosInstance from "./axios";

/**
 * Sales Report Service
 * Provides API calls for sales reports and analytics
 */

/**
 * Get Revenue & Profit chart data
 * @param {Object} params - { period: 'day'|'week'|'month', start_date, end_date }
 * @returns {Promise} Chart data with revenue and profit
 */
export const getRevenueAndProfitChart = async (params = {}) => {
  const response = await axiosInstance.get("/admin/reports/revenue-profit", {
    params,
  });
  return response.data;
};

/**
 * Get Top Selling Products
 * @param {Object} params - { limit, start_date, end_date }
 * @returns {Promise} Top products by revenue
 */
export const getTopSellingProducts = async (params = {}) => {
  const response = await axiosInstance.get("/admin/reports/top-products", {
    params,
  });
  return response.data;
};

/**
 * Get Peak Hours Heatmap data
 * @param {Object} params - { start_date, end_date }
 * @returns {Promise} Heatmap data
 */
export const getPeakHoursHeatmap = async (params = {}) => {
  const response = await axiosInstance.get("/admin/reports/peak-hours", {
    params,
  });
  return response.data;
};

/**
 * Get Sales Summary
 * @param {Object} params - { start_date, end_date }
 * @returns {Promise} Summary data
 */
export const getSalesSummary = async (params = {}) => {
  const response = await axiosInstance.get("/admin/reports/summary", {
    params,
  });
  return response.data;
};

/**
 * Get Rescue Efficiency Report
 * Recovered revenue, loss of cost, successful rescue rate
 * @param {Object} params - { start_date, end_date }
 * @returns {Promise} Rescue efficiency data
 */
export const getRescueEfficiencyReport = async (params = {}) => {
  const response = await axiosInstance.get("/admin/reports/rescue-efficiency", {
    params,
  });
  return response.data;
};

/**
 * Get Cash Flow Chart (inflows: sales, outflows: inventory + operations)
 * @param {Object} params - { period, start_date, end_date }
 * @returns {Promise} Cash flow chart data
 */
export const getCashFlowChart = async (params = {}) => {
  const response = await axiosInstance.get("/admin/reports/cash-flow", {
    params,
  });
  return response.data;
};

/**
 * Get Cost vs Retail Price Trend Chart (multi-line)
 * @param {Object} params - { period, start_date, end_date }
 * @returns {Promise} Cost vs retail trend data
 */
export const getCostRetailTrendChart = async (params = {}) => {
  const response = await axiosInstance.get("/admin/reports/cost-retail-trend", {
    params,
  });
  return response.data;
};

/**
 * Get After-tax Revenue Report
 * @param {Object} params - { start_date, end_date }
 * @returns {Promise} Net revenue after discounts, returns and taxes
 */
export const getAfterTaxRevenueReport = async (params = {}) => {
  const response = await axiosInstance.get("/admin/reports/after-tax-revenue", {
    params,
  });
  return response.data;
};

export default {
  getRevenueAndProfitChart,
  getTopSellingProducts,
  getPeakHoursHeatmap,
  getSalesSummary,
  getRescueEfficiencyReport,
  getCashFlowChart,
  getCostRetailTrendChart,
  getAfterTaxRevenueReport,
};
