import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Form, Input, Button, message, Typography, Space, Result } from 'antd';
import { LockOutlined, CheckCircleOutlined, ShoppingOutlined } from '@ant-design/icons';
import logo from '../../assets/logo.png';
import backgroundImg from '../../assets/background.jpg';
import './Login.css';

const { Title, Text } = Typography;

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      message.success('Mật khẩu đã được đặt lại thành công!');
      setResetSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      message.error('Có lỗi xảy ra. Vui lòng thử lại!');
      console.error('Reset password error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-container" style={{ backgroundImage: `url(${backgroundImg})` }}>
        <Card className="login-card" bordered={false}>
          <Result
            status="error"
            title="Liên kết không hợp lệ"
            subTitle="Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."
            extra={[
              <Link to="/forgot-password" key="forgot">
                <Button type="primary" size="large">
                  Gửi lại email khôi phục
                </Button>
              </Link>,
              <Link to="/login" key="login">
                <Button size="large">Quay lại đăng nhập</Button>
              </Link>,
            ]}
          />
        </Card>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="login-container" style={{ backgroundImage: `url(${backgroundImg})` }}>
        <Card className="login-card" bordered={false}>
          <Result
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            status="success"
            title="Đặt lại mật khẩu thành công!"
            subTitle="Bạn sẽ được chuyển đến trang đăng nhập..."
            extra={[
              <Link to="/login" key="login">
                <Button type="primary" size="large">
                  Đăng nhập ngay
                </Button>
              </Link>,
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="login-container" style={{ backgroundImage: `url(${backgroundImg})` }}>
      <Card className="login-card" bordered={false}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div className="login-header">
            <div className="logo-container">
              <img src={logo} alt="SMart Logo" className="login-logo" />
            </div>
            <Title level={2} style={{ margin: '16px 0 8px 0', color: '#1a2f3a' }}>
              Đặt Lại Mật Khẩu
            </Title>
            <Text style={{ fontSize: '15px', color: '#6c757d' }}>
              Nhập mật khẩu mới của bạn
            </Text>
          </div>

          <Form
            form={form}
            name="reset-password"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            <Form.Item
              name="password"
              rules={[
                {
                  required: true,
                  message: 'Vui lòng nhập mật khẩu mới',
                },
                {
                  min: 6,
                  message: 'Mật khẩu phải có ít nhất 6 ký tự',
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Mật khẩu mới"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                {
                  required: true,
                  message: 'Vui lòng xác nhận mật khẩu',
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Xác nhận mật khẩu mới"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
              >
                Đặt Lại Mật Khẩu
              </Button>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
              <Link to="/login">
                <Button type="link" style={{ color: '#1a2f3a' }}>
                  Quay lại đăng nhập
                </Button>
              </Link>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default ResetPassword;
