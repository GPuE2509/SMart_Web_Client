import api from "./api";

const productService = {
  // Get all products
  getAll: async () => {
    return await api.get("/products");
  },

  // Get product by ID
  getById: async (id) => {
    return await api.get(`/products/${id}`);
  },
};

export default productService;
