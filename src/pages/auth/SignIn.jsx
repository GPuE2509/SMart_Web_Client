import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Form, Input, Button, message, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import authService from '../../services/authService';
import { getHomeRoute, canAccessSystem } from '../../utils/roleUtils';
import logo from '../../assets/logo.png';
import backgroundImg from '../../assets/background3.jpg';
import './SignIn.css';

const { Title, Text } = Typography;

const SignIn = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const result = await authService.SignIn(values.email, values.password);

      // Kiểm tra quyền truy cập
      if (!canAccessSystem()) {
        message.error('Tài khoản không có quyền truy cập hệ thống');
        authService.logout();
        setLoading(false);
        return;
      }

      message.success(result.message || 'Đăng nhập thành công!');
      
      // Redirect đến trang phù hợp với role
      const homeRoute = getHomeRoute();
      navigate(homeRoute);
    } catch (error) {
      // Hiển thị message từ API
      message.error(error.error || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
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

          <Form
            form={form}
            name="SignIn"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
            autoComplete="off"
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
                block
                style={{ fontSize: '16px', height: '50px', fontWeight: 'bold' }}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default SignIn;
