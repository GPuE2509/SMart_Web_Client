import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import { canAccessSystem, getHomeRoute } from '../utils/roleUtils';

/**
 * Protected Route Component
 * Redirects to sign in if user is not authenticated
 * Blocks customer from accessing the system
 * Enforces role-based access control for admin/seller/repository routes
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();

  if (!authService.isAuthenticated()) {
    return <Navigate to="/SignIn" replace />;
  }

  // Kiểm tra quyền truy cập hệ thống
  if (!canAccessSystem()) {
    // Customer không có quyền - logout và redirect
    authService.logout();
    return <Navigate to="/SignIn" replace />;
  }

  // Kiểm tra role-based access nếu có allowedRoles
  if (allowedRoles && allowedRoles.length > 0) {
    const user = authService.getUser();
    const userRole = user?.role;

    if (!allowedRoles.includes(userRole)) {
      // User không có quyền truy cập route này - redirect về trang home của role
      const homeRoute = getHomeRoute();
      return <Navigate to={homeRoute} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
