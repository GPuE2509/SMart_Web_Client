import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Space, Spin } from 'antd';
import {
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LockOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import authService from '../services/authService';
import { getUserDisplayInfo } from '../utils/roleUtils';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const SellerLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    await authService.logout();
    navigate('/SignIn');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
      onClick: () => navigate('/profile'),
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
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: 'seller',
      icon: <ShoppingOutlined />,
      label: 'Bán hàng',
      onClick: () => navigate('/seller'),
    },
    {
      key: 'products',
      icon: <AppstoreOutlined />,
      label: 'Sản phẩm',
      onClick: () => navigate('/seller/products'),
    },
    {
      key: 'attendance',
      icon: <ClockCircleOutlined />,
      label: 'Chấm công',
      onClick: () => navigate('/seller/attendance'),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <h2 style={{ margin: 0, color: 'white' }}>{collapsed ? 'S' : 'Seller'}</h2>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['seller']}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ paddingLeft: '16px' }}>
            {collapsed ? (
              <MenuUnfoldOutlined
                style={{ fontSize: '18px', cursor: 'pointer' }}
                onClick={() => setCollapsed(!collapsed)}
              />
            ) : (
              <MenuFoldOutlined
                style={{ fontSize: '18px', cursor: 'pointer' }}
                onClick={() => setCollapsed(!collapsed)}
              />
            )}
          </div>
          <div style={{ paddingRight: '16px' }}>
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  src={userInfo?.avatar}
                  icon={<UserOutlined />}
                  size="default"
                />
                <Space direction="vertical" size={0}>
                  <Text strong>{userInfo?.fullName}</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {userInfo?.role}
                  </Text>
                </Space>
              </Space>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default SellerLayout;
