import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Avatar,
  Typography,
  Descriptions,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  Divider,
  Tag,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { getAuthUser } from '../../utils/auth';

const { Title, Text } = Typography;

const Profile = () => {
  const currentUser = getAuthUser();
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // Open edit profile modal
  const handleOpenEditModal = () => {
    editForm.setFieldsValue({
      fullName: currentUser.fullName,
      email: currentUser.email,
      phone: currentUser.phone,
    });
    setEditModalVisible(true);
  };

  // Close edit modal
  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    editForm.resetFields();
  };

  // Update profile
  const handleUpdateProfile = async () => {
    try {
      const values = await editForm.validateFields();
      setLoading(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // In a real app, update localStorage and backend
      const updatedUser = {
        ...currentUser,
        ...values,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem('admin_dashboard_user', JSON.stringify(updatedUser));
      message.success('Profile updated successfully! Please refresh to see changes.');
      handleCloseEditModal();
    } catch {
      // Validation failed
    } finally {
      setLoading(false);
    }
  };

  // Open change password modal
  const handleOpenPasswordModal = () => {
    passwordForm.resetFields();
    setPasswordModalVisible(true);
  };

  // Close password modal
  const handleClosePasswordModal = () => {
    setPasswordModalVisible(false);
    passwordForm.resetFields();
  };

  // Change password
  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      console.log('Password change values:', values);
      setLoading(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real app, validate current password and update
      message.success('Password changed successfully!');
      handleClosePasswordModal();
    } catch {
      // Validation failed
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'red';
      case 'staff':
        return 'blue';
      default:
        return 'default';
    }
  };

  return (
    <div>
      <Row gutter={[24, 24]}>
        {/* Profile Card */}
        <Col xs={24} lg={8}>
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
              <Avatar
                src={currentUser?.avatar}
                icon={!currentUser?.avatar && <UserOutlined />}
                size={120}
              />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {currentUser?.fullName}
                </Title>
                <Text type="secondary">@{currentUser?.username}</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color={getRoleColor(currentUser?.role)}>
                    {currentUser?.role?.toUpperCase()}
                  </Tag>
                  <Tag color={currentUser?.status === 'active' ? 'green' : 'red'}>
                    {currentUser?.status?.toUpperCase()}
                  </Tag>
                </div>
              </div>

              <Divider />

              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={handleOpenEditModal}
                  block
                >
                  Edit Profile
                </Button>
                <Button
                  icon={<LockOutlined />}
                  onClick={handleOpenPasswordModal}
                  block
                >
                  Change Password
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>

        {/* Profile Details */}
        <Col xs={24} lg={16}>
          <Card title="Profile Information">
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Full Name">
                {currentUser?.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Username">
                @{currentUser?.username}
              </Descriptions.Item>
              <Descriptions.Item
                label="Email"
                icon={<MailOutlined />}
              >
                <Space>
                  <MailOutlined />
                  {currentUser?.email}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                <Space>
                  <PhoneOutlined />
                  {currentUser?.phone}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Role">
                <Tag color={getRoleColor(currentUser?.role)}>
                  {currentUser?.role?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={currentUser?.status === 'active' ? 'green' : 'red'}>
                  {currentUser?.status?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Account Created">
                <Space>
                  <CalendarOutlined />
                  {formatDate(currentUser?.createdAt)}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                <Space>
                  <CalendarOutlined />
                  {formatDate(currentUser?.updatedAt)}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Account Statistics" style={{ marginTop: 24 }}>
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                    {Math.floor((new Date() - new Date(currentUser?.createdAt)) / (1000 * 60 * 60 * 24))}
                  </Title>
                  <Text type="secondary">Days Active</Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={2} style={{ margin: 0, color: '#52c41a' }}>
                    {currentUser?.role === 'admin' ? 'Full' : 'Limited'}
                  </Title>
                  <Text type="secondary">Access Level</Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={2} style={{ margin: 0, color: '#faad14' }}>
                    {Math.floor(Math.random() * 100)}
                  </Title>
                  <Text type="secondary">Actions Today</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Edit Profile Modal */}
      <Modal
        title="Edit Profile"
        open={editModalVisible}
        onOk={handleUpdateProfile}
        onCancel={handleCloseEditModal}
        confirmLoading={loading}
        width={600}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="fullName"
            label="Full Name"
          >
            <Input placeholder="Enter full name" prefix={<UserOutlined />} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
          >
            <Input placeholder="email@example.com" prefix={<MailOutlined />} disabled />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone"
          >
            <Input placeholder="+1-555-0000" prefix={<PhoneOutlined />} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        title="Change Password"
        open={passwordModalVisible}
        onOk={handleChangePassword}
        onCancel={handleClosePasswordModal}
        confirmLoading={loading}
        width={500}
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="currentPassword"
            label="Current Password"
            rules={[{ required: true, message: 'Please enter current password' }]}
          >
            <Input.Password
              placeholder="Enter current password"
              prefix={<LockOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter new password' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password
              placeholder="Enter new password"
              prefix={<LockOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="Confirm new password"
              prefix={<LockOutlined />}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
