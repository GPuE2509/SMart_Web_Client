import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Form, Input, Button, message, Typography, Space, Spin, Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, ClockCircleOutlined } from '@ant-design/icons';
import authService from '../../services/authService';
import socketService from '../../services/socketService';
import { getHomeRoute, canAccessSystem } from '../../utils/roleUtils';
import { v4 as uuidv4 } from 'uuid';
import logo from '../../assets/logo.png';
import backgroundImg from '../../assets/background3.jpg';
import './SignIn.css';

const { Title, Text } = Typography;

const SignIn = () => {
  const [loading, setLoading] = useState(false);
  const [waitingForEmail, setWaitingForEmail] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();
  const [form] = Form.useForm();

  useEffect(() => {
    // Cleanup socket when component unmounts
    return () => {
      if (waitingForEmail) {
        socketService.removeAllListeners();
        socketService.disconnect();
      }
    };
  }, [waitingForEmail]);

  const handleSubmit = async (values) => {
    setLoading(true);
    setUserEmail(values.email);

    try {
      // Generate unique session ID
      const sessionId = uuidv4();

      // Connect to socket FIRST and wait for connection
      console.log('🔌 Connecting socket with sessionId:', sessionId);
      const socket = socketService.connect(sessionId);

      // Wait for socket to connect
      await new Promise((resolve) => {
        if (socket.connected) {
          console.log('✅ Socket already connected');
          resolve();
        } else {
          socket.once('connect', () => {
            console.log('✅ Socket connected successfully');
            resolve();
          });
        }
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (!socket.connected) {
            console.warn('⚠️ Socket connection timeout');
          }
          resolve();
        }, 5000);
      });

      // Setup socket listeners BEFORE making API request
      socketService.onLoginVerification((data) => {
        console.log('📧 Login verification sent:', data);
        message.info(data.message);
        setWaitingForEmail(true);
        setLoading(false);
      });

      socketService.onLoginApproved((data) => {
        console.log('✅ Login approved:', data);
        message.success(data.message || 'Đăng nhập thành công!');
        
        // Token is now in HTTP-only cookie, no need to save manually
        // Just check if user has access permission
        if (data.user && !canAccessSystem(data.user)) {
          message.error('Tài khoản không có quyền truy cập hệ thống');
          authService.logout();
          setWaitingForEmail(false);
          socketService.disconnect();
          return;
        }

        // Navigate to home
        const homeRoute = getHomeRoute(data.user);
        setWaitingForEmail(false);
        socketService.disconnect();
        navigate(homeRoute);
      });

      socketService.onLoginDenied((data) => {
        console.log('❌ Login denied:', data);
        message.error(data.message || 'Đăng nhập bị từ chối');
        setWaitingForEmail(false);
        setLoading(false);
        socketService.disconnect();
      });

      // NOW make the API request after socket is ready
      console.log('📡 Sending login request...');
      const result = await authService.staffAdminLogin(
        values.email,
        values.password,
        sessionId
      );

      console.log('✅ Login request result:', result);

      // If not requires email verification (shouldn't happen for staff/admin)
      if (!result.requiresEmailVerification) {
        message.success(result.message || 'Đăng nhập thành công!');
        setLoading(false);
        
        if (!canAccessSystem()) {
          message.error('Tài khoản không có quyền truy cập hệ thống');
          authService.logout();
          return;
        }

        const homeRoute = getHomeRoute();
        navigate(homeRoute);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      message.error(error.message || 'Đã xảy ra lỗi');
      setLoading(false);
      setWaitingForEmail(false);
      socketService.disconnect();
    }
  };

  const handleCancelWaiting = () => {
    setWaitingForEmail(false);
    setLoading(false);
    socketService.removeAllListeners();
    socketService.disconnect();
    message.info('Đã hủy chờ xác thực');
  };

  return (
    <div className="SignIn-container" style={{ backgroundImage: `url(${backgroundImg})` }}>
      <Card className="SignIn-card" bordered={false}>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <div className="SignIn-header" style={{ textAlign: 'center' }}>
            <div className="logo-container" style={{ marginBottom: '20px' }}>
              <img src={logo} alt="SMart Logo" style={{ height: '80px' }} />
            </div>
            <Title level={1} style={{ margin: '20px 0 12px 0', color: '#1a2f3a', fontSize: '36px' }}>
              Quản Trị Siêu Thị
            </Title>
            <Text style={{ fontSize: '18px', color: '#6c757d' }}>Đăng nhập để quản lý hệ thống</Text>
          </div>

          {waitingForEmail && (
            <Alert
              message={
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space>
                    <MailOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                    <Text strong style={{ fontSize: '16px' }}>Đang chờ xác thực email</Text>
                  </Space>
                  <Text style={{ fontSize: '14px' }}>
                    Email xác thực đã được gửi đến <strong>{userEmail}</strong>
                  </Text>
                  <Text type="secondary" style={{ fontSize: '13px' }}>
                    Vui lòng kiểm tra hộp thư và nhấn vào nút "Đúng là tôi" để hoàn tất đăng nhập
                  </Text>
                  <div style={{ marginTop: '10px' }}>
                    <Spin size="small" style={{ marginRight: '8px' }} />
                    <Text type="secondary">Đang chờ xác nhận...</Text>
                  </div>
                </Space>
              }
              type="info"
              showIcon={false}
              icon={<ClockCircleOutlined />}
              style={{ marginBottom: '16px' }}
              action={
                <Button size="small" type="link" onClick={handleCancelWaiting}>
                  Hủy
                </Button>
              }
            />
          )}

          <Form
            form={form}
            name="SignIn"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
            autoComplete="off"
            disabled={waitingForEmail}
          >
            <Form.Item
              name="email"
              rules={[
                {
                  required: true,
                  message: 'Vui lòng nhập email',
                },
                {
                  type: 'email',
                  message: 'Email không hợp lệ',
                },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ fontSize: '18px' }} />}
                placeholder="Email"
                style={{ fontSize: '16px', height: '50px' }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                {
                  required: true,
                  message: 'Vui lòng nhập mật khẩu',
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ fontSize: '18px' }} />}
                placeholder="Mật khẩu"
                style={{ fontSize: '16px', height: '50px' }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Link to="/forgot-password" style={{ fontSize: '16px', color: '#1a2f3a' }}>
                Quên mật khẩu?
              </Link>
            </Form.Item>

            <Form.Item style={{ marginTop: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={waitingForEmail}
                block
                style={{ fontSize: '16px', height: '50px', fontWeight: 'bold' }}
              >
                {loading ? 'Đang xử lý...' : waitingForEmail ? 'Đang chờ xác thực...' : 'Đăng Nhập'}
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default SignIn;
