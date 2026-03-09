import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message, Space, Result } from 'antd';
import { LockOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../../services/authService';
import './SignIn.css';

const { Title, Text } = Typography;

function SetPassword() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [tokenValid, setTokenValid] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    // Logout current session first to avoid conflicts
    const logoutAndVerify = async () => {
      try {
        await authService.logout();
      } catch (error) {
        // Ignore logout errors
        console.log('Logout before set password:', error);
      }
      
      // Then verify the invitation token
      verifyToken();
    };

    logoutAndVerify();
  }, [token]);

  // Verify token when page loads
  const verifyToken = async () => {
    if (!token) {
      message.error('Thiếu token xác thực');
      setVerifying(false);
      return;
    }

    try {
      const response = await authService.verifyInvitation(token);
      setUserInfo(response.data);
      setTokenValid(true);
    } catch (error) {
      message.error(error.message || 'Token không hợp lệ hoặc đã hết hạn');
      setTokenValid(false);
    } finally {
      setVerifying(false);
    }
  };

  // Handle form submit
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      console.log('Submitting password with token:', token);
      const response = await authService.setPasswordForNewAccount(
        token,
        values.password,
        values.confirmPassword
      );

      console.log('Set password response:', response);
      message.success(response.message || 'Kích hoạt tài khoản thành công!');
      
      // Wait a bit before redirecting
      setTimeout(() => {
        // Navigate based on role
        const role = response.data?.role || response.user?.role;
        console.log('Redirecting for role:', role);
        
        if (role === 'admin') {
          navigate('/admin/dashboard');
        } else if (role === 'seller_staff') {
          navigate('/seller/dashboard');
        } else if (role === 'repository_staff') {
          navigate('/repository/dashboard');
        } else {
          navigate('/SignIn');
        }
      }, 1500);
    } catch (error) {
      console.error('Set password error:', error);
      message.error(error.message || 'Không thể đặt mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while verifying token
  if (verifying) {
    return (
      <div className="signin-container">
        <Card className="signin-card" style={{ textAlign: 'center' }}>
          <Space orientation="vertical" size="large">
            <LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <Title level={4}>Đang xác thực...</Title>
            <Text type="secondary">Vui lòng đợi trong giây lát</Text>
          </Space>
        </Card>
      </div>
    );
  }

  // Show error if token is invalid
  if (!tokenValid) {
    return (
      <div className="signin-container">
        <Card className="signin-card">
          <Result
            status="error"
            title="Token không hợp lệ"
            subTitle="Link xác thực đã hết hạn hoặc không hợp lệ. Vui lòng liên hệ quản trị viên để được hỗ trợ."
            extra={[
              <Button type="primary" key="signin" onClick={() => navigate('/signIn')}>
                Về trang đăng nhập
              </Button>
            ]}
          />
        </Card>
      </div>
    );
  }

  // Show password form if token is valid
  return (
    <div className="signin-container">
      <Card className="signin-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
          <Title level={2} style={{ marginBottom: 8 }}>
            Chào mừng đến với SMart!
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Xin chào <strong>{userInfo?.full_name}</strong>
          </Text>
          <br />
          <Text type="secondary">
            Vai trò: <strong>{getRoleText(userInfo?.role)}</strong>
          </Text>
        </div>

        <div style={{
          background: '#e6f7ff',
          border: '1px solid #91d5ff',
          padding: '12px 16px',
          borderRadius: '4px',
          marginBottom: 24
        }}>
          <Text>
            📧 Email: <strong>{userInfo?.email}</strong>
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
        >
          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
            />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập lại mật khẩu"
            />
          </Form.Item>

          <div style={{
            background: '#fffbe6',
            border: '1px solid #ffe58f',
            padding: '12px 16px',
            borderRadius: '4px',
            marginBottom: 24
          }}>
            <Text type="warning">
              <strong>🔒 Lưu ý bảo mật:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                <li>Sử dụng mật khẩu mạnh (kết hợp chữ, số và ký tự đặc biệt)</li>
                <li>Không chia sẻ mật khẩu với người khác</li>
                <li>Thay đổi mật khẩu định kỳ để bảo mật tài khoản</li>
              </ul>
            </Text>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              size="large"
            >
              Kích hoạt tài khoản
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">
            Đã có tài khoản?{' '}
            <a onClick={() => navigate('/signIn')}>Đăng nhập ngay</a>
          </Text>
        </div>
      </Card>
    </div>
  );
}

// Helper function to get role text
function getRoleText(role) {
  const roleMap = {
    'admin': '👑 Quản trị viên',
    'seller_staff': '🛒 Nhân viên bán hàng',
    'repository_staff': '📦 Nhân viên kho',
  };
  return roleMap[role] || role;
}

export default SetPassword;
