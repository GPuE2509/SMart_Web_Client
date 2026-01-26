import authService from '../services/authService';

/**
 * Get home route based on user role
 * @param {Object} user - User object (optional, will fetch from server if not provided)
 */
export const getHomeRoute = (user) => {
  if (!user || !user.role) {
    return '/SignIn';
  }

  switch (user.role) {
    case 'admin':
      return '/admin/dashboard';
    case 'seller_staff':
      return '/seller';
    case 'repository_staff':
      return '/repository';
    case 'customer':
      // Customer không có quyền truy cập hệ thống
      return null;
    default:
      return '/SignIn';
  }
};

/**
 * Check if user has access to the system
 * @param {Object} user - User object
 */
export const canAccessSystem = (user) => {
  if (!user || !user.role) {
    return false;
  }

  // Customer không có quyền truy cập
  return user.role !== 'customer';
};

/**
 * Get user display info
 * @param {Object} user - User object
 */
export const getUserDisplayInfo = (user) => {
  if (!user) {
    return null;
  }

  return {
    fullName: user.full_name,
    avatar: user.avatar_url,
    role: user.role,
    email: user.email
  };
};
