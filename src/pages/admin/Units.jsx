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
  Row,
  Col,
  Alert,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { mockUnits, mockProducts } from '../../services/mockData';

const { Title, Text } = Typography;

const Units = () => {
  const [units, setUnits] = useState([...mockUnits]);
  const [filteredUnits, setFilteredUnits] = useState([...mockUnits]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form] = Form.useForm();

  // Search handler
  const handleSearch = (value) => {
    let filtered = units;

    // Filter by search text
    if (value) {
      filtered = filtered.filter(
        (unit) =>
          unit.name.toLowerCase().includes(value.toLowerCase()) ||
          unit.abbreviation.toLowerCase().includes(value.toLowerCase()) ||
          unit.barcode.includes(value)
      );
    }

    // Filter by product
    if (selectedProduct) {
      filtered = filtered.filter((unit) => unit.productId === selectedProduct);
    }

    setFilteredUnits(filtered);
  };

  // Product filter handler
  const handleProductFilter = (productId) => {
    setSelectedProduct(productId);
    let filtered = units;

    if (productId) {
      filtered = filtered.filter((unit) => unit.productId === productId);
    }

    setFilteredUnits(filtered);
  };

  // Open drawer for add/edit
  const handleOpenDrawer = (unit = null) => {
    setEditingUnit(unit);
    if (unit) {
      form.setFieldsValue({
        name: unit.name,
        abbreviation: unit.abbreviation,
        price: unit.price,
        barcode: unit.barcode,
        productId: unit.productId,
        isBaseUnit: unit.isBaseUnit,
        conversionRate: unit.conversionRate,
        isActive: unit.isActive,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        isActive: true,
        isBaseUnit: false,
        conversionRate: 1,
        price: 0,
      });
    }
    setDrawerVisible(true);
  };

  // Close drawer
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setEditingUnit(null);
    form.resetFields();
  };

  // Save unit
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (editingUnit) {
        // Update existing unit
        const updatedUnits = units.map((unit) =>
          unit.id === editingUnit.id
            ? {
                ...unit,
                ...values,
                productName: mockProducts.find((p) => p.id === values.productId)?.name || '',
                updatedAt: new Date().toISOString(),
              }
            : unit
        );
        setUnits(updatedUnits);
        setFilteredUnits(updatedUnits);
        message.success('Unit updated successfully!');
      } else {
        // Add new unit
        const newUnit = {
          id: Math.max(...units.map((u) => u.id)) + 1,
          ...values,
          productName: mockProducts.find((p) => p.id === values.productId)?.name || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const updatedUnits = [...units, newUnit];
        setUnits(updatedUnits);
        setFilteredUnits(updatedUnits);
        message.success('Unit created successfully!');
      }

      handleCloseDrawer();
    } catch {
      // Validation failed
    } finally {
      setLoading(false);
    }
  };

  // Delete unit
  const handleDelete = async (id) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const updatedUnits = units.filter((unit) => unit.id !== id);
      setUnits(updatedUnits);
      setFilteredUnits(updatedUnits);
      message.success('Unit deleted successfully!');
    } catch {
      message.error('Failed to delete unit');
    } finally {
      setLoading(false);
    }
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
      title: 'Unit Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <strong>{text}</strong>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.abbreviation}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      sorter: (a, b) => a.price - b.price,
      render: (price) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Barcode',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 150,
    },
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      width: 180,
      ellipsis: true,
    },
    {
      title: 'Conversion Rate',
      dataIndex: 'conversionRate',
      key: 'conversionRate',
      width: 150,
      sorter: (a, b) => a.conversionRate - b.conversionRate,
      render: (rate, record) => (
        <Space direction="vertical" size={0}>
          <strong>{rate}</strong>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.isBaseUnit ? 'Base Unit' : `${rate} base units`}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'isBaseUnit',
      key: 'isBaseUnit',
      width: 120,
      filters: [
        { text: 'Base Unit', value: true },
        { text: 'Derived Unit', value: false },
      ],
      onFilter: (value, record) => record.isBaseUnit === value,
      render: (isBaseUnit) => (
        <Tag color={isBaseUnit ? 'blue' : 'default'}>
          {isBaseUnit ? 'BASE' : 'DERIVED'}
        </Tag>
      ),
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
            title="Delete Unit"
            description="Are you sure you want to delete this unit?"
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
              Unit Management
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenDrawer()}
            >
              Add Unit
            </Button>
          </div>

          <Alert
            message="Unit Management"
            description="Define measurement units with pricing and barcodes. Base units are fundamental units, while derived units are multiples of base units (e.g., 1 Box = 12 Pieces)."
            type="info"
            showIcon
            closable
          />

          <Space size="middle" style={{ width: '100%', flexWrap: 'wrap' }}>
            <Input
              placeholder="Search units by name, abbreviation, or barcode..."
              prefix={<SearchOutlined />}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
              style={{ width: 400 }}
            />
            <Select
              placeholder="Filter by product"
              style={{ width: 250 }}
              allowClear
              onChange={handleProductFilter}
              options={[
                { label: 'All Products', value: null },
                ...mockProducts.map((prod) => ({
                  label: prod.name,
                  value: prod.id,
                })),
              ]}
            />
          </Space>

          <Table
            columns={columns}
            dataSource={filteredUnits}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} units`,
            }}
          />
        </Space>
      </Card>

      <Drawer
        title={editingUnit ? 'Edit Unit' : 'Add New Unit'}
        open={drawerVisible}
        onClose={handleCloseDrawer}
        width={600}
        extra={
          <Space>
            <Button onClick={handleCloseDrawer}>Cancel</Button>
            <Button type="primary" onClick={handleSave} loading={loading}>
              {editingUnit ? 'Update' : 'Create'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Alert
            message="Unit Information"
            description="Define the unit name and its conversion rate relative to the base unit. For example, if 1 Box = 12 Pieces, the conversion rate is 12."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Unit Name"
                rules={[{ required: true, message: 'Please enter unit name' }]}
              >
                <Input placeholder="e.g., Box, Bottle, Carton" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="abbreviation"
                label="Abbreviation"
                rules={[{ required: true, message: 'Please enter abbreviation' }]}
              >
                <Input placeholder="e.g., box, btl, ctn" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Price"
                rules={[
                  { required: true, message: 'Please enter price' },
                  { type: 'number', min: 0, message: 'Price must be positive' },
                ]}
              >
                <InputNumber
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  prefix="$"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="barcode"
                label="Barcode"
                rules={[{ required: true, message: 'Please enter barcode' }]}
              >
                <Input placeholder="1234567890123" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="productId"
            label="Product"
            rules={[{ required: true, message: 'Please select product' }]}
          >
            <Select
              placeholder="Select product"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={mockProducts.map((prod) => ({
                label: prod.name,
                value: prod.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="conversionRate"
            label="Conversion Rate (to Base Unit)"
            rules={[
              { required: true, message: 'Please enter conversion rate' },
              { type: 'number', min: 1, message: 'Rate must be at least 1' },
            ]}
            tooltip="How many base units equal one of this unit? For base units, use 1."
          >
            <InputNumber
              placeholder="e.g., 12"
              min={1}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="isBaseUnit"
            label="Base Unit"
            valuePropName="checked"
            tooltip="Base units are the fundamental units (e.g., Piece). There should typically be only one base unit."
          >
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>

          <Form.Item name="isActive" label="Active Status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default Units;
