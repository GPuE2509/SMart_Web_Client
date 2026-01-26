import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Space, Spin } from 'antd';
import {
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  LockOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { menuItems } from '../configs/menuConfig';
import authService from '../services/authService';
import { getUserDisplayInfo } from '../utils/roleUtils';
import './AdminLayout.css';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const AdminLayout = () => {
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

  // Get current selected menu key from path
  const selectedKey = (() => {
    for (const group of menuItems) {
      if (group.children) {
        const item = group.children.find(item =>
          location.pathname.startsWith(item.path)
        );
        if (item) return item.key;
      }
    }
    return 'dashboard';
  })();

  const handleMenuClick = ({ key }) => {
    for (const group of menuItems) {
      if (group.children) {
        const menuItem = group.children.find(item => item.key === key);
        if (menuItem) {
          navigate(menuItem.path);
          return;
        }
      }
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/admin/profile'),
    },
    {
      key: 'change-password',
      icon: <LockOutlined />,
      label: 'Change Password',
      onClick: () => navigate('/admin/change-password'),
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
          items={menuItems.map(group => ({
            type: group.type,
            label: group.label,
            key: group.key,
            children: group.children?.map(item => ({
              key: item.key,
              icon: <item.icon />,
              label: item.label,
            })),
          }))}
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

        <Content className="main-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
