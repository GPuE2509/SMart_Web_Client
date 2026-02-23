import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Avatar,
  Typography,
  Descriptions,
  Button,
  Modal,
  Form,
  Input,
  Upload,
  message,
  Spin,
  Divider,
  Tag,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  CameraOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import profileService from '../../services/profileService';

const { Title, Text } = Typography;

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [imageFileList, setImageFileList] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProfile();
  }, []);

  // Fetch current user profile
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await profileService.getMyProfile();
      setProfile(response.data);
    } catch (error) {
      message.error(error.message || 'Không thể tải thông tin profile');
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal
  const handleOpenEditModal = () => {
    if (profile) {
      form.setFieldsValue({
        full_name: profile.full_name,
        phone: profile.phone,
        address: {
          street: profile.address?.street || '',
          ward: profile.address?.ward || '',
          district: profile.address?.district || '',
          city: profile.address?.city || ''
        }
      });

      // Set avatar image
      if (profile.avatar_url) {
        setImageFileList([{
          uid: '-1',
          name: 'avatar.png',
          status: 'done',
          url: profile.avatar_url,
        }]);
      } else {
        setImageFileList([]);
      }
    }
    setEditModalVisible(true);
  };

  // Close edit modal
  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    form.resetFields();
    setImageFileList([]);
  };

  // Handle image upload
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Chỉ được upload file hình ảnh!');
      return Upload.LIST_IGNORE;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Hình ảnh phải nhỏ hơn 5MB!');
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const handleImageChange = async ({ fileList }) => {
    setImageFileList(fileList);
    
    if (fileList.length > 0 && fileList[0].originFileObj) {
      const base64 = await getBase64(fileList[0].originFileObj);
      form.setFieldsValue({ avatar_url: base64 });
    } else if (fileList.length === 0) {
      form.setFieldsValue({ avatar_url: '' });
    }
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Get avatar_url
      let avatarUrl = profile?.avatar_url || '';
      if (imageFileList.length > 0) {
        if (imageFileList[0].originFileObj) {
          avatarUrl = await getBase64(imageFileList[0].originFileObj);
        } else if (imageFileList[0].url) {
          avatarUrl = imageFileList[0].url;
        }
      } else {
        avatarUrl = '';
      }

      const profileData = {
        full_name: values.full_name,
        phone: values.phone,
        avatar_url: avatarUrl,
        address: {
          street: values.address?.street || '',
          ward: values.address?.ward || '',
          district: values.address?.district || '',
          city: values.address?.city || ''
        }
      };

      await profileService.updateMyProfile(profileData);
      message.success('Cập nhật profile thành công!');
      handleCloseEditModal();
      fetchProfile();
    } catch (error) {
      message.error(error.message || 'Không thể cập nhật profile');
    } finally {
      setLoading(false);
    }
  };

  // Get role display text
  const getRoleDisplay = (role) => {
    const roleMap = {
      'admin': { text: 'Quản trị viên', color: 'red' },
      'seller_staff': { text: 'Nhân viên bán hàng', color: 'blue' },
      'repository_staff': { text: 'Nhân viên kho', color: 'green' },
      'customer': { text: 'Khách hàng', color: 'default' }
    };
    return roleMap[role] || { text: role, color: 'default' };
  };

  // Get status display text
  const getStatusDisplay = (status) => {
    const statusMap = {
      'active': { text: 'Hoạt động', color: 'success' },
      'blocked': { text: 'Bị khóa', color: 'error' }
    };
    return statusMap[status] || { text: status, color: 'default' };
  };

  if (loading && !profile) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Card>
        <Row gutter={[24, 24]}>
          {/* Profile Header */}
          <Col span={24}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={3} style={{ margin: 0 }}>
                Thông tin cá nhân
              </Title>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={handleOpenEditModal}
              >
                Chỉnh sửa
              </Button>
            </div>
          </Col>

          {/* Avatar and Basic Info */}
          <Col span={24}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <Avatar
                size={120}
                src={profile?.avatar_url}
                icon={!profile?.avatar_url && <UserOutlined />}
                style={{ backgroundColor: '#1890ff' }}
              />
              <div>
                <Title level={2} style={{ margin: 0, marginBottom: '8px' }}>
                  {profile?.full_name || 'Chưa cập nhật'}
                </Title>
                <div style={{ marginBottom: '8px' }}>
                  <Tag color={getRoleDisplay(profile?.role).color}>
                    {getRoleDisplay(profile?.role).text}
                  </Tag>
                  <Tag color={getStatusDisplay(profile?.status).color}>
                    {getStatusDisplay(profile?.status).text}
                  </Tag>
                </div>
                <Text type="secondary">
                  Điểm tích lũy: <strong>{profile?.loyalty_points || 0}</strong> điểm
                </Text>
              </div>
            </div>
          </Col>

          <Col span={24}>
            <Divider />
          </Col>

          {/* Profile Details */}
          <Col span={24}>
            <Descriptions
              title="Thông tin chi tiết"
              bordered
              column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
            >
              <Descriptions.Item 
                label={<><MailOutlined /> Email</>}
                span={2}
              >
                {profile?.email || 'Chưa cập nhật'}
              </Descriptions.Item>

              <Descriptions.Item 
                label={<><PhoneOutlined /> Số điện thoại</>}
              >
                {profile?.phone || 'Chưa cập nhật'}
              </Descriptions.Item>

              <Descriptions.Item label="Trạng thái xác thực">
                {profile?.isVerified ? (
                  <Tag color="success">Đã xác thực</Tag>
                ) : (
                  <Tag color="warning">Chưa xác thực</Tag>
                )}
              </Descriptions.Item>

              <Descriptions.Item 
                label={<><HomeOutlined /> Địa chỉ</>}
                span={2}
              >
                {profile?.address?.street || profile?.address?.ward || 
                 profile?.address?.district || profile?.address?.city ? (
                  <>
                    {profile?.address?.street && <div>{profile.address.street}</div>}
                    {profile?.address?.ward && <div>Phường/Xã: {profile.address.ward}</div>}
                    {profile?.address?.district && <div>Quận/Huyện: {profile.address.district}</div>}
                    {profile?.address?.city && <div>Tỉnh/Thành phố: {profile.address.city}</div>}
                  </>
                ) : (
                  'Chưa cập nhật'
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Ngày tạo tài khoản">
                {profile?.created_at ? new Date(profile.created_at).toLocaleString('vi-VN') : 'N/A'}
              </Descriptions.Item>

              <Descriptions.Item label="Cập nhật lần cuối">
                {profile?.updated_at ? new Date(profile.updated_at).toLocaleString('vi-VN') : 'N/A'}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {/* Edit Profile Modal */}
      <Modal
        title="Chỉnh sửa thông tin cá nhân"
        open={editModalVisible}
        onCancel={handleCloseEditModal}
        footer={[
          <Button key="cancel" onClick={handleCloseEditModal}>
            Hủy
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<SaveOutlined />}
            loading={loading}
            onClick={handleSaveProfile}
          >
            Lưu thay đổi
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
          {/* Avatar Upload */}
          <Form.Item
            label="Ảnh đại diện"
            extra="Chỉ chấp nhận file ảnh, tối đa 5MB"
          >
            <Upload
              listType="picture-card"
              fileList={imageFileList}
              onChange={handleImageChange}
              beforeUpload={beforeUpload}
              maxCount={1}
              accept="image/*"
            >
              {imageFileList.length === 0 && (
                <div>
                  <CameraOutlined style={{ fontSize: '24px' }} />
                  <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          {/* Full Name */}
          <Form.Item
            name="full_name"
            label="Họ và tên"
            rules={[
              { required: true, message: 'Vui lòng nhập họ và tên' },
              { max: 255, message: 'Họ và tên không được vượt quá 255 ký tự' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Nhập họ và tên"
            />
          </Form.Item>

          {/* Phone */}
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại' },
              { 
                pattern: /^(0[3|5|7|8|9])+([0-9]{8})$/,
                message: 'Số điện thoại không hợp lệ'
              }
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="Nhập số điện thoại"
            />
          </Form.Item>

          {/* Address */}
          <Divider orientation="left">Địa chỉ</Divider>

          <Form.Item
            name={['address', 'street']}
            label="Số nhà, tên đường"
          >
            <Input
              prefix={<HomeOutlined />}
              placeholder="Nhập số nhà, tên đường"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['address', 'ward']}
                label="Phường/Xã"
              >
                <Input placeholder="Nhập phường/xã" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['address', 'district']}
                label="Quận/Huyện"
              >
                <Input placeholder="Nhập quận/huyện" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name={['address', 'city']}
            label="Tỉnh/Thành phố"
          >
            <Input placeholder="Nhập tỉnh/thành phố" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Profile;
