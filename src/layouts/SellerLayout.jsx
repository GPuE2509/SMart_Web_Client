import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Space, Spin } from 'antd';
import {
  LogoutOutlined,
  UserOutlined,
  LockOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import authService from '../services/authService';
import { getUserDisplayInfo } from '../utils/roleUtils';
import '../layouts/AdminLayout.css';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const SellerLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await authService.getUser();
        if (user) {
          setUserInfo(getUserDisplayInfo(user));
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const selectedKey = location.pathname.includes('/attendance') ? 'attendance' : 'pos';

  const handleMenuClick = ({ key }) => {
    if (key === 'pos') {
      navigate('/seller/pos');
      return;
    }
    if (key === 'attendance') {
      navigate('/seller/attendance');
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/SignIn');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/seller/pos'),
    },
    {
      key: 'change-password',
      icon: <LockOutlined />,
      label: 'Change Password',
      onClick: () => navigate('/seller/change-password'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: 'seller',
      icon: <ShoppingOutlined />,
      label: 'Trang chủ',
      onClick: () => navigate('/seller'),
    },
    {
      key: 'orders',
      icon: <ShoppingCartOutlined />,
      label: 'Đơn hàng',
      onClick: () => navigate('/seller/orders'),
    },
    {
      key: 'payroll',
      icon: <DollarOutlined />,
      label: 'Bảng lương',
      onClick: () => navigate('/seller/payroll'),
    },
    {
      type: 'group',
      label: 'Quản lý bán hàng',
      key: 'sales',
      children: [
        {
          key: 'pos',
          icon: <ShoppingOutlined />,
          label: 'POS thanh toán',
        },
      ],
    },
    {
      key: 'attendance',
      icon: <ClockCircleOutlined />,
      label: 'Chấm công',
    },
  ];

  return (
    <Layout className="main-layout">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="main-sider"
        width={250}
        breakpoint="lg"
        onBreakpoint={(broken) => {
          if (broken) setCollapsed(true);
        }}
      >
        <div className="logo">
          {!collapsed ? (
            <img
              src="/src/assets/logo.png"
              alt="SMart"
              className="logo-full"
            />
          ) : (
            <img
              src="/src/assets/logo.png"
              alt="SMart"
              className="logo-collapsed"
            />
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={handleMenuClick}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header className="main-header">
          <div className="header-left">
            {collapsed ? (
              <MenuUnfoldOutlined
                className="trigger"
                onClick={() => setCollapsed(!collapsed)}
              />
            ) : (
              <MenuFoldOutlined
                className="trigger"
                onClick={() => setCollapsed(!collapsed)}
              />
            )}
          </div>
          <div className="header-right">
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Space className="user-info" style={{ cursor: 'pointer' }}>
                <Avatar
                  src={userInfo?.avatar}
                  icon={<UserOutlined />}
                  size="default"
                />
                <Space orientation="vertical" size={0}>
                  <Text strong>{userInfo?.fullName}</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {userInfo?.role}
                  </Text>
                </Space>
              </Space>
            </Dropdown>
          </div>
        </Header>
        <Content className="main-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default SellerLayout;
