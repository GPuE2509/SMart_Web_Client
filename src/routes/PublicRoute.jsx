import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Spin } from 'antd';
import authService from '../services/authService';
import { getHomeRoute, canAccessSystem } from '../utils/roleUtils';

/**
 * Public Route Component
 * Redirects to appropriate page based on user role if already authenticated
 * Used for sign in and forgot-password pages
 */
const PublicRoute = ({ children }) => {
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
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isAuth) {
    // Check access permission
    if (!canAccessSystem(user)) {
      // If customer, logout
      authService.logout();
      return children;
    }
    
    // Redirect to home based on role
    const homeRoute = getHomeRoute(user);
    return <Navigate to={homeRoute} replace />;
  }

  return children;
};

export default PublicRoute;
