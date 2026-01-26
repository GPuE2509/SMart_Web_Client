import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Spin } from 'antd';
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
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await authService.isAuthenticated();
        if (!authenticated) {
          setIsAuth(false);
          setLoading(false);
          return;
        }

        const currentUser = await authService.getUser();
        setUser(currentUser);
        setIsAuth(true);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [location]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to="/SignIn" replace />;
  }

  // Check system access permission
  if (!canAccessSystem(user)) {
    // Customer doesn't have permission - logout and redirect
    authService.logout();
    return <Navigate to="/SignIn" replace />;
  }

  // Check role-based access if allowedRoles specified
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role;

    if (!allowedRoles.includes(userRole)) {
      // User doesn't have permission for this route - redirect to their home
      const homeRoute = getHomeRoute(user);
      return <Navigate to={homeRoute} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
