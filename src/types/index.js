/**
 * @fileoverview Type definitions for Admin Dashboard entities
 * These JSDoc types define the shape of data used throughout the application
 */

/**
 * User entity with role-based access
 * @typedef {Object} User
 * @property {number} id - Unique user identifier
 * @property {string} username - User's username
 * @property {string} email - User's email address
 * @property {string} fullName - User's full name
 * @property {'admin' | 'staff'} role - User role (admin or staff)
 * @property {string} phone - Phone number
 * @property {string} avatar - Avatar URL
 * @property {'active' | 'inactive'} status - Account status
 * @property {string} createdAt - Account creation date (ISO string)
 * @property {string} updatedAt - Last update date (ISO string)
 */

/**
 * Product category
 * @typedef {Object} Category
 * @property {number} id - Unique category identifier
 * @property {string} name - Category name
 * @property {string} description - Category description
 * @property {string} slug - URL-friendly slug
 * @property {number|null} parentId - Parent category ID (null for root categories)
 * @property {number} productCount - Number of products in this category
 * @property {string} imageUrl - Category image URL
 * @property {boolean} isActive - Whether category is active
 * @property {string} createdAt - Creation date (ISO string)
 * @property {string} updatedAt - Last update date (ISO string)
 */

/**
 * Product entity
 * @typedef {Object} Product
 * @property {number} id - Unique product identifier
 * @property {string} name - Product name
 * @property {string} sku - Stock Keeping Unit
 * @property {string} description - Product description
 * @property {number} categoryId - Associated category ID
 * @property {string} categoryName - Category name (for display)
 * @property {number} price - Product price
 * @property {number} costPrice - Cost price
 * @property {number} stock - Available stock quantity
 * @property {number} lowStockThreshold - Alert threshold for low stock
 * @property {string[]} images - Array of image URLs
 * @property {string} mainImage - Primary product image URL
 * @property {'in_stock' | 'low_stock' | 'out_of_stock'} stockStatus - Stock status
 * @property {boolean} isActive - Whether product is active
 * @property {Object} specifications - Product specifications (flexible object)
 * @property {string[]} tags - Product tags
 * @property {number} soldCount - Total units sold
 * @property {number} viewCount - Total product views
 * @property {number} rating - Average rating (0-5)
 * @property {number} reviewCount - Number of reviews
 * @property {string} createdAt - Creation date (ISO string)
 * @property {string} updatedAt - Last update date (ISO string)
 */

/**
 * Order item
 * @typedef {Object} OrderItem
 * @property {number} productId - Product ID
 * @property {string} productName - Product name
 * @property {string} sku - Product SKU
 * @property {number} quantity - Quantity ordered
 * @property {number} price - Price per unit at time of order
 * @property {number} subtotal - Item subtotal (quantity × price)
 */

/**
 * Order entity
 * @typedef {Object} Order
 * @property {number} id - Unique order identifier
 * @property {string} orderNumber - Human-readable order number
 * @property {number} customerId - Customer user ID
 * @property {string} customerName - Customer full name
 * @property {string} customerEmail - Customer email
 * @property {string} customerPhone - Customer phone
 * @property {OrderItem[]} items - Array of order items
 * @property {number} subtotal - Subtotal before discounts and fees
 * @property {number} discount - Discount amount
 * @property {number} tax - Tax amount
 * @property {number} shippingFee - Shipping fee
 * @property {number} total - Total order amount
 * @property {'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'} status - Order status
 * @property {'cod' | 'card' | 'bank_transfer' | 'e_wallet'} paymentMethod - Payment method
 * @property {'pending' | 'paid' | 'failed' | 'refunded'} paymentStatus - Payment status
 * @property {Object} shippingAddress - Shipping address details
 * @property {string} shippingAddress.fullName - Recipient name
 * @property {string} shippingAddress.phone - Recipient phone
 * @property {string} shippingAddress.address - Street address
 * @property {string} shippingAddress.city - City
 * @property {string} shippingAddress.district - District
 * @property {string} shippingAddress.ward - Ward
 * @property {string} shippingAddress.postalCode - Postal code
 * @property {string|null} couponCode - Applied coupon code
 * @property {string|null} notes - Order notes
 * @property {number|null} processedBy - Staff ID who processed the order
 * @property {string|null} processedByName - Staff name
 * @property {string} createdAt - Order creation date (ISO string)
 * @property {string} updatedAt - Last update date (ISO string)
 * @property {string|null} deliveredAt - Delivery date (ISO string)
 */

/**
 * Payroll entity
 * @typedef {Object} Payroll
 * @property {number} id - Unique payroll identifier
 * @property {number} userId - Staff user ID
 * @property {string} userName - Staff full name
 * @property {string} period - Pay period (e.g., "2026-01", "January 2026")
 * @property {number} baseSalary - Base salary amount
 * @property {number} bonus - Bonus amount
 * @property {number} deductions - Total deductions
 * @property {number} overtimeHours - Overtime hours worked
 * @property {number} overtimePay - Overtime payment
 * @property {number} allowances - Allowances (transport, meal, etc.)
 * @property {number} netSalary - Net salary (after all calculations)
 * @property {'draft' | 'approved' | 'paid'} status - Payroll status
 * @property {string|null} paidAt - Payment date (ISO string)
 * @property {number|null} approvedBy - Admin ID who approved
 * @property {string|null} approvedByName - Admin name
 * @property {string|null} notes - Additional notes
 * @property {string} createdAt - Creation date (ISO string)
 * @property {string} updatedAt - Last update date (ISO string)
 */

/**
 * Coupon/Discount entity
 * @typedef {Object} Coupon
 * @property {number} id - Unique coupon identifier
 * @property {string} code - Coupon code (unique)
 * @property {string} name - Coupon name/title
 * @property {string} description - Coupon description
 * @property {'percentage' | 'fixed'} discountType - Type of discount
 * @property {number} discountValue - Discount value (percentage or fixed amount)
 * @property {number|null} minOrderValue - Minimum order value required
 * @property {number|null} maxDiscountAmount - Maximum discount amount (for percentage)
 * @property {number|null} usageLimit - Total usage limit (null for unlimited)
 * @property {number} usedCount - Number of times used
 * @property {number|null} perUserLimit - Usage limit per user
 * @property {string} startDate - Coupon start date (ISO string)
 * @property {string} endDate - Coupon end date (ISO string)
 * @property {boolean} isActive - Whether coupon is active
 * @property {string[]} applicableCategories - Category IDs this coupon applies to (empty for all)
 * @property {string[]} applicableProducts - Product IDs this coupon applies to (empty for all)
 * @property {number} createdBy - Admin ID who created the coupon
 * @property {string} createdByName - Admin name
 * @property {string} createdAt - Creation date (ISO string)
 * @property {string} updatedAt - Last update date (ISO string)
 */

/**
 * Dashboard statistics
 * @typedef {Object} DashboardStats
 * @property {number} totalRevenue - Total revenue
 * @property {number} totalOrders - Total number of orders
 * @property {number} totalProducts - Total number of products
 * @property {number} totalCustomers - Total number of customers
 * @property {number} pendingOrders - Number of pending orders
 * @property {number} lowStockProducts - Number of low stock products
 * @property {Object} revenueComparison - Revenue comparison with previous period
 * @property {number} revenueComparison.current - Current period revenue
 * @property {number} revenueComparison.previous - Previous period revenue
 * @property {number} revenueComparison.changePercent - Percentage change
 */

export {};
