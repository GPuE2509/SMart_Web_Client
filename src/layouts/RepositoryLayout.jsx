import { useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Space } from 'antd';
import {
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  InboxOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import authService from '../services/authService';
import { getUserDisplayInfo } from '../utils/roleUtils';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const RepositoryLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const userInfo = getUserDisplayInfo();

  const handleLogout = () => {
    authService.logout();
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
      key: 'repository',
      icon: <InboxOutlined />,
      label: 'Kho hàng',
      onClick: () => navigate('/repository'),
    },
    {
      key: 'inventory',
      icon: <BarChartOutlined />,
      label: 'Tồn kho',
      onClick: () => navigate('/repository/inventory'),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <h2 style={{ margin: 0, color: 'white' }}>{collapsed ? 'R' : 'Repository'}</h2>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['repository']}
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

export default RepositoryLayout;
