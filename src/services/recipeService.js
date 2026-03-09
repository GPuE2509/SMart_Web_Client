import axiosInstance from "./axios";

/**
 * Recipe Service
 * Provides API calls for recipe management
 */

/**
 * Get all recipes with pagination
 * @param {Object} params - { search, page, limit, sort_by }
 * @returns {Promise} Recipes list with pagination
 */
export const getAllRecipes = async (params = {}) => {
  const response = await axiosInstance.get("/recipes", { params });
  return response.data;
};

/**
 * Search recipes
 * @param {Object} params - { search, ingredient_id, min_ingredients, max_ingredients, page, limit }
 * @returns {Promise} Search results
 */
export const searchRecipes = async (params = {}) => {
  const response = await axiosInstance.get("/recipes/search", { params });
  return response.data;
};

/**
 * Get recipe by ID
 * @param {string} id - Recipe ID
 * @returns {Promise} Recipe details with ingredients
 */
export const getRecipeById = async (id) => {
  const response = await axiosInstance.get(`/recipes/${id}`);
  return response.data;
};

/**
 * Create new recipe
 * @param {Object} data - { title, description, instruction, image_url, ingredients }
 * @returns {Promise} Created recipe
 */
export const createRecipe = async (data) => {
  const response = await axiosInstance.post("/recipes", data);
  return response.data;
};

/**
 * Update recipe
 * @param {string} id - Recipe ID
 * @param {Object} data - { title, description, instruction, image_url, ingredients }
 * @returns {Promise} Updated recipe
 */
export const updateRecipe = async (id, data) => {
  const response = await axiosInstance.put(`/recipes/${id}`, data);
  return response.data;
};

/**
 * Delete recipe
 * @param {string} id - Recipe ID
 * @returns {Promise} Delete result
 */
export const deleteRecipe = async (id) => {
  const response = await axiosInstance.delete(`/recipes/${id}`);
  return response.data;
};

/**
 * Toggle recipe active status
 * @param {string} id - Recipe ID
 * @returns {Promise} Updated recipe
 */
export const toggleRecipeStatus = async (id) => {
  const response = await axiosInstance.patch(`/recipes/${id}/toggle-status`);
  return response.data;
};

export default {
  getAllRecipes,
  searchRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  toggleRecipeStatus,
};
