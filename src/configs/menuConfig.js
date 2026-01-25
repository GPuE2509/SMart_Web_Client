/**
 * @fileoverview Menu configuration for sidebar navigation
 */

import {
  DashboardOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  UserOutlined,
  TagOutlined,
  BarChartOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  AppstoreAddOutlined,
  BarcodeOutlined,
} from "@ant-design/icons";

/**
 * Menu item configuration
 * @typedef {Object} MenuItem
 * @property {string} key - Unique identifier
 * @property {string} label - Display text
 * @property {React.ComponentType} icon - Ant Design icon component
 * @property {string} path - Route path
 * @property {MenuItem[]} [children] - Submenu items
 */

/**
 * @type {MenuItem[]}
 */
export const menuItems = [
  {
    type: "group",
    label: "Overview",
    key: "overview-group",
    children: [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: DashboardOutlined,
        path: "/dashboard",
      },
    ],
  },
  {
    type: "group",
    label: "Inventory",
    key: "inventory-group",
    children: [
      {
        key: "products",
        label: "Products",
        icon: ShoppingOutlined,
        path: "/products",
      },
      {
        key: "categories",
        label: "Categories",
        icon: AppstoreOutlined,
        path: "/categories",
      },
      {
        key: "units",
        label: "Units",
        icon: BarcodeOutlined,
        path: "/units",
      },
    ],
  },
  {
    type: "group",
    label: "Sales & Marketing",
    key: "sales-group",
    children: [
      {
        key: "orders",
        label: "Orders",
        icon: ShoppingCartOutlined,
        path: "/orders",
      },
      {
        key: "coupons",
        label: "Coupons",
        icon: TagOutlined,
        path: "/coupons",
      },
    ],
  },
  {
    type: "group",
    label: "Finance",
    key: "finance-group",
    children: [
      {
        key: "payroll",
        label: "Payroll",
        icon: DollarOutlined,
        path: "/payroll",
      },
      {
        key: "reports",
        label: "Reports",
        icon: BarChartOutlined,
        path: "/reports",
      },
    ],
  },
  {
    type: "group",
    label: "System",
    key: "system-group",
    children: [
      {
        key: "accounts",
        label: "Accounts",
        icon: UserOutlined,
        path: "/accounts",
      },
    ],
  },
];

/**
 * Get menu item by key
 * @param {string} key
 * @returns {MenuItem | undefined}
 */
export const getMenuItemByKey = (key) => {
  for (const group of menuItems) {
    if (group.children) {
      const item = group.children.find((item) => item.key === key);
      if (item) return item;
    }
  }
  return undefined;
};

/**
 * Get menu item by path
 * @param {string} path
 * @returns {MenuItem | undefined}
 */
export const getMenuItemByPath = (path) => {
  for (const group of menuItems) {
    if (group.children) {
      const item = group.children.find((item) => item.path === path);
      if (item) return item;
    }
  }
  return undefined;
};
