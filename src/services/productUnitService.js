import apiClient from "./axios";

/**
 * Product Unit Service
 * All API calls related to product units
 */
const productUnitService = {
  /**
   * Get all product units with filters
   * @param {Object} params - Query parameters (product_id, unit_id, search, page, limit, etc.)
   * @returns {Promise}
   */
  getAll: (params = {}) => {
    return apiClient.get("/product-units", { params });
  },

  /**
   * Get product unit by ID
   * @param {String} id - Product unit ID
   * @returns {Promise}
   */
  getById: (id) => {
    return apiClient.get(`/product-units/${id}`);
  },

  /**
   * Get product units by product ID
   * @param {String} productId - Product ID
   * @returns {Promise}
   */
  getByProductId: (productId) => {
    return apiClient.get(`/product-units/product/${productId}`);
  },

  /**
   * Create new product unit
   * @param {Object} data - Product unit data
   * @returns {Promise}
   */
  create: (data) => {
    return apiClient.post("/product-units", data);
  },

  /**
   * Update product unit
   * @param {String} id - Product unit ID
   * @param {Object} data - Updated data
   * @returns {Promise}
   */
  update: (id, data) => {
    return apiClient.put(`/product-units/${id}`, data);
  },

  /**
   * Delete product unit
   * @param {String} id - Product unit ID
   * @returns {Promise}
   */
  delete: (id) => {
    return apiClient.delete(`/product-units/${id}`);
  },

  /**
   * Get statistics
   * @returns {Promise}
   */
  getStats: () => {
    return apiClient.get("/product-units/stats/overview");
  },

  /**
   * Generate internal barcode
   * @param {String} productId - Product ID
   * @param {String} unitId - Unit ID
   * @returns {Promise}
   */
  generateBarcode: (productId, unitId) => {
    return apiClient.post("/product-units/generate-barcode", {
      product_id: productId,
      unit_id: unitId,
    });
  },

  /**
   * Validate barcode format
   * @param {String} barcode - Barcode to validate
   * @returns {Promise}
   */
  validateBarcode: (barcode) => {
    return apiClient.post("/product-units/validate-barcode", { barcode });
  },
};

export default productUnitService;
