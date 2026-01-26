import api from "./axios";

const unitService = {
  // Get all units
  getAll: async () => {
    try {
      const response = await api.get("/product-units/units");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get unit by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/product-units/units/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create new unit
  create: async (data) => {
    try {
      const response = await api.post("/product-units/units", data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update unit
  update: async (id, data) => {
    try {
      const response = await api.put(`/product-units/units/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete unit
  delete: async (id) => {
    try {
      const response = await api.delete(`/product-units/units/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default unitService;
