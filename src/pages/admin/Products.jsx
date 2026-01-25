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
  InputNumber,
  Upload,
  Row,
  Col,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';

const { Title } = Typography;
const { TextArea } = Input;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [imageFileList, setImageFileList] = useState([]);
  const [form] = Form.useForm();

  // Fetch products and categories on mount
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAll({ is_active: true });
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch products from API
  const fetchProducts = async (params = {}) => {
    setLoading(true);
    try {
      const response = await productService.getAll(params);
      const data = response.data || [];
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      message.error(error.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  // Search handler
  const handleSearch = (value) => {
    setSearchText(value);
    const params = {};
    if (value) params.search = value;
    if (selectedCategory) params.category_id = selectedCategory;
    fetchProducts(params);
  };

  // Category filter handler
  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId);
    const params = {};
    if (searchText) params.search = searchText;
    if (categoryId) params.category_id = categoryId;
    fetchProducts(params);
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

  // Open drawer for add/edit
  const handleOpenDrawer = (product = null) => {
    setEditingProduct(product);
    
    // Reset image file list
    if (product && product.image_url) {
      setImageFileList([{
        uid: '-1',
        name: 'image.png',
        status: 'done',
        url: product.image_url,
      }]);
    } else {
      setImageFileList([]);
    }
    if (product) {
      form.setFieldsValue({
        name: product.name,
        description: product.description,
        category_id: product.category_id?._id || product.category_id,
        tax_rate: product.tax_rate || 0,
        image_url: product.image_url,
        is_active: product.is_active,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        is_active: true,
        tax_rate: 0,
      });
    }
    setDrawerVisible(true);
  };

  // Close drawer
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setEditingProduct(null);
    setImageFileList([]);
    form.resetFields();
  };

  // Save product
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      console.log('Form values:', values);
      console.log('is_active value:', values.is_active, typeof values.is_active);

      // Get image_url - nếu là object thì lấy từ imageFileList, nếu là string thì giữ nguyên
      let imageUrl = values.image_url;
      if (typeof imageUrl !== 'string' && imageFileList.length > 0) {
        if (imageFileList[0].originFileObj) {
          imageUrl = await getBase64(imageFileList[0].originFileObj);
        } else if (imageFileList[0].url) {
          imageUrl = imageFileList[0].url;
        }
      }

      const productData = {
        name: values.name,
        description: values.description,
        category_id: values.category_id,
        tax_rate: values.tax_rate || 0,
        image_url: imageUrl || '',
        is_active: values.is_active ?? true,
      };

      console.log('Product data to send:', productData);

      if (editingProduct) {
        // Update existing product
        await productService.update(editingProduct._id, productData);
        message.success('Cập nhật sản phẩm thành công!');
      } else {
        // Add new product
        await productService.create(productData);
        message.success('Tạo sản phẩm thành công!');
      }

      handleCloseDrawer();
      fetchProducts();
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await productService.delete(id);
      message.success('Xóa sản phẩm thành công!');
      fetchProducts();
    } catch (error) {
      message.error(error.message || 'Không thể xóa sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  // Stock status color
  const getStockStatusColor = (status) => {
    switch (status) {
      case 'in_stock':
        return 'green';
      case 'low_stock':
        return 'orange';
      case 'out_of_stock':
        return 'red';
      default:
        return 'default';
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
          alt="Product"
          style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
        /> : '-'
      ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Danh mục',
      dataIndex: 'category_id',
      key: 'category_id',
      render: (category) => category?.name || '-',
    },
    {
      title: 'Thuế (%)',
      dataIndex: 'tax_rate',
      key: 'tax_rate',
      width: 100,
      render: (taxRate) => `${(taxRate || 0).toFixed(1)}%`,
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
            title="Xóa sản phẩm"
            description="Bạn có chắc chắn muốn xóa sản phẩm này?"
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

  // Drawer form content
  const drawerFormContent = (
    <>
      <Form.Item
        name="name"
        label="Tên sản phẩm"
        rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
      >
        <Input placeholder="Nhập tên sản phẩm" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Mô tả"
      >
        <TextArea rows={3} placeholder="Nhập mô tả sản phẩm" />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="category_id"
            label="Danh mục"
            rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
          >
            <Select
              placeholder="Chọn danh mục"
              options={categories.map((cat) => ({
                label: cat.name,
                value: cat._id,
              }))}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="tax_rate"
            label="Thuế (%)"
          >
            <InputNumber
              placeholder="0.0"
              min={0}
              max={100}
              step={0.1}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="is_active" label="Trạng thái" valuePropName="checked">
        <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngừng" />
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
    </>
  );

  return (
    <div>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3} style={{ margin: 0 }}>
              Quản lý sản phẩm
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenDrawer()}
            >
              Thêm sản phẩm
            </Button>
          </div>

          <Space size="middle" style={{ width: '100%', flexWrap: 'wrap' }}>
            <Input
              placeholder="Tìm kiếm theo tên hoặc mô tả..."
              prefix={<SearchOutlined />}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
              style={{ width: 400 }}
            />
            <Select
              placeholder="Lọc theo danh mục"
              style={{ width: 200 }}
              allowClear
              onChange={handleCategoryFilter}
              options={[
                { label: 'Tất cả danh mục', value: null },
                ...categories.map((cat) => ({
                  label: cat.name,
                  value: cat._id,
                })),
              ]}
            />
          </Space>

          <Table
            columns={columns}
            dataSource={filteredProducts}
            rowKey="_id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} sản phẩm`,
            }}
          />
        </Space>
      </Card>

      <Drawer
        title={editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
        open={drawerVisible}
        onClose={handleCloseDrawer}
        width={720}
        extra={
          <Space>
            <Button onClick={handleCloseDrawer}>Hủy</Button>
            <Button type="primary" onClick={handleSave} loading={loading}>
              {editingProduct ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          {drawerFormContent}
        </Form>
      </Drawer>
    </div>
  );
};

export default Products;
