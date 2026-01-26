import api from "./api";

const unitService = {
  // Get all units
  getAll: async () => {
    return await api.get("/product-units/units");
  },

  // Get unit by ID
  getById: async (id) => {
    return await api.get(`/product-units/units/${id}`);
  },

  // Create new unit
  create: async (data) => {
    return await api.post("/product-units/units", data);
  },

  // Update unit
  update: async (id, data) => {
    return await api.put(`/product-units/units/${id}`, data);
  },

  // Delete unit
  delete: async (id) => {
    return await api.delete(`/product-units/units/${id}`);
  },
};

export default unitService;
