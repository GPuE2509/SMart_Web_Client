import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, message, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import axios from '../../services/axios';

const { Title } = Typography;

const ChangePassword = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    setLoading(true);

    try {
      const response = await axios.post('/auth/change-password', {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });

      message.success(response.data.message || 'Đổi mật khẩu thành công!');
      form.resetFields();
      
      // Redirect to previous page or home after 1.5 seconds
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (error) {
      console.error('Change password error:', error);
      message.error(error.response?.data?.message || error.response?.data?.error || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const validateConfirmPassword = ({ getFieldValue }) => ({
    validator(_, value) {
      if (!value || getFieldValue('newPassword') === value) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
    },
  });

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <Card bordered={false}>
        <Title level={2} style={{ marginBottom: '24px' }}>
          <LockOutlined style={{ marginRight: '8px' }} />
          Đổi Mật Khẩu
        </Title>

        <Form
          form={form}
          name="changePassword"
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
          autoComplete="off"
        >
          <Form.Item
            label="Mật khẩu hiện tại"
            name="oldPassword"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu hiện tại"
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
              { 
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
                message: 'Mật khẩu phải có chữ hoa, chữ thường và số!' 
              }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu mới"
            />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
              validateConfirmPassword
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập lại mật khẩu mới"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: '40px',
              }}
            >
              Đổi Mật Khẩu
            </Button>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="default"
              onClick={() => navigate(-1)}
              block
              style={{
                height: '40px',
              }}
            >
              Hủy
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ChangePassword;
