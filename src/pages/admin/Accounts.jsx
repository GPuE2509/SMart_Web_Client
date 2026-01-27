import { useState, useEffect } from 'react';
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
  Popconfirm,
  Tag,
  Typography,
  Avatar,
  Row,
  Col,
  Upload,
  Tooltip,
  Badge,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  SearchOutlined,
  StopOutlined,
  CheckCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  CameraOutlined,
} from '@ant-design/icons';
import profileService from '../../services/profileService';

const { Title } = Typography;

function Accounts() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [imageFileList, setImageFileList] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch users from API
  const fetchUsers = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: params.page || pagination.current,
        limit: params.limit || pagination.pageSize,
        ...params,
      };
      const response = await profileService.getAllUsers(queryParams);
      const data = response.data || [];
      setUsers(data);
      setPagination(prev => ({
        ...prev,
        current: response.pagination?.page || prev.current,
        pageSize: response.pagination?.limit || prev.pageSize,
        total: response.pagination?.total || data.length,
      }));
    } catch (error) {
      message.error(error.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  // Search handler
  const handleSearch = (value) => {
    setSearchText(value);
    const params = { page: 1 };
    if (value) params.search = value;
    if (selectedRole) params.role = selectedRole;
    if (selectedStatus) params.status = selectedStatus;
    fetchUsers(params);
  };

  // Role filter handler
  const handleRoleFilter = (role) => {
    setSelectedRole(role);
    const params = { page: 1 };
    if (searchText) params.search = searchText;
    if (role) params.role = role;
    if (selectedStatus) params.status = selectedStatus;
    fetchUsers(params);
  };

  // Status filter handler
  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    const params = { page: 1 };
    if (searchText) params.search = searchText;
    if (selectedRole) params.role = selectedRole;
    if (status) params.status = status;
    fetchUsers(params);
  };

  // Handle table pagination change
  const handleTableChange = (paginationConfig) => {
    const params = {
      page: paginationConfig.current,
      limit: paginationConfig.pageSize,
    };
    if (searchText) params.search = searchText;
    if (selectedRole) params.role = selectedRole;
    if (selectedStatus) params.status = selectedStatus;
    fetchUsers(params);
  };

  // Handle image upload
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Chỉ được upload file hình ảnh!');
      return Upload.LIST_IGNORE;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Hình ảnh phải nhỏ hơn 5MB!');
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const handleImageChange = async ({ fileList }) => {
    setImageFileList(fileList);
    
    if (fileList.length > 0 && fileList[0].originFileObj) {
      const base64 = await getBase64(fileList[0].originFileObj);
      form.setFieldsValue({ avatar_url: base64 });
    } else if (fileList.length === 0) {
      form.setFieldsValue({ avatar_url: '' });
    }
  };

  // Open drawer for edit
  const handleOpenDrawer = (user) => {
    setEditingUser(user);
    
    if (user.avatar_url) {
      setImageFileList([{
        uid: '-1',
        name: 'avatar.png',
        status: 'done',
        url: user.avatar_url,
      }]);
    } else {
      setImageFileList([]);
    }

    form.setFieldsValue({
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      address: {
        street: user.address?.street || '',
        ward: user.address?.ward || '',
        district: user.address?.district || '',
        city: user.address?.city || ''
      }
    });

    setDrawerVisible(true);
  };

  // Close drawer
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setEditingUser(null);
    setImageFileList([]);
    form.resetFields();
  };

  // Save user changes
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Get avatar_url
      let avatarUrl = editingUser?.avatar_url || '';
      if (imageFileList.length > 0) {
        if (imageFileList[0].originFileObj) {
          avatarUrl = await getBase64(imageFileList[0].originFileObj);
        } else if (imageFileList[0].url) {
          avatarUrl = imageFileList[0].url;
        }
      } else {
        avatarUrl = '';
      }

      const userData = {
        full_name: values.full_name,
        phone: values.phone,
        avatar_url: avatarUrl,
        address: {
          street: values.address?.street || '',
          ward: values.address?.ward || '',
          district: values.address?.district || '',
          city: values.address?.city || ''
        }
      };

      // Update profile
      await profileService.updateUserProfile(editingUser._id, userData);

      // Update role if changed
      if (values.role !== editingUser.role) {
        await profileService.updateUserRole(editingUser._id, values.role);
      }

      // Update status if changed
      if (values.status !== editingUser.status) {
        await profileService.updateUserStatus(editingUser._id, values.status);
      }

      message.success('Cập nhật thông tin người dùng thành công!');
      handleCloseDrawer();
      fetchUsers();
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  // Toggle user status
  const handleToggleStatus = async (userId, currentStatus) => {
    setLoading(true);
    try {
      const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
      await profileService.updateUserStatus(userId, newStatus);
      message.success(`Đã ${newStatus === 'active' ? 'kích hoạt' : 'khóa'} tài khoản thành công`);
      fetchUsers();
    } catch (error) {
      message.error(error.message || 'Không thể cập nhật trạng thái người dùng');
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    setLoading(true);
    try {
      await profileService.deleteUser(userId);
      message.success('Đã xóa người dùng thành công');
      fetchUsers();
    } catch (error) {
      message.error(error.message || 'Không thể xóa người dùng');
    } finally {
      setLoading(false);
    }
  };

  // Get role display
  const getRoleDisplay = (role) => {
    const roleMap = {
      'admin': { text: 'Admin', color: 'red' },
      'seller_staff': { text: 'NV Bán hàng', color: 'blue' },
      'repository_staff': { text: 'NV Kho', color: 'green' },
      'customer': { text: 'Khách hàng', color: 'default' }
    };
    return roleMap[role] || { text: role, color: 'default' };
  };

  // Table columns
  const columns = [
    {
      title: 'Người dùng',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (name, record) => (
        <Space>
          <Avatar
            src={record.avatar_url}
            icon={!record.avatar_url && <UserOutlined />}
          />
          <div>
            <div>{name || 'N/A'}</div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              {record.isVerified ? (
                <Badge status="success" text="Đã xác thực" />
              ) : (
                <Badge status="warning" text="Chưa xác thực" />
              )}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => email || 'N/A',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || 'N/A',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const display = getRoleDisplay(role);
        return <Tag color={display.color}>{display.text}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'error'}>
          {status === 'active' ? 'Hoạt động' : 'Bị khóa'}
        </Tag>
      ),
    },
    {
      title: 'Điểm tích lũy',
      dataIndex: 'loyalty_points',
      key: 'loyalty_points',
      align: 'center',
      render: (points) => points || 0,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Sửa">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenDrawer(record)}
            />
          </Tooltip>
          {record.role !== 'admin' && (
            <>
              <Popconfirm
                title={record.status === 'active' ? "Khóa tài khoản" : "Kích hoạt tài khoản"}
                description={record.status === 'active' 
                  ? "Người dùng sẽ không thể đăng nhập" 
                  : "Người dùng sẽ có thể đăng nhập trở lại"}
                onConfirm={() => handleToggleStatus(record._id, record.status)}
                okText="Có"
                cancelText="Không"
              >
                <Tooltip title={record.status === 'active' ? "Khóa" : "Kích hoạt"}>
                  <Button 
                    type="text" 
                    size="small" 
                    danger={record.status === 'active'}
                    style={{ color: record.status === 'active' ? undefined : '#52c41a' }}
                    icon={record.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />} 
                  />
                </Tooltip>
              </Popconfirm>
            </>
          )}
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
              Quản lý tài khoản
            </Title>
          </div>

          <Space size="middle" style={{ width: '100%', flexWrap: 'wrap' }}>
            <Input
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              prefix={<SearchOutlined />}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
              style={{ width: 350 }}
            />
            <Select
              placeholder="Lọc theo vai trò"
              style={{ width: 180 }}
              allowClear
              onChange={handleRoleFilter}
              options={[
                { label: 'Tất cả vai trò', value: null },
                { label: 'Admin', value: 'admin' },
                { label: 'NV Bán hàng', value: 'seller_staff' },
                { label: 'NV Kho', value: 'repository_staff' },
                { label: 'Khách hàng', value: 'customer' },
              ]}
            />
            <Select
              placeholder="Lọc theo trạng thái"
              style={{ width: 180 }}
              allowClear
              onChange={handleStatusFilter}
              options={[
                { label: 'Tất cả trạng thái', value: null },
                { label: 'Hoạt động', value: 'active' },
                { label: 'Bị khóa', value: 'blocked' },
              ]}
            />
          </Space>

          <Table
            columns={columns}
            dataSource={users}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => `Tổng ${total} người dùng`,
            }}
            onChange={handleTableChange}
          />
        </Space>
      </Card>

      {/* Edit User Drawer */}
      <Drawer
        title="Chỉnh sửa thông tin người dùng"
        open={drawerVisible}
        onClose={handleCloseDrawer}
        width={720}
        extra={
          <Space>
            <Button onClick={handleCloseDrawer}>Hủy</Button>
            <Button type="primary" onClick={handleSave} loading={loading}>
              Lưu thay đổi
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          {/* Avatar */}
          <Form.Item
            label="Ảnh đại diện"
            extra="Chỉ chấp nhận file ảnh, tối đa 5MB"
          >
            <Upload
              listType="picture-card"
              fileList={imageFileList}
              onChange={handleImageChange}
              beforeUpload={beforeUpload}
              maxCount={1}
              accept="image/*"
            >
              {imageFileList.length === 0 && (
                <div>
                  <CameraOutlined style={{ fontSize: '24px' }} />
                  <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          {/* Full Name */}
          <Form.Item
            name="full_name"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Nhập họ và tên"
            />
          </Form.Item>

          {/* Phone */}
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại' },
              { 
                pattern: /^(0[3|5|7|8|9])+([0-9]{8})$/,
                message: 'Số điện thoại không hợp lệ'
              }
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="Nhập số điện thoại"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              {/* Role */}
              <Form.Item
                name="role"
                label="Vai trò"
                rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
              >
                <Select
                  placeholder="Chọn vai trò"
                  options={[
                    { label: 'Admin', value: 'admin' },
                    { label: 'Nhân viên bán hàng', value: 'seller_staff' },
                    { label: 'Nhân viên kho', value: 'repository_staff' },
                    { label: 'Khách hàng', value: 'customer' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              {/* Status */}
              <Form.Item
                name="status"
                label="Trạng thái"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
              >
                <Select
                  placeholder="Chọn trạng thái"
                  options={[
                    { label: 'Hoạt động', value: 'active' },
                    { label: 'Bị khóa', value: 'blocked' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Address */}
          <Form.Item
            name={['address', 'street']}
            label="Số nhà, tên đường"
          >
            <Input
              prefix={<HomeOutlined />}
              placeholder="Nhập số nhà, tên đường"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['address', 'ward']}
                label="Phường/Xã"
              >
                <Input placeholder="Nhập phường/xã" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['address', 'district']}
                label="Quận/Huyện"
              >
                <Input placeholder="Nhập quận/huyện" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name={['address', 'city']}
            label="Tỉnh/Thành phố"
          >
            <Input placeholder="Nhập tỉnh/thành phố" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

export default Accounts;
