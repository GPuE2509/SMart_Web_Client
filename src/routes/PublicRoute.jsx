import { Navigate } from 'react-router-dom';
import authService from '../services/authService';
import { getHomeRoute, canAccessSystem } from '../utils/roleUtils';

/**
 * Public Route Component
 * Redirects to appropriate page based on user role if already authenticated
 * Used for sign in and forgot-password pages
 */
const PublicRoute = ({ children }) => {
  if (authService.isAuthenticated()) {
    // Kiểm tra quyền truy cập
    if (!canAccessSystem()) {
      // Nếu là customer, logout
      authService.logout();
      return children;
    }
    
    // Redirect đến trang chủ theo role
    const homeRoute = getHomeRoute();
    return <Navigate to={homeRoute} replace />;
  }

  return children;
};

export default PublicRoute;
