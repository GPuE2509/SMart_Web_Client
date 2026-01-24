import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Space } from 'antd';
import {
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { menuItems } from '../configs/menuConfig';
import { getAuthUser, logout } from '../utils/auth';
import './MainLayout.css';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getAuthUser();

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/profile'),
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
              src="/assets/logo.png" 
              alt="SMart" 
              className="logo-full"
            />
          ) : (
            <img 
              src="/assets/logo.png" 
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
                  src={currentUser?.avatar}
                  icon={<UserOutlined />}
                  size="default"
                />
                <Space orientation="vertical" size={0}>
                  <Text strong>{currentUser?.fullName}</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {currentUser?.role}
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

export default MainLayout;
