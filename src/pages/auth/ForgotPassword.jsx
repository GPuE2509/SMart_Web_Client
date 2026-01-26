import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, message, Typography, Space } from 'antd';
import { MailOutlined, ArrowLeftOutlined, LockOutlined } from '@ant-design/icons';
import axios from '../../services/axios';
import logo from '../../assets/logo.png';
import backgroundImg from '../../assets/background.jpg';
import './Login.css';

const { Title, Text } = Typography;

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [emailForm] = Form.useForm();
  const [otpForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const navigate = useNavigate();

  const handleSendOTP = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('/auth/forgot-password', {
        email: values.email
      });
      
      message.success(response.data.message || 'Mã OTP đã được gửi đến email của bạn!');
      setEmail(values.email);
      setStep(2);
    } catch (error) {
      console.error('Forgot password error:', error);
      message.error(error.response?.data?.message || error.response?.data?.error || 'Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/auth/forgot-password', {
        email: email
      });
      
      message.success(response.data.message || 'Mã OTP mới đã được gửi đến email của bạn!');
    } catch (error) {
      console.error('Resend OTP error:', error);
      message.error(error.response?.data?.message || error.response?.data?.error || 'Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('/auth/verify-password-reset-otp', {
        email: email,
        otp: values.otp
      });
      
      message.success(response.data.message || 'Xác thực OTP thành công!');
      setOtp(values.otp);
      setStep(3);
    } catch (error) {
      console.error('Verify OTP error:', error);
      message.error(error.response?.data?.message || error.response?.data?.error || 'Mã OTP không đúng!');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('/auth/reset-password', {
        email: email,
        otp: otp,
        newPassword: values.newPassword
      });
      
      message.success(response.data.message || 'Đặt lại mật khẩu thành công!');
      
      setTimeout(() => {
        navigate('/SignIn');
      }, 1500);
    } catch (error) {
      console.error('Reset password error:', error);
      message.error(error.response?.data?.message || error.response?.data?.error || 'Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Enter OTP
  if (step === 2) {
    return (
      <div className="SignIn-container" style={{ backgroundImage: `url(${backgroundImg})` }}>
        <Card className="SignIn-card" bordered={false}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div className="SignIn-header">
              <div className="logo-container">
                <img src={logo} alt="SMart Logo" className="SignIn-logo" />
              </div>
              <Title level={2} style={{ margin: '16px 0 8px 0', color: '#1a2f3a' }}>
                Xác Thực OTP
              </Title>
              <Text style={{ fontSize: '15px', color: '#6c757d' }}>
                Nhập mã OTP đã được gửi đến email <strong>{email}</strong>
              </Text>
            </div>

            <Form
              form={otpForm}
              name="verify-otp"
              onFinish={handleVerifyOTP}
              layout="vertical"
              size="large"
              autoComplete="off"
            >
              <Form.Item
                name="otp"
                rules={[
                  { required: true, message: 'Vui lòng nhập mã OTP!' },
                  { len: 6, message: 'Mã OTP phải có 6 ký tự!' }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Nhập mã OTP (6 ký tự)"
                  maxLength={6}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: '12px' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{
                    height: '48px',
                    fontSize: '16px',
                    fontWeight: '500',
                  }}
                >
                  Tiếp Tục
                </Button>
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="link"
                  onClick={handleResendOTP}
                  loading={loading}
                  block
                >
                  Gửi lại mã OTP
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center' }}>
              <Link to="/SignIn" style={{ color: '#1890ff' }}>
                <ArrowLeftOutlined /> Quay lại đăng nhập
              </Link>
            </div>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div className="SignIn-container" style={{ backgroundImage: `url(${backgroundImg})` }}>
      <Card className="SignIn-card" bordered={false}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div className="SignIn-header">
            <div className="logo-container">
              <img src={logo} alt="SMart Logo" className="SignIn-logo" />
            </div>
            <Title level={2} style={{ margin: '16px 0 8px 0', color: '#1a2f3a' }}>
              Quên Mật Khẩu?
            </Title>
            <Text style={{ fontSize: '15px', color: '#6c757d' }}>
              Nhập email của bạn để nhận mã OTP
            </Text>
          </div>

          <Form
            form={emailForm}
            name="forgot-password"
            onFinish={handleSendOTP}
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

            <Form.Item style={{ marginBottom: '12px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: '500',
                }}
              >
                Gửi Mã OTP
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center' }}>
            <Link to="/SignIn" style={{ color: '#1890ff' }}>
              <ArrowLeftOutlined /> Quay lại đăng nhập
            </Link>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default ForgotPassword;
