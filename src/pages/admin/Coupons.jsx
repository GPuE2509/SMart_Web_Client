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
  Tag,
  Typography,
  InputNumber,
  DatePicker,
  Popconfirm,
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
  PercentageOutlined,
  DollarOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { mockCoupons } from '../../services/mockData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const Coupons = () => {
  const [coupons, setCoupons] = useState([...mockCoupons]);
  const [filteredCoupons, setFilteredCoupons] = useState([...mockCoupons]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form] = Form.useForm();

  // Search handler
  const handleSearch = (value) => {
    const filtered = coupons.filter(
      (coupon) =>
        coupon.code.toLowerCase().includes(value.toLowerCase()) ||
        coupon.name.toLowerCase().includes(value.toLowerCase()) ||
        coupon.description.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCoupons(filtered);
  };

  // Get status color
  const getStatusColor = (isActive, startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!isActive) return 'red';
    if (now < start) return 'orange';
    if (now > end) return 'gray';
    return 'green';
  };

  // Get status text
  const getStatusText = (isActive, startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!isActive) return 'DISABLED';
    if (now < start) return 'SCHEDULED';
    if (now > end) return 'EXPIRED';
    return 'ACTIVE';
  };

  // Format date for display
  const formatDate = (dateString) => {
    return dayjs(dateString).format('MMM DD, YYYY');
  };

  // Open drawer for add/edit
  const handleOpenDrawer = (coupon = null) => {
    setEditingCoupon(coupon);
    if (coupon) {
      form.setFieldsValue({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue,
        maxDiscountAmount: coupon.maxDiscountAmount,
        usageLimit: coupon.usageLimit,
        perUserLimit: coupon.perUserLimit,
        pointsRequired: coupon.pointsRequired,
        dateRange: [dayjs(coupon.startDate), dayjs(coupon.endDate)],
        isActive: coupon.isActive,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        discountType: 'percentage',
        isActive: true,
      });
    }
    setDrawerVisible(true);
  };

  // Close drawer
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setEditingCoupon(null);
    form.resetFields();
  };

  // Validate discount value based on type
  const validateDiscountValue = (_, value) => {
    const discountType = form.getFieldValue('discountType');
    
    if (!value) {
      return Promise.reject(new Error('Please enter discount value'));
    }

    if (discountType === 'percentage') {
      if (value <= 0 || value > 100) {
        return Promise.reject(new Error('Percentage must be between 1 and 100'));
      }
    } else if (discountType === 'fixed') {
      if (value <= 0) {
        return Promise.reject(new Error('Fixed amount must be greater than 0'));
      }
    }

    return Promise.resolve();
  };

  // Save coupon
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      const [startDate, endDate] = values.dateRange;
      const couponData = {
        code: values.code.toUpperCase(),
        name: values.name,
        description: values.description,
        discountType: values.discountType,
        discountValue: values.discountValue,
        minOrderValue: values.minOrderValue || null,
        maxDiscountAmount: values.maxDiscountAmount || null,
        usageLimit: values.usageLimit || null,
        perUserLimit: values.perUserLimit || null,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isActive: values.isActive ?? true,
      };

      if (editingCoupon) {
        // Update existing coupon
        const updatedCoupons = coupons.map((coupon) =>
          coupon.id === editingCoupon.id
            ? {
                ...coupon,
                ...couponData,
                updatedAt: new Date().toISOString(),
              }
            : coupon
        );
        setCoupons(updatedCoupons);
        setFilteredCoupons(updatedCoupons);
        message.success('Coupon updated successfully!');
      } else {
        // Add new coupon
        const newCoupon = {
          id: Math.max(...coupons.map((c) => c.id)) + 1,
          ...couponData,
          usedCount: 0,
          applicableCategories: [],
          applicableProducts: [],
          createdBy: 1,
          createdByName: 'Current Admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const updatedCoupons = [...coupons, newCoupon];
        setCoupons(updatedCoupons);
        setFilteredCoupons(updatedCoupons);
        message.success('Coupon created successfully!');
      }

      handleCloseDrawer();
    } catch {
      // Validation failed
    } finally {
      setLoading(false);
    }
  };

  // Toggle coupon status
  const handleToggleStatus = async (couponId) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const updatedCoupons = coupons.map((coupon) =>
        coupon.id === couponId
          ? {
              ...coupon,
              isActive: !coupon.isActive,
              updatedAt: new Date().toISOString(),
            }
          : coupon
      );

      setCoupons(updatedCoupons);
      setFilteredCoupons(updatedCoupons);

      const coupon = coupons.find((c) => c.id === couponId);
      message.success(
        `Coupon ${coupon.isActive ? 'disabled' : 'enabled'} successfully!`
      );
    } catch {
      message.error('Failed to update coupon status');
    } finally {
      setLoading(false);
    }
  };

  // Delete coupon
  const handleDelete = async (id) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const updatedCoupons = coupons.filter((coupon) => coupon.id !== id);
      setCoupons(updatedCoupons);
      setFilteredCoupons(updatedCoupons);
      message.success('Coupon deleted successfully!');
    } catch {
      message.error('Failed to delete coupon');
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
      width: 60,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      sorter: (a, b) => a.code.localeCompare(b.code),
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <strong style={{ fontSize: '14px', color: '#1890ff' }}>{text}</strong>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.name}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Points',
      dataIndex: 'pointsRequired',
      key: 'pointsRequired',
      width: 100,
      sorter: (a, b) => (a.pointsRequired || 0) - (b.pointsRequired || 0),
      render: (points) => (
        <Tag color={points ? 'purple' : 'default'}>
          {points ? `${points} pts` : 'No Points'}
        </Tag>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'discountType',
      key: 'discountType',
      width: 120,
      filters: [
        { text: 'Percentage', value: 'percentage' },
        { text: 'Fixed', value: 'fixed' },
      ],
      onFilter: (value, record) => record.discountType === value,
      render: (type) => (
        <Tag
          icon={type === 'percentage' ? <PercentageOutlined /> : <DollarOutlined />}
          color={type === 'percentage' ? 'blue' : 'green'}
        >
          {type === 'percentage' ? 'PERCENT' : 'FIXED'}
        </Tag>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'discountValue',
      key: 'discountValue',
      sorter: (a, b) => a.discountValue - b.discountValue,
      render: (value, record) => (
        <strong>
          {record.discountType === 'percentage' ? `${value}%` : `$${value}`}
        </strong>
      ),
    },
    {
      title: 'Valid Period',
      key: 'validPeriod',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '12px' }}>
            From: {formatDate(record.startDate)}
          </Text>
          <Text style={{ fontSize: '12px' }}>
            To: {formatDate(record.endDate)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>
            {record.usedCount} / {record.usageLimit || '∞'}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Per user: {record.perUserLimit || '∞'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Disabled', value: 'disabled' },
        { text: 'Expired', value: 'expired' },
      ],
      onFilter: (value, record) => {
        const status = getStatusText(record.isActive, record.startDate, record.endDate);
        return status.toLowerCase() === value;
      },
      render: (_, record) => (
        <Tag color={getStatusColor(record.isActive, record.startDate, record.endDate)}>
          {getStatusText(record.isActive, record.startDate, record.endDate)}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
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
            title={`${record.isActive ? 'Disable' : 'Enable'} Coupon`}
            description={`Are you sure you want to ${
              record.isActive ? 'disable' : 'enable'
            } this coupon?`}
            onConfirm={() => handleToggleStatus(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title={record.isActive ? 'Disable' : 'Enable'}>
              <Button 
                type="link"
                icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />}
              />
            </Tooltip>
          </Popconfirm>
          <Popconfirm
            title="Delete Coupon"
            description="Are you sure you want to delete this coupon?"
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
              Coupon Management
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenDrawer()}
            >
              Add Coupon
            </Button>
          </div>

          <Input
            placeholder="Search coupons by code, name, or description..."
            prefix={<SearchOutlined />}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
            style={{ maxWidth: 400 }}
          />

          <Table
            columns={columns}
            dataSource={filteredCoupons}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} coupons`,
            }}
          />
        </Space>
      </Card>

      {/* Add/Edit Coupon Drawer */}
      <Drawer
        title={editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
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
          <Alert
            message="Coupon Information"
            description="Create discount coupons for your customers. Set validity period, usage limits, and conditions."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Coupon Code"
                rules={[
                  { required: true, message: 'Please enter coupon code' },
                  { pattern: /^[A-Z0-9]+$/, message: 'Only uppercase letters and numbers' },
                ]}
              >
                <Input
                  placeholder="e.g., SAVE50, NEWYEAR2026"
                  style={{ textTransform: 'uppercase' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="discountType"
                label="Discount Type"
                rules={[{ required: true, message: 'Please select discount type' }]}
              >
                <Select
                  placeholder="Select type"
                  onChange={() => {
                    // Reset discount value when type changes
                    form.setFieldsValue({ discountValue: undefined });
                  }}
                  options={[
                    { label: 'Percentage', value: 'percentage' },
                    { label: 'Fixed Amount', value: 'fixed' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="name"
            label="Coupon Name"
            rules={[{ required: true, message: 'Please enter coupon name' }]}
          >
            <Input placeholder="e.g., New Year Sale, Welcome Discount" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={3} placeholder="Describe the coupon offer..." />
          </Form.Item>

          <Form.Item dependencies={['discountType']}>
            {({ getFieldValue }) => {
              const discountType = getFieldValue('discountType');
              return (
                <Form.Item
                  name="discountValue"
                  label={`Discount Value ${discountType === 'percentage' ? '(%)' : '($)'}`}
                  rules={[{ validator: validateDiscountValue }]}
                >
                  <InputNumber
                    placeholder={
                      discountType === 'percentage' ? '1-100' : 'Enter amount'
                    }
                    min={0}
                    max={discountType === 'percentage' ? 100 : undefined}
                    step={discountType === 'percentage' ? 1 : 0.01}
                    prefix={discountType === 'percentage' ? '%' : '$'}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Valid Period"
            rules={[{ required: true, message: 'Please select valid period' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              showTime
              format="YYYY-MM-DD HH:mm"
              placeholder={['Start Date', 'End Date']}
            />
          </Form.Item>

          <Form.Item
            name="pointsRequired"
            label="Points Required (Optional)"
            tooltip="Leave empty if coupon doesn't require points"
          >
            <InputNumber
              placeholder="Enter points"
              min={0}
              step={10}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="minOrderValue" label="Minimum Order Value ($)">
                <InputNumber
                  placeholder="Optional minimum"
                  min={0}
                  step={0.01}
                  prefix="$"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxDiscountAmount"
                label="Maximum Discount Amount ($)"
                tooltip="For percentage coupons, cap the maximum discount"
              >
                <InputNumber
                  placeholder="Optional maximum"
                  min={0}
                  step={0.01}
                  prefix="$"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="usageLimit" label="Total Usage Limit">
                <InputNumber
                  placeholder="Leave empty for unlimited"
                  min={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="perUserLimit" label="Usage Limit Per User">
                <InputNumber
                  placeholder="Leave empty for unlimited"
                  min={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="isActive" label="Coupon Status" valuePropName="checked">
            <Switch
              checkedChildren="Enabled"
              unCheckedChildren="Disabled"
              defaultChecked
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default Coupons;
