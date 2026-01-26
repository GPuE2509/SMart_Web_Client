import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  SearchOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';

const { Title } = Typography;
const { TextArea } = Input;

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [imageFileList, setImageFileList] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
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
      const queryParams = {
        page: params.page || pagination.current,
        limit: params.limit || pagination.pageSize,
        ...params,
      };
      const response = await productService.getAll(queryParams);
      const data = response.data || [];
      setProducts(data);
      setPagination(prev => ({
        ...prev,
        current: response.pagination?.page || prev.current,
        pageSize: response.pagination?.limit || prev.pageSize,
        total: response.pagination?.total || data.length,
      }));
    } catch (error) {
      message.error(error.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  // Search handler
  const handleSearch = (value) => {
    setSearchText(value);
    const params = { page: 1 };
    if (value) params.search = value;
    if (selectedCategory) params.category_id = selectedCategory;
    fetchProducts(params);
  };

  // Category filter handler
  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId);
    const params = { page: 1 };
    if (searchText) params.search = searchText;
    if (categoryId) params.category_id = categoryId;
    fetchProducts(params);
  };

  // Handle table pagination change
  const handleTableChange = (paginationConfig) => {
    const params = {
      page: paginationConfig.current,
      limit: paginationConfig.pageSize,
    };
    if (searchText) params.search = searchText;
    if (selectedCategory) params.category_id = selectedCategory;
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
        tax_percentage: product.tax_percentage || 0,
        image_url: product.image_url,
        is_active: product.is_active,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        is_active: true,
        tax_percentage: 8,
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
        tax_percentage: values.tax_percentage || 0,
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

  // Toggle product status
  const handleToggleStatus = async (id, currentStatus) => {
    setLoading(true);
    try {
      const newStatus = !currentStatus;
      await productService.update(id, { is_active: newStatus });
      message.success(`Đã ${newStatus ? 'bật' : 'tắt'} sản phẩm thành công`);
      fetchProducts();
    } catch (error) {
      message.error(error.message || 'Không thể cập nhật trạng thái sản phẩm');
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
      render: (name, record) => (
        <a
          onClick={() => navigate(`/admin/units?product_id=${record._id}`)}
          style={{ cursor: 'pointer', color: '#000000' }}
        >
          {name}
        </a>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'category_id',
      key: 'category_id',
      render: (category) => category?.name || '-',
    },
    {
      title: 'Thuế (%)',
      dataIndex: 'tax_percentage',
      key: 'tax_percentage',
      width: 100,
      render: (taxPercentage) => `${(taxPercentage || 0).toFixed(1)}%`,
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
            title={record.is_active ? "Tắt sản phẩm" : "Bật sản phẩm"}
            description={record.is_active ? "Sản phẩm này sẽ bị ẩn khỏi bán hàng" : "Sản phẩm này sẽ hiển thị trong bán hàng"}
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
            name="tax_percentage"
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
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
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
            dataSource={products}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => `Tổng ${total} sản phẩm`,
            }}
            onChange={handleTableChange}
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
