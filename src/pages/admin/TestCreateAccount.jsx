import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { MailOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import userService from '../../services/userService';

const { Title } = Typography;

function TestCreateAccount() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      console.log('Creating account with:', values);
      const response = await userService.createStaffAccount(values);
      console.log('Create account response:', response);
      
      message.success('Tạo tài khoản thành công! Kiểm tra email.');
      setResult(response);
    } catch (error) {
      console.error('Create account error:', error);
      message.error(error.message || 'Không thể tạo tài khoản');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 50, maxWidth: 800, margin: '0 auto' }}>
      <Card>
        <Title level={3}>Test: Tạo tài khoản Staff/Admin</Title>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Họ và tên"
            name="full_name"
            rules={[{ required: true }]}
            initialValue="Test User"
          >
            <Input prefix={<UserOutlined />} />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: 'email' }]}
            initialValue="test@example.com"
          >
            <Input prefix={<MailOutlined />} />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phone"
            initialValue="0912345678"
          >
            <Input prefix={<PhoneOutlined />} />
          </Form.Item>

          <Form.Item
            label="Vai trò"
            name="role"
            rules={[{ required: true }]}
            initialValue="seller_staff"
          >
            <select style={{ width: '100%', padding: 8 }}>
              <option value="admin">Admin</option>
              <option value="seller_staff">Seller Staff</option>
              <option value="repository_staff">Repository Staff</option>
            </select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Tạo tài khoản
            </Button>
          </Form.Item>
        </Form>

        {result && (
          <Card style={{ marginTop: 20, background: '#f0f0f0' }}>
            <Title level={5}>Kết quả:</Title>
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </Card>
        )}
      </Card>
    </div>
  );
}

export default TestCreateAccount;
