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
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import categoryService from '../../services/categoryService';

const { Title } = Typography;
const { TextArea } = Input;

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [imageFileList, setImageFileList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch categories from API
  const fetchCategories = async (search = '') => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      
      const response = await categoryService.getAll(params);
      const data = response.data || [];
      setCategories(data);
      setFilteredCategories(data);
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
    fetchCategories(value);
  };

  // Open drawer for add/edit
  const handleOpenDrawer = (category = null) => {
    setEditingCategory(category);
    if (category) {
      form.setFieldsValue({
        name: category.name,
        description: category.description,
        parent_id: category.parent_id,
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
      fetchCategories(searchText);
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  // Delete category
  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await categoryService.delete(id);
      message.success('Xóa danh mục thành công!');
      fetchCategories(searchText);
    } catch (error) {
      message.error(error.message || 'Không thể xóa danh mục');
    } finally {
      setLoading(false);
    }
  };

  // Get parent category name
  const getParentName = (parentId) => {
    if (!parentId) return '-';
    const parent = categories.find((cat) => cat._id === parentId);
    return parent ? parent.name : '-';
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
      render: (parentId) => getParentName(parentId),
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
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Sửa">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleOpenDrawer(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa danh mục"
            description="Bạn có chắc chắn muốn xóa danh mục này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Tooltip title="Xóa">
              <Button type="link" danger icon={<DeleteOutlined />} />
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
            dataSource={filteredCategories}
            rowKey="_id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} danh mục`,
            }}
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
              options={categories
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
          >
            <Upload
              listType="picture-card"
              fileList={imageFileList}
              onChange={handleImageChange}
              beforeUpload={() => false}
              maxCount={1}
            >
              {imageFileList.length === 0 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item name="is_active" label="Trạng thái" valuePropName="checked">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngừng" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default Categories;
