import { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Select,
  message,
  Tag,
  Typography,
  Row,
  Col,
  DatePicker,
  Tooltip,
  Tabs,
  Avatar,
} from 'antd';
import {
  UserOutlined,
  CameraOutlined,
  SearchOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import profileService from '../../services/profileService';
import attendanceService from '../../services/attendanceService';
import FaceCapture from '../../components/FaceCapture';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

function Attendance() {
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [faceRegisterModalVisible, setFaceRegisterModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [capturedFaceData, setCapturedFaceData] = useState(null);
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [roleFilter, setRoleFilter] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [attendanceSearchText, setAttendanceSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isInitialMount, setIsInitialMount] = useState(true);

  useEffect(() => {
    fetchStaffUsers();
    fetchAttendance();
    setIsInitialMount(false);
  }, []);

  // Debounce search - fetch attendance when search text changes
  useEffect(() => {
    if (isInitialMount) return;
    
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to page 1 when search changes
      fetchAttendance();
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [attendanceSearchText]);

  // Fetch when pagination changes
  useEffect(() => {
    if (isInitialMount) return; // Skip on initial mount
    fetchAttendance();
  }, [currentPage, pageSize]);

  // Fetch all staff users
  const fetchStaffUsers = async () => {
    try {
      const response = await profileService.getAllUsers();
      // Filter to get only staff members (seller_staff and repository_staff)
      const staffUsers = (response.data || []).filter(user => 
        ['seller_staff', 'repository_staff'].includes(user.role)
      );
      setUsers(staffUsers);
    } catch (error) {
      message.error('Không thể tải danh sách nhân viên');
    }
  };

  // Fetch attendance records
  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      if (roleFilter) {
        params.role = roleFilter;
      }
      if (attendanceSearchText && attendanceSearchText.trim()) {
        params.search = attendanceSearchText.trim();
      }

      const response = await attendanceService.getAllStaffAttendance(
        params.startDate,
        params.endDate,
        params.role,
        params.search,
        currentPage,
        pageSize
      );
      setAttendance(response.attendance || []);
      setTotalRecords(response.pagination?.total || 0);
    } catch (error) {
      message.error('Không thể tải dữ liệu chấm công');
    } finally {
      setLoading(false);
    }
  };

  // Open face registration modal
  const handleOpenFaceRegister = (user) => {
    setSelectedUser(user);
    setCapturedFaceData(null);
    setFaceRegisterModalVisible(true);
  };

  // Handle face capture
  const handleFaceCapture = (faceData) => {
    setCapturedFaceData(faceData);
    message.success('Đã chụp khuôn mặt thành công!');
  };

  // Save face registration
  const handleSaveFaceRegistration = async () => {
    if (!capturedFaceData) {
      message.warning('Vui lòng chụp khuôn mặt trước!');
      return;
    }

    setIsSaving(true);
    try {
      await attendanceService.registerStaffFace(
        selectedUser._id,
        capturedFaceData.descriptor,
        capturedFaceData.image
      );
      message.success('Đăng ký khuôn mặt thành công!');
      setFaceRegisterModalVisible(false);
      setCapturedFaceData(null);
      setSelectedUser(null);
      fetchStaffUsers();
    } catch (error) {
      message.error(error.message || 'Không thể đăng ký khuôn mặt');
    } finally {
      setIsSaving(false);
    }
  };

  // Close face registration modal
  const handleCloseFaceRegister = () => {
    setFaceRegisterModalVisible(false);
    setCapturedFaceData(null);
    setSelectedUser(null);
  };

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  // Apply filters
  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to page 1 when filters change
    fetchAttendance();
  };

  // Handle pagination change
  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  // Columns for staff table
  const staffColumns = [
    {
      title: 'Nhân viên',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar 
            src={record.avatar_url} 
            icon={<UserOutlined />}
            size={40}
          />
          <div>
            <div style={{ fontWeight: '600' }}>{record.full_name}</div>
            <div style={{ color: '#6b7280', fontSize: '12px' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const roleLabels = {
          seller_staff: 'Nhân viên bán hàng',
          repository_staff: 'Nhân viên kho',
        };
        const colors = {
          seller_staff: 'blue',
          repository_staff: 'green',
        };
        return <Tag color={colors[role]}>{roleLabels[role]}</Tag>;
      },
    },
    {
      title: 'Trạng thái khuôn mặt',
      key: 'face_status',
      render: (_, record) => (
        record.face_descriptor && record.face_descriptor.length > 0 ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>Đã đăng ký</Tag>
        ) : (
          <Tag color="warning">Chưa đăng ký</Tag>
        )
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<CameraOutlined />}
          onClick={() => handleOpenFaceRegister(record)}
        >
          {record.face_descriptor && record.face_descriptor.length > 0 
            ? 'Cập nhật khuôn mặt' 
            : 'Đăng ký khuôn mặt'}
        </Button>
      ),
    },
  ];

  // Columns for attendance table
  const attendanceColumns = [
    {
      title: 'Nhân viên',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar 
            src={record.user_id?.avatar_url} 
            icon={<UserOutlined />}
            size={40}
          />
          <div>
            <div style={{ fontWeight: '600' }}>{record.user_id?.full_name}</div>
            <div style={{ color: '#6b7280', fontSize: '12px' }}>{record.user_id?.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Vai trò',
      key: 'role',
      render: (_, record) => {
        const role = record.user_id?.role;
        const roleLabels = {
          seller_staff: 'Nhân viên bán hàng',
          repository_staff: 'Nhân viên kho',
        };
        const colors = {
          seller_staff: 'blue',
          repository_staff: 'green',
        };
        return <Tag color={colors[role]}>{roleLabels[role]}</Tag>;
      },
    },
    {
      title: 'Giờ vào',
      dataIndex: 'check_in_time',
      key: 'check_in_time',
      render: (time) => time ? dayjs(time).format('DD/MM/YYYY HH:mm:ss') : '-',
    },
    {
      title: 'Giờ ra',
      dataIndex: 'check_out_time',
      key: 'check_out_time',
      render: (time) => time ? dayjs(time).format('DD/MM/YYYY HH:mm:ss') : '-',
    },
    {
      title: 'Số giờ làm',
      key: 'work_hours',
      render: (_, record) => {
        if (record.check_in_time && record.check_out_time) {
          const hours = dayjs(record.check_out_time).diff(dayjs(record.check_in_time), 'hour', true);
          return `${hours.toFixed(1)} giờ`;
        }
        return '-';
      },
    },
    {
      title: 'Độ khớp vào',
      dataIndex: 'check_in_face_match',
      key: 'check_in_face_match',
      render: (match) => match ? `${(match * 100).toFixed(1)}%` : '-',
    },
    {
      title: 'Độ khớp ra',
      dataIndex: 'check_out_face_match',
      key: 'check_out_face_match',
      render: (match) => match ? `${(match * 100).toFixed(1)}%` : '-',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          checked_in: { color: 'processing', text: 'Đang làm việc' },
          checked_out: { color: 'success', text: 'Đã ra về' },
          absent: { color: 'default', text: 'Vắng mặt' },
        };
        const config = statusConfig[status] || statusConfig.absent;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
  ];

  // Filter staff by search text
  const filteredUsers = users.filter(user => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.phone?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-6">
      <Title level={2}>
        <ClockCircleOutlined className="mr-2" />
        Quản lý chấm công
      </Title>

      <Tabs defaultActiveKey="1">
        <TabPane tab="Lịch sử chấm công" key="1">
          <Card>
            <Space className="mb-4" style={{ marginBottom: '16px' }}>
              <Input
                placeholder="Tìm theo tên hoặc email..."
                prefix={<SearchOutlined />}
                value={attendanceSearchText}
                onChange={(e) => setAttendanceSearchText(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />
            </Space>
            <Space className="mb-4" size="middle" wrap>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                format="DD/MM/YYYY"
              />
              <Select
                placeholder="Lọc theo vai trò"
                style={{ width: 200 }}
                allowClear
                value={roleFilter}
                onChange={setRoleFilter}
              >
                <Select.Option value="seller_staff">Nhân viên bán hàng</Select.Option>
                <Select.Option value="repository_staff">Nhân viên kho</Select.Option>
              </Select>
              <Button
                type="primary"
                icon={<FilterOutlined />}
                onClick={handleApplyFilters}
              >
                Áp dụng
              </Button>
            </Space>

            <Table
              columns={attendanceColumns}
              dataSource={attendance}
              loading={loading}
              rowKey="_id"
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalRecords,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} bản ghi`,
                pageSizeOptions: ['10', '20', '50', '100'],
              }}
              onChange={handleTableChange}
            />
          </Card>
        </TabPane>

        <TabPane tab="Quản lý khuôn mặt" key="2">
          <Card>
            <Space className="mb-4">
              <Input
                placeholder="Tìm kiếm nhân viên..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
                allowClear
              />
            </Space>

            <Table
              columns={staffColumns}
              dataSource={filteredUsers}
              loading={loading}
              rowKey="_id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} nhân viên`,
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Face Registration Modal */}
      <Modal
        title={`Đăng ký khuôn mặt - ${selectedUser?.full_name}`}
        open={faceRegisterModalVisible}
        onCancel={handleCloseFaceRegister}
        width={800}
        footer={[
          <Button key="cancel" onClick={handleCloseFaceRegister} disabled={isSaving}>
            Hủy
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={handleSaveFaceRegistration}
            disabled={!capturedFaceData || isSaving}
            loading={isSaving}
          >
            {isSaving ? 'Đang lưu...' : 'Lưu'}
          </Button>,
        ]}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '16px', color: '#6b7280' }}>
            Vui lòng chụp khuôn mặt rõ ràng của nhân viên. Khuôn mặt này sẽ được sử dụng để nhận diện khi chấm công.
          </p>
          
          <FaceCapture
            onCapture={handleFaceCapture}
            captureButtonText="Chụp khuôn mặt"
            showLandmarks={true}
            showExpressions={false}
          />

          {capturedFaceData && (
            <div className="mt-4">
              <Tag color="success" className="text-lg px-4 py-2">
                <CheckCircleOutlined /> Đã chụp khuôn mặt thành công
              </Tag>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default Attendance;
