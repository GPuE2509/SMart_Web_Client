import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Space, Spin } from 'antd';
import {
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  LockOutlined,
  MenuUnfoldOutlined,
  InboxOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import authService from '../services/authService';
import { getUserDisplayInfo } from '../utils/roleUtils';
import '../layouts/AdminLayout.css';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const RepositoryLayout = () => {
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
  const selectedKey = location.pathname.includes('/batches') ? 'batches' : 'batches';

  const handleMenuClick = ({ key }) => {
    if (key === 'batches') {
      navigate('/repository/batches');
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
      onClick: () => navigate('/repository/profile'),
    },
    {
      key: 'change-password',
      icon: <LockOutlined />,
      label: 'Change Password',
      onClick: () => navigate('/repository/change-password'),
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
      type: 'group',
      label: 'Quản lý kho',
      key: 'warehouse',
      children: [
        {
          key: 'batches',
          icon: <InboxOutlined />,
          label: 'Quản lý lô hàng',
        },
      ],
    },
    {
      key: 'attendance',
      icon: <ClockCircleOutlined />,
      label: 'Chấm công',
      onClick: () => navigate('/repository/attendance'),
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

export default RepositoryLayout;
