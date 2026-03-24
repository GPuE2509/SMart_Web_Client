// Repository staff payroll page - reuses the same component as seller staff
// Both seller_staff and repository_staff can view their own payroll using the same interface

import SellerPayroll from '../seller/SellerPayroll';

// Re-export the SellerPayroll component for repository staff
// The component is role-agnostic and shows appropriate data based on user role
function RepositoryPayroll() {
  return <SellerPayroll />;
}

export default RepositoryPayroll;
