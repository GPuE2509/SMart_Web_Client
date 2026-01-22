import authService from '../services/authService';

/**
 * Get home route based on user role
 */
export const getHomeRoute = () => {
  const user = authService.getUser();
  
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
 */
export const canAccessSystem = () => {
  const user = authService.getUser();
  
  if (!user || !user.role) {
    return false;
  }

  // Customer không có quyền truy cập
  return user.role !== 'customer';
};

/**
 * Get user display info
 */
export const getUserDisplayInfo = () => {
  const user = authService.getUser();
  
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
