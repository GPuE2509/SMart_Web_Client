import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/AdminLayout';
import SellerLayout from '../layouts/SellerLayout';
import RepositoryLayout from '../layouts/RepositoryLayout';
import SignIn from '../pages/auth/SignIn';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import ChangePassword from '../pages/auth/ChangePassword';
import Dashboard from '../pages/admin/Dashboard';
import Products from '../pages/admin/Products';
import Categories from '../pages/admin/Categories';
import Units from '../pages/admin/Units';
import Accounts from '../pages/admin/Accounts';
import Profile from '../pages/admin/Profile';
import Coupons from '../pages/admin/Coupons';
import Reports from '../pages/admin/Reports';
import Orders from '../pages/admin/Orders';
import Payslips from '../pages/admin/Payslips';
import SellerDashboard from '../pages/seller/SellerDashboard';
import RepositoryDashboard from '../pages/repository/RepositoryDashboard';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

/**
 * Application router configuration
 */
const router = createBrowserRouter([
  {
    path: '/SignIn',
    element: (
      <PublicRoute>
        <SignIn />
      </PublicRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <PublicRoute>
        <ForgotPassword />
      </PublicRoute>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <PublicRoute>
        <ResetPassword />
      </PublicRoute>
    ),
  },
  // Admin routes with MainLayout
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
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
        element: <Units />,
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
        path: 'payslips',
        element: <Payslips />,
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
    element: <Navigate to="/admin/dashboard" replace />,
  },
]);

export default router;
