import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Form, Input, Button, message, Typography, Space, Result } from 'antd';
import { MailOutlined, ArrowLeftOutlined, ShoppingOutlined } from '@ant-design/icons';
import logo from '../../assets/logo.png';
import backgroundImg from '../../assets/background.jpg';
import './Login.css';

const { Title, Text } = Typography;

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      message.success('Email khôi phục mật khẩu đã được gửi!');
      setEmailSent(true);
    } catch (error) {
      message.error('Có lỗi xảy ra. Vui lòng thử lại!');
      console.error('Forgot password error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="login-container" style={{ backgroundImage: `url(${backgroundImg})` }}>
        <Card className="login-card" bordered={false}>
          <Result
            status="success"
            title="Email đã được gửi!"
            subTitle={`Chúng tôi đã gửi hướng dẫn khôi phục mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư.`}
            extra={[
              <Link to="/login" key="back">
                <Button type="primary" size="large">
                  <ArrowLeftOutlined /> Quay lại đăng nhập
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
              Quên Mật Khẩu?
            </Title>
            <Text style={{ fontSize: '15px', color: '#6c757d' }}>
              Nhập email của bạn để nhận hướng dẫn khôi phục
            </Text>
          </div>

          <Form
            form={form}
            name="forgot-password"
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
                prefix={<MailOutlined />}
                placeholder="Nhập email của bạn"
                type="email"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
              >
                Gửi Email Khôi Phục
              </Button>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
              <Link to="/login">
                <Button type="link" icon={<ArrowLeftOutlined />} style={{ color: '#1a2f3a' }}>
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

export default ForgotPassword;
