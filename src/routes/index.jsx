import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import ChangePassword from '../pages/auth/ChangePassword';
import Dashboard from '../pages/admin/Dashboard';
import Products from '../pages/admin/Products';
import Categories from '../pages/admin/Categories';
import ProductUnits from '../pages/admin/ProductUnits';
import Accounts from '../pages/admin/Accounts';
import Profile from '../pages/admin/Profile';
import Coupons from '../pages/admin/Coupons';
import Reports from '../pages/admin/Reports';
import ProtectedRoute from './ProtectedRoute';

// Placeholder components for other pages
const Orders = () => <div><h2>Orders Page</h2><p>Order management will be implemented here.</p></div>;
const Payroll = () => <div><h2>Payroll Page</h2><p>Payroll management will be implemented here.</p></div>;

/**
 * Application router configuration
 */
const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'products',
        element: <Products />,
      },
      {
        path: 'categories',
        element: <Categories />,
      },
      {
        path: 'units',
        element: <ProductUnits />,
      },
      {
        path: 'orders',
        element: <Orders />,
      },
      {
        path: 'accounts',
        element: <Accounts />,
      },
      {
        path: 'coupons',
        element: <Coupons />,
      },
      {
        path: 'payroll',
        element: <Payroll />,
      },
      {
        path: 'reports',
        element: <Reports />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'change-password',
        element: <ChangePassword />,
      },
    ],
  },
  // Seller routes with separate layout
  {
    path: '/seller',
    element: (
      <ProtectedRoute allowedRoles={['seller_staff']}>
        <SellerLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <SellerDashboard />,
      },
      {
        path: 'change-password',
        element: <ChangePassword />,
      },
    ],
  },
  // Repository routes with separate layout
  {
    path: '/repository',
    element: (
      <ProtectedRoute allowedRoles={['repository_staff']}>
        <RepositoryLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <RepositoryDashboard />,
      },
      {
        path: 'change-password',
        element: <ChangePassword />,
      },
    ],
  },
  // Root redirect
  {
    path: '/',
    element: <Navigate to="/admin/dashboard" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

export default router;
