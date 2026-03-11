import { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Space,
  Input,
  Drawer,
  Form,
  Select,
  message,
  Tag,
  Typography,
  Avatar,
  Row,
  Col,
  Button,
  Modal,
} from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  MailOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  SafetyOutlined,
  PlusOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import profileService from '../../services/profileService';
import userService from '../../services/userService';

const { Title, Text } = Typography;

function Accounts() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

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

  // Open detail drawer to view user info
  const handleViewDetail = (user) => {
    setViewingUser(user);
    setDetailDrawerVisible(true);
  };

  // Close detail drawer
  const handleCloseDetailDrawer = () => {
    setDetailDrawerVisible(false);
    setViewingUser(null);
  };

  // Handle inline role update
  const handleRoleUpdate = async (userId, newRole, currentRole) => {
    if (newRole === currentRole) return;
    
    setLoading(true);
    try {
      await profileService.updateUserRole(userId, newRole);
      message.success('Cập nhật vai trò thành công!');
      fetchUsers();
    } catch (error) {
      message.error(error.message || 'Không thể cập nhật vai trò');
    } finally {
      setLoading(false);
    }
  };

  // Handle inline status update
  const handleStatusUpdate = async (userId, newStatus, currentStatus) => {
    if (newStatus === currentStatus) return;
    
    setLoading(true);
    try {
      await profileService.updateUserStatus(userId, newStatus);
      message.success(`Đã ${newStatus === 'active' ? 'kích hoạt' : 'khóa'} tài khoản thành công!`);
      fetchUsers();
    } catch (error) {
      message.error(error.message || 'Không thể cập nhật trạng thái');
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

  // Handle open create modal
  const handleOpenCreateModal = () => {
    createForm.resetFields();
    setCreateModalVisible(true);
  };

  // Handle close create modal
  const handleCloseCreateModal = () => {
    setCreateModalVisible(false);
    createForm.resetFields();
  };

  // Handle create staff account
  const handleCreateStaffAccount = async (values) => {
    setCreateLoading(true);
    try {
      const response = await userService.createStaffAccount(values);
      message.success(response.message || 'Tạo tài khoản thành công! Email xác thực đã được gửi.');
      handleCloseCreateModal();
      fetchUsers(); // Refresh the list
    } catch (error) {
      message.error(error.message || 'Không thể tạo tài khoản');
    } finally {
      setCreateLoading(false);
    }
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
            style={{ cursor: 'pointer' }}
            onClick={() => handleViewDetail(record)}
          />
          <div>
            <div style={{ cursor: 'pointer' }} onClick={() => handleViewDetail(record)}>
              {name || 'N/A'}
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
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 200,
      render: (role, record) => {
        if (record.role === 'admin') {
          const display = getRoleDisplay(role);
          return <Tag color={display.color}>{display.text}</Tag>;
        }
        return (
          <Select
            value={role}
            style={{ width: '100%' }}
            size="small"
            disabled={!record.isVerified}
            onChange={(value) => handleRoleUpdate(record._id, value, role)}
            options={[
              { label: 'Nhân viên bán hàng', value: 'seller_staff' },
              { label: 'Nhân viên kho', value: 'repository_staff' },
              { label: 'Khách hàng', value: 'customer' },
            ]}
          />
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status, record) => {
        if (record.role === 'admin') {
          return (
            <Tag color={status === 'active' ? 'success' : 'error'}>
              {status === 'active' ? 'Hoạt động' : 'Bị khóa'}
            </Tag>
          );
        }
        return (
          <Select
            value={status}
            style={{ width: '100%' }}
            size="small"
            disabled={!record.isVerified}
            onChange={(value) => handleStatusUpdate(record._id, value, status)}
            options={[
              { label: 'Hoạt động', value: 'active' },
              { label: 'Bị khóa', value: 'blocked' },
            ]}
          />
        );
      },
    },
    {
      title: 'Xác thực',
      dataIndex: 'isVerified',
      key: 'isVerified',
      width: 130,
      render: (isVerified) => (
        <Tag 
          icon={<SafetyOutlined />} 
          color={isVerified ? 'success' : 'warning'}
        >
          {isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3} style={{ margin: 0 }}>
              Quản lý tài khoản
            </Title>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={handleOpenCreateModal}
            >
              Tạo tài khoản Staff/Admin
            </Button>
          </div>

          <Space size="middle" style={{ width: '100%', flexWrap: 'wrap' }}>
            <Input
              placeholder="Tìm kiếm theo tên, email..."
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

      {/* Create Staff Account Modal */}
      <Modal
        title={
          <Space>
            <UserAddOutlined />
            <span>Tạo tài khoản Staff/Admin</span>
          </Space>
        }
        open={createModalVisible}
        onCancel={handleCloseCreateModal}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateStaffAccount}
        >
          <Form.Item
            label="Họ và tên"
            name="full_name"
            rules={[
              { required: true, message: 'Vui lòng nhập họ tên' },
              { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Nhập họ và tên"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Nhập email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[
              { pattern: /^(0[3|5|7|8|9])+([0-9]{8})$/, message: 'Số điện thoại không hợp lệ' }
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="Nhập số điện thoại (không bắt buộc)"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Vai trò"
            name="role"
            rules={[
              { required: true, message: 'Vui lòng chọn vai trò' }
            ]}
          >
            <Select
              placeholder="Chọn vai trò"
              size="large"
              options={[
                { label: '👑 Admin', value: 'admin' },
                { label: '🛒 Nhân viên bán hàng', value: 'seller_staff' },
                { label: '📦 Nhân viên kho', value: 'repository_staff' },
              ]}
            />
          </Form.Item>

          <div style={{ 
            background: '#e6f7ff', 
            border: '1px solid #91d5ff', 
            padding: '12px', 
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            <Text type="secondary">
              <strong>📧 Lưu ý:</strong> Email xác thực sẽ được gửi đến địa chỉ email trên. 
              Người dùng cần xác thực email và đặt mật khẩu để kích hoạt tài khoản.
            </Text>
          </div>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleCloseCreateModal}>
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<PlusOutlined />}
                loading={createLoading}
              >
                Tạo tài khoản
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View User Detail Drawer */}
      <Drawer
        title="Thông tin chi tiết tài khoản"
        open={detailDrawerVisible}
        onClose={handleCloseDetailDrawer}
        width={720}
      >
        {viewingUser && (
          <Form layout="vertical" size="small">
            {/* Avatar */}
            <Form.Item label="Ảnh đại diện" style={{ marginBottom: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <Avatar
                  size={80}
                  src={viewingUser.avatar_url}
                  icon={!viewingUser.avatar_url && <UserOutlined />}
                />
              </div>
            </Form.Item>

            {/* Full Name */}
            <Form.Item label="Họ và tên" style={{ marginBottom: 12 }}>
              <Input
                prefix={<UserOutlined />}
                value={viewingUser.full_name || 'N/A'}
                readOnly
                size="small"
              />
            </Form.Item>

            {/* Email */}
            <Form.Item label="Email" style={{ marginBottom: 12 }}>
              <Input
                prefix={<MailOutlined />}
                value={viewingUser.email || 'N/A'}
                readOnly
                size="small"
              />
            </Form.Item>

            {/* Phone */}
            <Form.Item label="Số điện thoại" style={{ marginBottom: 12 }}>
              <Input
                prefix={<PhoneOutlined />}
                value={viewingUser.phone || 'N/A'}
                readOnly
                size="small"
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                {/* Role */}
                <Form.Item label="Vai trò" style={{ marginBottom: 12 }}>
                  <Input
                    value={getRoleDisplay(viewingUser.role).text}
                    readOnly
                    size="small"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                {/* Status */}
                <Form.Item label="Trạng thái" style={{ marginBottom: 12 }}>
                  <Input
                    value={viewingUser.status === 'active' ? 'Hoạt động' : 'Bị khóa'}
                    readOnly
                    size="small"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Verification Status */}
            <Form.Item label="Trạng thái xác thực" style={{ marginBottom: 12 }}>
              <div>
                <Tag 
                  icon={<SafetyOutlined />} 
                  color={viewingUser.isVerified ? 'success' : 'warning'}
                  style={{ fontSize: '14px', padding: '4px 12px' }}
                >
                  {viewingUser.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                </Tag>
              </div>
            </Form.Item>

            {/* Loyalty Points - Only for customers */}
            {viewingUser.role === 'customer' && (
              <Form.Item label="Điểm tích lũy" style={{ marginBottom: 12 }}>
                <Input
                  prefix={<CheckCircleOutlined />}
                  value={`${viewingUser.loyalty_points || 0} điểm`}
                  readOnly
                  size="small"
                />
              </Form.Item>
            )}

            {/* Created At */}
            <Form.Item label="Ngày tạo tài khoản" style={{ marginBottom: 12 }}>
              <Input
                value={viewingUser.created_at ? new Date(viewingUser.created_at).toLocaleString('vi-VN') : (viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleString('vi-VN') : 'N/A')}
                readOnly
                size="small"
              />
            </Form.Item>
          </Form>
        )}
      </Drawer>
    </div>
  );
}

export default Accounts;
