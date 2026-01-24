/**
 * @fileoverview Authentication utilities
 * Handles localStorage operations for user authentication
 */

const AUTH_TOKEN_KEY = 'admin_dashboard_token';
const AUTH_USER_KEY = 'admin_dashboard_user';

/**
 * Save authentication data to localStorage
 * @param {string} token - Authentication token
 * @param {import('../types').User} user - User object
 */
export const setAuthData = (token, user) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

/**
 * Get authentication token from localStorage
 * @returns {string | null}
 */
export const getAuthToken = () => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * Get authenticated user from localStorage
 * @returns {import('../types').User | null}
 */
export const getAuthUser = () => {
  const userStr = localStorage.getItem(AUTH_USER_KEY);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!getAuthToken() && !!getAuthUser();
};

/**
 * Clear authentication data from localStorage
 */
export const clearAuthData = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

/**
 * Mock login function
 * @param {string} username - Username or email
 * @param {string} password - Password
 * @returns {Promise<{success: boolean, user?: import('../types').User, token?: string, message?: string}>}
 */
export const mockLogin = async (username, password) => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Import mock users
  const { mockUsers } = await import('../services/mockData.js');

  // Find user by username or email
  const user = mockUsers.find(
    (u) =>
      (u.username === username || u.email === username) &&
      u.status === 'active'
  );

  // For demo purposes, accept any password for existing users
  // In production, you'd verify against a hashed password
  if (!user) {
    return {
      success: false,
      message: 'Invalid username or email',
    };
  }

  if (user.status !== 'active') {
    return {
      success: false,
      message: 'Account is inactive',
    };
  }

  // Generate a fake JWT-like token
  const token = `fake_jwt_token_${user.id}_${Date.now()}`;

  return {
    success: true,
    user,
    token,
  };
};

/**
 * Logout function
 */
export const logout = () => {
  clearAuthData();
};
