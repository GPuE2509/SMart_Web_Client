import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  message,
  Tag,
  Typography,
  Table,
  DatePicker,
  Alert,
  Statistic,
  Row,
  Col,
  Spin,
} from 'antd';
import {
  ClockCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import attendanceService from '../services/attendanceService';
import FaceCapture from '../components/FaceCapture';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

function StaffAttendance({ userId, userName }) {
  const [loading, setLoading] = useState(false);
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [checkOutModalVisible, setCheckOutModalVisible] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [userFaceDescriptor, setUserFaceDescriptor] = useState(null);

  useEffect(() => {
    fetchUserFaceData();
    fetchTodayAttendance();
    fetchAttendanceHistory();
  }, [userId]);

  // Fetch user's registered face data
  const fetchUserFaceData = async () => {
    try {
      const response = await attendanceService.getStaffFaceData(userId);
      setUserFaceDescriptor(response.faceDescriptor);
    } catch (error) {
      console.error('Error fetching face data:', error);
    }
  };

  // Fetch today's attendance
  const fetchTodayAttendance = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const response = await attendanceService.getAttendanceHistory(userId, today, today);
      
      if (response.attendance && response.attendance.length > 0) {
        setTodayAttendance(response.attendance[0]);
      } else {
        setTodayAttendance(null);
      }
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  };

  // Fetch attendance history
  const fetchAttendanceHistory = async () => {
    setLoading(true);
    try {
      const response = await attendanceService.getAttendanceHistory(
        userId,
        dateRange[0].format('YYYY-MM-DD'),
        dateRange[1].format('YYYY-MM-DD')
      );
      setAttendanceHistory(response.attendance || []);
    } catch (error) {
      message.error('Không thể tải lịch sử chấm công');
    } finally {
      setLoading(false);
    }
  };

  // Calculate match confidence
  const calculateMatchConfidence = (descriptor1, descriptor2) => {
    if (!descriptor1 || !descriptor2) return 0;
    
    const distance = Math.sqrt(
      descriptor1.reduce((sum, val, i) => sum + Math.pow(val - descriptor2[i], 2), 0)
    );
    
    // Convert distance to confidence (lower distance = higher confidence)
    return Math.max(0, 1 - distance);
  };

  // Handle check-in
  const handleCheckIn = async (faceData) => {
    if (!userFaceDescriptor) {
      message.error('Bạn chưa đăng ký khuôn mặt. Vui lòng liên hệ quản trị viên!');
      return;
    }

    // Calculate match confidence
    const matchConfidence = calculateMatchConfidence(userFaceDescriptor, faceData.descriptor);
    
    if (matchConfidence < 0.6) {
      message.error(`Khuôn mặt không khớp (độ chính xác: ${(matchConfidence * 100).toFixed(1)}%). Vui lòng thử lại!`);
      return;
    }

    try {
      await attendanceService.checkIn(userId, faceData.descriptor, matchConfidence);
      message.success('Check-in thành công!');
      setCheckInModalVisible(false);
      fetchTodayAttendance();
      fetchAttendanceHistory();
    } catch (error) {
      message.error(error.message || 'Không thể check-in');
    }
  };

  // Handle check-out
  const handleCheckOut = async (faceData) => {
    if (!userFaceDescriptor) {
      message.error('Bạn chưa đăng ký khuôn mặt. Vui lòng liên hệ quản trị viên!');
      return;
    }

    // Calculate match confidence
    const matchConfidence = calculateMatchConfidence(userFaceDescriptor, faceData.descriptor);
    
    if (matchConfidence < 0.6) {
      message.error(`Khuôn mặt không khớp (độ chính xác: ${(matchConfidence * 100).toFixed(1)}%). Vui lòng thử lại!`);
      return;
    }

    try {
      await attendanceService.checkOut(userId, faceData.descriptor, matchConfidence);
      message.success('Check-out thành công!');
      setCheckOutModalVisible(false);
      fetchTodayAttendance();
      fetchAttendanceHistory();
    } catch (error) {
      message.error(error.message || 'Không thể check-out');
    }
  };

  // Columns for attendance history table
  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'check_in_time',
      key: 'date',
      render: (time) => dayjs(time).format('DD/MM/YYYY'),
    },
    {
      title: 'Giờ vào',
      dataIndex: 'check_in_time',
      key: 'check_in',
      render: (time) => time ? dayjs(time).format('HH:mm:ss') : '-',
    },
    {
      title: 'Giờ ra',
      dataIndex: 'check_out_time',
      key: 'check_out',
      render: (time) => time ? dayjs(time).format('HH:mm:ss') : '-',
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

  const canCheckIn = !todayAttendance || todayAttendance.status === 'checked_out';
  const canCheckOut = todayAttendance && todayAttendance.status === 'checked_in';

  if (!userFaceDescriptor) {
    return (
      <div className="p-6">
        <Alert
          message="Chưa đăng ký khuôn mặt"
          description="Bạn chưa đăng ký khuôn mặt để chấm công. Vui lòng liên hệ quản trị viên để đăng ký."
          type="warning"
          showIcon
          icon={<WarningOutlined />}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Title level={2}>
        <ClockCircleOutlined className="mr-2" />
        Chấm công - {userName}
      </Title>

      {/* Today's Status */}
      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card>
            <Statistic
              title="Trạng thái hôm nay"
              value={todayAttendance ? (
                todayAttendance.status === 'checked_in' ? 'Đang làm việc' : 'Đã ra về'
              ) : 'Chưa check-in'}
              valueStyle={{ 
                color: todayAttendance?.status === 'checked_in' ? '#3f8600' : '#666' 
              }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Giờ vào"
              value={todayAttendance?.check_in_time ? dayjs(todayAttendance.check_in_time).format('HH:mm:ss') : '--:--:--'}
              prefix={<LoginOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Giờ ra"
              value={todayAttendance?.check_out_time ? dayjs(todayAttendance.check_out_time).format('HH:mm:ss') : '--:--:--'}
              prefix={<LogoutOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Check-in/Check-out Buttons */}
      <Card className="mb-6">
        <div className="text-center">
          <Space size="large">
            <Button
              type="primary"
              size="large"
              icon={<LoginOutlined />}
              onClick={() => setCheckInModalVisible(true)}
              disabled={!canCheckIn}
              className="h-16 px-8 text-lg"
            >
              Check-in
            </Button>
            <Button
              danger
              size="large"
              icon={<LogoutOutlined />}
              onClick={() => setCheckOutModalVisible(true)}
              disabled={!canCheckOut}
              className="h-16 px-8 text-lg"
            >
              Check-out
            </Button>
          </Space>
        </div>

        {todayAttendance && todayAttendance.status === 'checked_in' && (
          <Alert
            className="mt-4"
            message="Đang trong ca làm việc"
            description={`Bạn đã check-in lúc ${dayjs(todayAttendance.check_in_time).format('HH:mm:ss')}. Nhớ check-out khi kết thúc ca!`}
            type="info"
            showIcon
          />
        )}
      </Card>

      {/* Attendance History */}
      <Card
        title="Lịch sử chấm công"
        extra={
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates);
                if (dates) {
                  fetchAttendanceHistory();
                }
              }}
              format="DD/MM/YYYY"
            />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={attendanceHistory}
          loading={loading}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} bản ghi`,
          }}
        />
      </Card>

      {/* Check-in Modal */}
      {checkInModalVisible && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <Card style={{ width: 'auto', maxWidth: '1024px', maxHeight: '90vh', overflow: 'auto' }}>
            <Title level={3} style={{ textAlign: 'center', marginBottom: '16px' }}>
              <LoginOutlined style={{ marginRight: '8px' }} />
              Check-in
            </Title>
            
            <Alert
              style={{ marginBottom: '16px' }}
              message="Hướng dẫn"
              description="Nhìn vào camera và giữ khuôn mặt trong khung hình. Hệ thống sẽ tự động nhận diện khuôn mặt của bạn."
              type="info"
              showIcon
            />

            <div style={{ textAlign: 'center' }}>
              <FaceCapture
                onCapture={handleCheckIn}
                captureButtonText="Xác nhận Check-in"
                showLandmarks={true}
                referenceDescriptor={userFaceDescriptor}
              />
            </div>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Button onClick={() => setCheckInModalVisible(false)}>
                Hủy
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Check-out Modal */}
      {checkOutModalVisible && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <Card style={{ width: 'auto', maxWidth: '1024px', maxHeight: '90vh', overflow: 'auto' }}>
            <Title level={3} style={{ textAlign: 'center', marginBottom: '16px' }}>
              <LogoutOutlined style={{ marginRight: '8px' }} />
              Check-out
            </Title>
            
            <Alert
              style={{ marginBottom: '16px' }}
              message="Hướng dẫn"
              description="Nhìn vào camera và giữ khuôn mặt trong khung hình. Hệ thống sẽ tự động nhận diện khuôn mặt của bạn."
              type="info"
              showIcon
            />

            <div style={{ textAlign: 'center' }}>
              <FaceCapture
                onCapture={handleCheckOut}
                captureButtonText="Xác nhận Check-out"
                showLandmarks={true}
                referenceDescriptor={userFaceDescriptor}
              />
            </div>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Button onClick={() => setCheckOutModalVisible(false)}>
                Hủy
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default StaffAttendance;
