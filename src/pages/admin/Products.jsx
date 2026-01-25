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
import { mockProducts, mockCategories, mockUnits } from '../../services/mockData';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Products = () => {
  const [products, setProducts] = useState([...mockProducts]);
  const [filteredProducts, setFilteredProducts] = useState([...mockProducts]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [imageFileList, setImageFileList] = useState([]);
  const [form] = Form.useForm();

  // Search handler
  const handleSearch = (value) => {
    let filtered = products;

    // Filter by search text
    if (value) {
      filtered = filtered.filter(
        (prod) =>
          prod.name.toLowerCase().includes(value.toLowerCase()) ||
          prod.sku.toLowerCase().includes(value.toLowerCase()) ||
          prod.description.toLowerCase().includes(value.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((prod) => prod.categoryId === selectedCategory);
    }

    setFilteredProducts(filtered);
  };

  // Category filter handler
  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId);
    let filtered = products;

    if (categoryId) {
      filtered = filtered.filter((prod) => prod.categoryId === categoryId);
    }

    setFilteredProducts(filtered);
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
      form.setFieldsValue({ mainImage: base64 });
    }
  };

  // Open drawer for add/edit
  const handleOpenDrawer = (product = null) => {
    setEditingProduct(product);
    
    // Reset image file list
    if (product && product.mainImage) {
      setImageFileList([{
        uid: '-1',
        name: 'image.png',
        status: 'done',
        url: product.mainImage,
      }]);
    } else {
      setImageFileList([]);
    }
    if (product) {
      form.setFieldsValue({
        name: product.name,
        sku: product.sku,
        description: product.description,
        categoryId: product.categoryId,
        taxRate: product.taxRate || 0,
        costPrice: product.costPrice,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        mainImage: product.mainImage,
        images: product.images,
        isActive: product.isActive,
        tags: product.tags,
        specifications: Object.entries(product.specifications || {}).map(([key, value]) => ({
          key,
          value,
        })),
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        isActive: true,
        stock: 0,
        lowStockThreshold: 10,
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

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Convert specifications array back to object
      const specifications = {};
      if (values.specifications) {
        values.specifications.forEach((spec) => {
          if (spec.key && spec.value) {
            specifications[spec.key] = spec.value;
          }
        });
      }

      // Get category name
      const category = mockCategories.find((cat) => cat.id === values.categoryId);

      // Determine stock status
      let stockStatus = 'in_stock';
      if (values.stock === 0) stockStatus = 'out_of_stock';
      else if (values.stock <= values.lowStockThreshold) stockStatus = 'low_stock';

      if (editingProduct) {
        // Update existing product
        const updatedProducts = products.map((prod) =>
          prod.id === editingProduct.id
            ? {
                ...prod,
                ...values,
                categoryName: category?.name || '',
                specifications,
                stockStatus,
                images: values.images || [values.mainImage],
                updatedAt: new Date().toISOString(),
              }
            : prod
        );
        setProducts(updatedProducts);
        setFilteredProducts(updatedProducts);
        message.success('Product updated successfully!');
      } else {
        // Add new product
        const newProduct = {
          id: Math.max(...products.map((p) => p.id)) + 1,
          ...values,
          categoryName: category?.name || '',
          specifications,
          stockStatus,
          images: values.images || [values.mainImage],
          soldCount: 0,
          viewCount: 0,
          rating: 0,
          reviewCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const updatedProducts = [...products, newProduct];
        setProducts(updatedProducts);
        setFilteredProducts(updatedProducts);
        message.success('Product created successfully!');
      }

      handleCloseDrawer();
    } catch {
      // Validation failed
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const handleDelete = async (id) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const updatedProducts = products.filter((prod) => prod.id !== id);
      setProducts(updatedProducts);
      setFilteredProducts(updatedProducts);
      message.success('Product deleted successfully!');
    } catch {
      message.error('Failed to delete product');
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
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Image',
      dataIndex: 'mainImage',
      key: 'mainImage',
      width: 80,
      render: (url) => (
        <img
          src={url}
          alt="Product"
          style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
        />
      ),
    },
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <strong>{text}</strong>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            SKU: {record.sku}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'categoryName',
      key: 'categoryName',
      filters: mockCategories.map((cat) => ({ text: cat.name, value: cat.name })),
      onFilter: (value, record) => record.categoryName === value,
    },
    {
      title: 'Tax Rate',
      dataIndex: 'taxRate',
      key: 'taxRate',
      width: 100,
      sorter: (a, b) => (a.taxRate || 0) - (b.taxRate || 0),
      render: (taxRate) => `${(taxRate || 0).toFixed(1)}%`,
    },
    {
      title: 'Unit Types',
      key: 'unitCount',
      width: 100,
      render: (_, record) => {
        const unitCount = mockUnits.filter(u => u.productId === record.id).length;
        return (
          <Tag color="blue">{unitCount}</Tag>
        );
      },
    },
    {
      title: 'Total Stock',
      dataIndex: 'stock',
      key: 'stock',
      sorter: (a, b) => a.stock - b.stock,
      render: (stock, record) => (
        <Space direction="vertical" size={0}>
          <strong>{stock}</strong>
          <Tag color={getStockStatusColor(record.stockStatus)} style={{ fontSize: '11px' }}>
            {record.stockStatus.replace('_', ' ').toUpperCase()}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Active Status',
      dataIndex: 'isActive',
      key: 'isActive',
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
            title="Delete Product"
            description="Are you sure you want to delete this product?"
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

  // Drawer tabs
  const drawerTabs = [
    {
      key: 'general',
      label: 'General Info',
      children: (
        <>
          <Form.Item
            name="name"
            label="Product Name"
            rules={[{ required: true, message: 'Please enter product name' }]}
          >
            <Input placeholder="Enter product name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={3} placeholder="Enter product description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="categoryId"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select
                  placeholder="Select category"
                  options={mockCategories.map((cat) => ({
                    label: cat.name,
                    value: cat.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="taxRate"
                label="Tax Rate (%)"
                rules={[{ required: true, message: 'Please enter tax rate' }]}
              >
                <InputNumber
                  placeholder="0.0"
                  min={0}
                  max={100}
                  step={0.1}
                  suffix="%"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="isActive" label="Active Status" valuePropName="checked">
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>

          <Form.Item
            name="mainImage"
            label="Main Image"
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
        </>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3} style={{ margin: 0 }}>
              Product Management
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenDrawer()}
            >
              Add Product
            </Button>
          </div>

          <Space size="middle" style={{ width: '100%', flexWrap: 'wrap' }}>
            <Input
              placeholder="Search products by name, SKU, or description..."
              prefix={<SearchOutlined />}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
              style={{ width: 400 }}
            />
            <Select
              placeholder="Filter by category"
              style={{ width: 200 }}
              allowClear
              onChange={handleCategoryFilter}
              options={[
                { label: 'All Categories', value: null },
                ...mockCategories.map((cat) => ({
                  label: cat.name,
                  value: cat.id,
                })),
              ]}
            />
          </Space>

          <Table
            columns={columns}
            dataSource={filteredProducts}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} products`,
            }}
          />
        </Space>
      </Card>

      <Drawer
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        open={drawerVisible}
        onClose={handleCloseDrawer}
        width={720}
        extra={
          <Space>
            <Button onClick={handleCloseDrawer}>Cancel</Button>
            <Button type="primary" onClick={handleSave} loading={loading}>
              Save
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          {drawerTabs[0].children}
        </Form>
      </Drawer>
    </div>
  );
};

export default Products;
