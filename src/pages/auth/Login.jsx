import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Form, Input, Button, message, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined, ShoppingOutlined } from '@ant-design/icons';
import { mockLogin, setAuthData } from '../../utils/auth';
import logo from '../../assets/logo.png';
import backgroundImg from '../../assets/background.jpg';
import './Login.css';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const result = await mockLogin(values.username, values.password);

      if (result.success) {
        setAuthData(result.token, result.user);
        message.success(`Welcome back, ${result.user.fullName}!`);
        navigate('/dashboard');
      } else {
        message.error(result.message || 'Login failed');
      }
    } catch (error) {
      message.error('An error occurred during login');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ backgroundImage: `url(${backgroundImg})` }}>
      <Card className="login-card" bordered={false}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div className="login-header">
            <div className="logo-container">
              <img src={logo} alt="SMart Logo" className="login-logo" />
            </div>
            <Title level={1} style={{ margin: '20px 0 12px 0', color: '#1a2f3a', fontSize: '36px' }}>
              Quản Trị Siêu Thị
            </Title>
            <Text style={{ fontSize: '18px', color: '#6c757d' }}>Đăng nhập để quản lý hệ thống</Text>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            <Form.Item
              name="username"
              rules={[
                {
                  required: true,
                  message: 'Please enter your username or email',
                },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ fontSize: '18px' }} />}
                placeholder="Username or Email"
                style={{ fontSize: '16px', height: '50px' }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                {
                  required: true,
                  message: 'Please enter your password',
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ fontSize: '18px' }} />}
                placeholder="Password"
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
                block
              >
                Đăng Nhập
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default Login;
