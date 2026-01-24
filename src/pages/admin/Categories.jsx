import { useState } from 'react';
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
import { mockCategories } from '../../services/mockData';

const { Title } = Typography;
const { TextArea } = Input;

const Categories = () => {
  const [categories, setCategories] = useState([...mockCategories]);
  const [filteredCategories, setFilteredCategories] = useState([...mockCategories]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [imageFileList, setImageFileList] = useState([]);
  const [form] = Form.useForm();

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
      form.setFieldsValue({ imageUrl: base64 });
    }
  };

  // Search handler
  const handleSearch = (value) => {
    const filtered = categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(value.toLowerCase()) ||
        cat.description.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCategories(filtered);
  };

  // Open drawer for add/edit
  const handleOpenDrawer = (category = null) => {
    setEditingCategory(category);
    if (category) {
      form.setFieldsValue({
        name: category.name,
        description: category.description,
        slug: category.slug,
        parentId: category.parentId,
        imageUrl: category.imageUrl,
        isActive: category.isActive,
      });
      
      // Set image file list
      if (category.imageUrl) {
        setImageFileList([{
          uid: '-1',
          name: 'image.png',
          status: 'done',
          url: category.imageUrl,
        }]);
      } else {
        setImageFileList([]);
      }
    } else {
      form.resetFields();
      form.setFieldsValue({ isActive: true });
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

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (editingCategory) {
        // Update existing category
        const updatedCategories = categories.map((cat) =>
          cat.id === editingCategory.id
            ? {
                ...cat,
                ...values,
                slug: values.name.toLowerCase().replace(/\s+/g, '-'),
                updatedAt: new Date().toISOString(),
              }
            : cat
        );
        setCategories(updatedCategories);
        setFilteredCategories(updatedCategories);
        message.success('Category updated successfully!');
      } else {
        // Add new category
        const newCategory = {
          id: Math.max(...categories.map((c) => c.id)) + 1,
          ...values,
          slug: values.name.toLowerCase().replace(/\s+/g, '-'),
          productCount: 0,
          isActive: values.isActive ?? true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const updatedCategories = [...categories, newCategory];
        setCategories(updatedCategories);
        setFilteredCategories(updatedCategories);
        message.success('Category created successfully!');
      }

      handleCloseDrawer();
    } catch {
      // Validation failed
    } finally {
      setLoading(false);
    }
  };

  // Delete category
  const handleDelete = async (id) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const updatedCategories = categories.filter((cat) => cat.id !== id);
      setCategories(updatedCategories);
      setFilteredCategories(updatedCategories);
      message.success('Category deleted successfully!');
    } catch {
      message.error('Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  // Get parent category name
  const getParentName = (parentId) => {
    if (!parentId) return '-';
    const parent = categories.find((cat) => cat.id === parentId);
    return parent ? parent.name : '-';
  };

  // Table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 80,
      render: (url) => (
        <img
          src={url}
          alt="Category"
          style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
        />
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <strong>{text}</strong>
          <span style={{ fontSize: '12px', color: '#999' }}>{record.slug}</span>
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Parent Category',
      dataIndex: 'parentId',
      key: 'parentId',
      render: (parentId) => getParentName(parentId),
      filters: [
        { text: 'Root Categories', value: null },
        ...categories
          .filter((cat) => cat.parentId === null)
          .map((cat) => ({ text: cat.name, value: cat.id })),
      ],
      onFilter: (value, record) => {
        if (value === null) return record.parentId === null;
        return record.parentId === value;
      },
    },
    {
      title: 'Products',
      dataIndex: 'productCount',
      key: 'productCount',
      width: 100,
      sorter: (a, b) => a.productCount - b.productCount,
      render: (count) => <Tag color="blue">{count}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleOpenDrawer(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Category"
            description="Are you sure you want to delete this category?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
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
              Category Management
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenDrawer()}
            >
              Add Category
            </Button>
          </div>

          <Input
            placeholder="Search categories by name or description..."
            prefix={<SearchOutlined />}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
            style={{ maxWidth: 400 }}
          />

          <Table
            columns={columns}
            dataSource={filteredCategories}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} categories`,
            }}
          />
        </Space>
      </Card>

      <Drawer
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
        open={drawerVisible}
        onClose={handleCloseDrawer}
        width={600}
        extra={
          <Space>
            <Button onClick={handleCloseDrawer}>Cancel</Button>
            <Button type="primary" onClick={handleSave} loading={loading}>
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={3} placeholder="Enter category description" />
          </Form.Item>

          <Form.Item name="parentId" label="Parent Category">
            <Select
              placeholder="Select parent category (optional)"
              allowClear
              options={categories
                .filter((cat) => cat.parentId === null && cat.id !== editingCategory?.id)
                .map((cat) => ({
                  label: cat.name,
                  value: cat.id,
                }))}
            />
          </Form.Item>

          <Form.Item
            name="imageUrl"
            label="Image"
            rules={[{ required: true, message: 'Please upload image' }]}
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

          <Form.Item name="isActive" label="Active Status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default Categories;
