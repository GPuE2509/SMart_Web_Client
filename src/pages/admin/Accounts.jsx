import { useState } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Input,
  Drawer,
  Form,
  Select,
  message,
  Tag,
  Typography,
  Avatar,
  Popconfirm,
  Row,
  Col,
  Tooltip,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  UserOutlined,
  SearchOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import { mockUsers } from '../../services/mockData';

const { Title, Text } = Typography;

const Accounts = () => {
  const [users, setUsers] = useState([...mockUsers]);
  const [filteredUsers, setFilteredUsers] = useState([...mockUsers]);
  const [loading, setLoading] = useState(false);
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [createAvatarFileList, setCreateAvatarFileList] = useState([]);
  const [editAvatarFileList, setEditAvatarFileList] = useState([]);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Handle avatar upload
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleCreateAvatarChange = async ({ fileList }) => {
    setCreateAvatarFileList(fileList);
    
    if (fileList.length > 0 && fileList[0].originFileObj) {
      const base64 = await getBase64(fileList[0].originFileObj);
      createForm.setFieldsValue({ avatar: base64 });
    } else {
      createForm.setFieldsValue({ avatar: null });
    }
  };

  const handleEditAvatarChange = async ({ fileList }) => {
    setEditAvatarFileList(fileList);
    
    if (fileList.length > 0 && fileList[0].originFileObj) {
      const base64 = await getBase64(fileList[0].originFileObj);
      editForm.setFieldsValue({ avatar: base64 });
    } else {
      editForm.setFieldsValue({ avatar: null });
    }
  };

  // Role color mapping
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

  // Status color mapping
  const getStatusColor = (status) => {
    return status === 'active' ? 'green' : 'red';
  };

  // Search and filter handler
  const handleSearch = (value, role = selectedRole) => {
    let filtered = users;

    // Filter by search text
    if (value) {
      filtered = filtered.filter(
        (user) =>
          user.fullName.toLowerCase().includes(value.toLowerCase()) ||
          user.email.toLowerCase().includes(value.toLowerCase()) ||
          user.phone.toLowerCase().includes(value.toLowerCase())
      );
    }

    // Filter by role
    if (role) {
      filtered = filtered.filter((user) => user.role === role);
    }

    setFilteredUsers(filtered);
  };

  // Role filter handler
  const handleRoleFilter = (role) => {
    setSelectedRole(role);
    handleSearch('', role);
  };

  // Toggle user status (Active/Blocked)
  const handleToggleStatus = async (userId) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const updatedUsers = users.map((user) =>
        user.id === userId
          ? {
              ...user,
              status: user.status === 'active' ? 'inactive' : 'active',
              updatedAt: new Date().toISOString(),
            }
          : user
      );

      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);

      const user = users.find((u) => u.id === userId);
      message.success(
        `User ${user.status === 'active' ? 'blocked' : 'activated'} successfully!`
      );
    } catch {
      message.error('Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  // Open create staff drawer
  const handleOpenCreateDrawer = () => {
    createForm.resetFields();
    createForm.setFieldsValue({ role: 'staff', status: 'active' });
    setCreateDrawerVisible(true);
  };

  // Close create drawer
  const handleCloseCreateDrawer = () => {
    setCreateDrawerVisible(false);
    setCreateAvatarFileList([]);
    createForm.resetFields();
  };

  // Create new staff
  const handleCreateStaff = async () => {
    try {
      const values = await createForm.validateFields();
      setLoading(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      const newUser = {
        id: Math.max(...users.map((u) => u.id)) + 1,
        username: values.email.split('@')[0],
        email: values.email,
        fullName: values.fullName,
        role: values.role,
        phone: values.phone,
        avatar: values.avatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
      message.success('Staff account created successfully!');
      handleCloseCreateDrawer();
    } catch {
      // Validation failed
    } finally {
      setLoading(false);
    }
  };

  // Open edit drawer
  const handleOpenEditDrawer = (user) => {
    setEditingUser(user);
    editForm.setFieldsValue({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
    });
    
    // Set avatar file list
    if (user.avatar) {
      setEditAvatarFileList([{
        uid: '-1',
        name: 'avatar.png',
        status: 'done',
        url: user.avatar,
      }]);
    } else {
      setEditAvatarFileList([]);
    }
    
    setEditDrawerVisible(true);
  };

  // Close edit drawer
  const handleCloseEditDrawer = () => {
    setEditDrawerVisible(false);
    setEditingUser(null);
    setEditAvatarFileList([]);
    editForm.resetFields();
  };

  // Update user profile
  const handleUpdateProfile = async () => {
    try {
      const values = await editForm.validateFields();
      setLoading(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      const updatedUsers = users.map((user) =>
        user.id === editingUser.id
          ? {
              ...user,
              ...values,
              username: values.email.split('@')[0],
              updatedAt: new Date().toISOString(),
            }
          : user
      );

      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
      message.success('User profile updated successfully!');
      handleCloseEditDrawer();
    } catch {
      // Validation failed
    } finally {
      setLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (avatar) => (
        <Avatar
          src={avatar}
          icon={!avatar && <UserOutlined />}
          size={50}
        />
      ),
    },
    {
      title: 'Full Name',
      dataIndex: 'fullName',
      key: 'fullName',
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <strong>{text}</strong>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            @{record.username}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email, record) => (
        <Space direction="vertical" size={0}>
          <Text>{email}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.phone}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      filters: [
        { text: 'Admin', value: 'admin' },
        { text: 'Staff', value: 'staff' },
      ],
      onFilter: (value, record) => record.role === value,
      render: (role) => (
        <Tag color={getRoleColor(role)}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Blocked', value: 'inactive' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status === 'active' ? 'ACTIVE' : 'BLOCKED'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleOpenEditDrawer(record)}
            />
          </Tooltip>
          <Popconfirm
            title={`${record.status === 'active' ? 'Block' : 'Activate'} User`}
            description={`Are you sure you want to ${
              record.status === 'active' ? 'block' : 'activate'
            } this user?`}
            onConfirm={() => handleToggleStatus(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title={record.status === 'active' ? 'Block' : 'Activate'}>
              <Button
                type="link"
                danger={record.status === 'active'}
                icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3} style={{ margin: 0 }}>
              Account Management
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreateDrawer}
            >
              Create Staff
            </Button>
          </div>

          <Space size="middle" style={{ width: '100%', flexWrap: 'wrap' }}>
            <Input
              placeholder="Search by name, email, or phone..."
              prefix={<SearchOutlined />}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
              style={{ width: 350 }}
            />
            <Select
              placeholder="Filter by role"
              style={{ width: 150 }}
              allowClear
              onChange={handleRoleFilter}
              options={[
                { label: 'All Roles', value: null },
                { label: 'Admin', value: 'admin' },
                { label: 'Staff', value: 'staff' },
              ]}
            />
          </Space>

          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} users`,
            }}
          />
        </Space>
      </Card>

      {/* Create Staff Drawer */}
      <Drawer
        title="Create Staff Account"
        open={createDrawerVisible}
        onClose={handleCloseCreateDrawer}
        width={600}
        extra={
          <Space>
            <Button onClick={handleCloseCreateDrawer}>Cancel</Button>
            <Button type="primary" onClick={handleCreateStaff} loading={loading}>
              Create
            </Button>
          </Space>
        }
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter full name' }]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' },
                ]}
              >
                <Input placeholder="email@example.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true, message: 'Please enter phone' }]}
              >
                <Input placeholder="+1-555-0000" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select role' }]}
          >
            <Select
              placeholder="Select role"
              options={[
                { label: 'Staff', value: 'staff' },
                { label: 'Admin', value: 'admin' },
              ]}
            />
          </Form.Item>

          <Form.Item name="avatar" label="Avatar (Optional)">
            <Upload
              listType="picture-card"
              fileList={createAvatarFileList}
              onChange={handleCreateAvatarChange}
              beforeUpload={() => false}
              maxCount={1}
            >
              {createAvatarFileList.length === 0 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Edit Profile Drawer */}
      <Drawer
        title="Update User Profile"
        open={editDrawerVisible}
        onClose={handleCloseEditDrawer}
        width={600}
        extra={
          <Space>
            <Button onClick={handleCloseEditDrawer}>Cancel</Button>
            <Button type="primary" onClick={handleUpdateProfile} loading={loading}>
              Save
            </Button>
          </Space>
        }
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter full name' }]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' },
                ]}
              >
                <Input placeholder="email@example.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true, message: 'Please enter phone' }]}
              >
                <Input placeholder="+1-555-0000" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select role' }]}
          >
            <Select
              placeholder="Select role"
              options={[
                { label: 'Staff', value: 'staff' },
                { label: 'Admin', value: 'admin' },
              ]}
            />
          </Form.Item>

          <Form.Item name="avatar" label="Avatar">
            <Upload
              listType="picture-card"
              fileList={editAvatarFileList}
              onChange={handleEditAvatarChange}
              beforeUpload={() => false}
              maxCount={1}
            >
              {editAvatarFileList.length === 0 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default Accounts;
