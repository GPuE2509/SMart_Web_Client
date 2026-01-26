import { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Input,
  Drawer,
  Form,
  Select,
  Switch,
  message,
  Popconfirm,
  Tag,
  Typography,
  Row,
  Col,
  Tooltip,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  SearchOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import categoryService from '../../services/categoryService';

const { Title } = Typography;
const { TextArea } = Input;

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]); // For parent dropdown
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [imageFileList, setImageFileList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [form] = Form.useForm();

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
    fetchAllCategories();
  }, []);

  // Fetch all categories for parent dropdown
  const fetchAllCategories = async () => {
    try {
      const response = await categoryService.getAll({ limit: 1000 });
      setAllCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching all categories:', error);
    }
  };

  // Fetch categories from API with pagination
  const fetchCategories = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: params.page || pagination.current,
        limit: params.limit || pagination.pageSize,
        ...params,
      };
      
      const response = await categoryService.getAll(queryParams);
      const data = response.data || [];
      setCategories(data);
      setPagination(prev => ({
        ...prev,
        current: response.pagination?.page || prev.current,
        pageSize: response.pagination?.limit || prev.pageSize,
        total: response.pagination?.total || data.length,
      }));
    } catch (error) {
      message.error(error.message || 'Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
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

  // Validate image before upload
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Chỉ được upload file hình ảnh!');
      return Upload.LIST_IGNORE;
    }
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('Hình ảnh phải nhỏ hơn 10MB!');
      return Upload.LIST_IGNORE;
    }
    return false; // Prevent auto upload
  };

  const handleImageChange = async ({ fileList }) => {
    setImageFileList(fileList);
    
    if (fileList.length > 0 && fileList[0].originFileObj) {
      const base64 = await getBase64(fileList[0].originFileObj);
      form.setFieldsValue({ image_url: base64 });
    } else if (fileList.length === 0) {
      form.setFieldsValue({ image_url: '' });
    }
  };

  // Search handler
  const handleSearch = (value) => {
    setSearchText(value);
    fetchCategories({ search: value, page: 1 });
  };

  // Handle table pagination change
  const handleTableChange = (paginationConfig) => {
    const params = {
      page: paginationConfig.current,
      limit: paginationConfig.pageSize,
    };
    if (searchText) params.search = searchText;
    fetchCategories(params);
  };

  // Open drawer for add/edit
  const handleOpenDrawer = (category = null) => {
    setEditingCategory(category);
    if (category) {
      form.setFieldsValue({
        name: category.name,
        description: category.description,
        parent_id: category.parent_id?._id || category.parent_id,
        image_url: category.image_url,
        is_active: category.is_active,
      });
      
      // Set image file list
      if (category.image_url) {
        setImageFileList([{
          uid: '-1',
          name: 'image.png',
          status: 'done',
          url: category.image_url,
        }]);
      } else {
        setImageFileList([]);
      }
    } else {
      form.resetFields();
      form.setFieldsValue({ is_active: true });
      setImageFileList([]);
    }
    setDrawerVisible(true);
  };

  // Close drawer
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setEditingCategory(null);
    setImageFileList([]);
    form.resetFields();
  };

  // Save category
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Get image_url - nếu là object thì lấy từ imageFileList, nếu là string thì giữ nguyên
      let imageUrl = values.image_url;
      if (typeof imageUrl !== 'string' && imageFileList.length > 0) {
        if (imageFileList[0].originFileObj) {
          imageUrl = await getBase64(imageFileList[0].originFileObj);
        } else if (imageFileList[0].url) {
          imageUrl = imageFileList[0].url;
        }
      }

      const categoryData = {
        name: values.name,
        description: values.description,
        parent_id: values.parent_id || null,
        image_url: imageUrl || '',
        is_active: values.is_active ?? true,
      };

      if (editingCategory) {
        // Update existing category
        await categoryService.update(editingCategory._id, categoryData);
        message.success('Cập nhật danh mục thành công!');
      } else {
        // Add new category
        await categoryService.create(categoryData);
        message.success('Tạo danh mục thành công!');
      }

      handleCloseDrawer();
      fetchCategories({ search: searchText });
      fetchAllCategories();
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  // Toggle category status
  const handleToggleStatus = async (id, currentStatus) => {
    setLoading(true);
    try {
      const newStatus = !currentStatus;
      await categoryService.update(id, { is_active: newStatus });
      message.success(`Đã ${newStatus ? 'bật' : 'tắt'} danh mục thành công`);
      fetchCategories({ search: searchText });
      fetchAllCategories();
    } catch (error) {
      message.error(error.message || 'Không thể cập nhật trạng thái danh mục');
    } finally {
      setLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Hình ảnh',
      dataIndex: 'image_url',
      key: 'image_url',
      width: 80,
      render: (url) => (
        url ? <img
          src={url}
          alt="Category"
          style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
        /> : '-'
      ),
    },
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Danh mục cha',
      dataIndex: 'parent_id',
      key: 'parent_id',
      render: (parent) => parent?.name || '-',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 120,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Ngừng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Sửa">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenDrawer(record)}
            />
          </Tooltip>
          <Popconfirm
            title={record.is_active ? "Tắt danh mục" : "Bật danh mục"}
            description={record.is_active ? "Danh mục này sẽ bị ẩn" : "Danh mục này sẽ được hiển thị"}
            onConfirm={() => handleToggleStatus(record._id, record.is_active)}
            okText="Có"
            cancelText="Không"
          >
            <Tooltip title={record.is_active ? "Tắt" : "Bật"}>
              <Button 
                type="text" 
                size="small" 
                danger={record.is_active}
                style={{ color: record.is_active ? undefined : '#52c41a' }}
                icon={record.is_active ? <StopOutlined /> : <CheckCircleOutlined />} 
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3} style={{ margin: 0 }}>
              Quản lý danh mục
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenDrawer()}
            >
              Thêm danh mục
            </Button>
          </div>

          <Input
            placeholder="Tìm kiếm theo tên hoặc mô tả..."
            prefix={<SearchOutlined />}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
            style={{ maxWidth: 400 }}
          />

          <Table
            columns={columns}
            dataSource={categories}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => `Tổng ${total} danh mục`,
            }}
            onChange={handleTableChange}
          />
        </Space>
      </Card>

      <Drawer
        title={editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
        open={drawerVisible}
        onClose={handleCloseDrawer}
        width={600}
        extra={
          <Space>
            <Button onClick={handleCloseDrawer}>Hủy</Button>
            <Button type="primary" onClick={handleSave} loading={loading}>
              {editingCategory ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}
          >
            <Input placeholder="Nhập tên danh mục" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea rows={3} placeholder="Nhập mô tả danh mục" />
          </Form.Item>

          <Form.Item name="parent_id" label="Danh mục cha">
            <Select
              placeholder="Chọn danh mục cha (tùy chọn)"
              allowClear
              options={allCategories
                .filter((cat) => !cat.parent_id && cat._id !== editingCategory?._id)
                .map((cat) => ({
                  label: cat.name,
                  value: cat._id,
                }))}
            />
          </Form.Item>

          <Form.Item
            name="image_url"
            label="Hình ảnh"
            extra="Chỉ chấp nhận file ảnh, tối đa 10MB"
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
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default Categories;
