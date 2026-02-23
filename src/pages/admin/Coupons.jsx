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
  DatePicker,
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
import dayjs from 'dayjs';
import couponService from '../../services/couponService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedDiscountType, setSelectedDiscountType] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [form] = Form.useForm();

  // Discount type options
  const discountTypeOptions = [
    { value: 'percent', label: 'Phần trăm (%)', color: 'blue' },
    { value: 'fixed_amount', label: 'Số tiền cố định', color: 'green' },
  ];

  // Status options
  const statusOptions = [
    { value: 'active', label: 'Hoạt động', color: 'green' },
    { value: 'disabled', label: 'Vô hiệu', color: 'red' },
  ];

  useEffect(() => {
    fetchCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCoupons = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: params.page || pagination.current,
        limit: params.limit || pagination.pageSize,
        ...params,
      };

      // Remove undefined params
      Object.keys(queryParams).forEach((key) => {
        if (queryParams[key] === undefined || queryParams[key] === null || queryParams[key] === '') {
          delete queryParams[key];
        }
      });

      const response = await couponService.getAll(queryParams);
      setCoupons(response.data || []);
      setPagination((prev) => ({
        ...prev,
        current: response.pagination?.page || prev.current,
        pageSize: response.pagination?.limit || prev.pageSize,
        total: response.pagination?.total || 0,
      }));
    } catch (error) {
      message.error(error.message || 'Không thể tải danh sách coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    const params = { page: 1 };
    if (value) params.code = value;
    if (selectedStatus) params.status = selectedStatus;
    if (selectedDiscountType) params.discount_type = selectedDiscountType;
    fetchCoupons(params);
  };

  const handleDiscountTypeFilter = (type) => {
    setSelectedDiscountType(type);
    const params = { page: 1 };
    if (searchText) params.code = searchText;
    if (selectedStatus) params.status = selectedStatus;
    if (type) params.discount_type = type;
    fetchCoupons(params);
  };

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    const params = { page: 1 };
    if (searchText) params.code = searchText;
    if (status) params.status = status;
    if (selectedDiscountType) params.discount_type = selectedDiscountType;
    fetchCoupons(params);
  };

  const getCurrentFilterParams = () => {
    const params = {};
    if (searchText) params.code = searchText;
    if (selectedStatus) params.status = selectedStatus;
    if (selectedDiscountType) params.discount_type = selectedDiscountType;
    return params;
  };

  const handleTableChange = (paginationConfig) => {
    const params = {
      page: paginationConfig.current,
      limit: paginationConfig.pageSize,
    };
    if (searchText) params.code = searchText;
    if (selectedStatus) params.status = selectedStatus;
    if (selectedDiscountType) params.discount_type = selectedDiscountType;
    fetchCoupons(params);
  };

  const openDrawer = (coupon = null) => {
    setEditingCoupon(coupon);
    if (coupon) {
      form.setFieldsValue({
        ...coupon,
        date_range: coupon.start_date && coupon.end_date
          ? [dayjs(coupon.start_date), dayjs(coupon.end_date)]
          : undefined,
        is_active: coupon.status === 'active',
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        discount_type: 'percent',
        is_active: true,
      });
    }
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setEditingCoupon(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const payload = {
        code: values.code,
        description: values.description,
        discount_type: values.discount_type,
        discount_value: values.discount_value,
        min_order_value: values.min_order_value || 0,
        max_discount_amount: values.max_discount_amount || 0,
        quantity_limit: values.quantity_limit,
        points_required: values.points_required || 0,
        status: values.is_active ? 'active' : 'disabled',
      };

      if (values.date_range && values.date_range[0]) {
        payload.start_date = values.date_range[0].toISOString();
      }
      if (values.date_range && values.date_range[1]) {
        payload.end_date = values.date_range[1].toISOString();
      }

      if (editingCoupon) {
        await couponService.update(editingCoupon._id, payload);
        message.success('Cập nhật coupon thành công');
      } else {
        await couponService.create(payload);
        message.success('Tạo coupon thành công');
      }

      closeDrawer();
      fetchCoupons(getCurrentFilterParams());
    } catch (error) {
      if (error.errorFields) {
        return; // Form validation error
      }
      message.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id) => {
    try {
      await couponService.delete(id);
      message.success('Xóa coupon thành công');
      fetchCoupons(getCurrentFilterParams());
    } catch (error) {
      message.error(error.message || 'Không thể xóa coupon');
    }
  };

  const getDiscountDisplay = (record) => {
    if (record.discount_type === 'percent') {
      return `${record.discount_value}%`;
    }
    return `${record.discount_value?.toLocaleString('vi-VN')} đ`;
  };

  const columns = [
    {
      title: 'Mã Coupon',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (text) => <Text strong copyable>{text}</Text>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Loại giảm giá',
      dataIndex: 'discount_type',
      key: 'discount_type',
      width: 130,
      render: (type) => {
        const typeInfo = discountTypeOptions.find((t) => t.value === type);
        return typeInfo ? <Tag color={typeInfo.color}>{typeInfo.label}</Tag> : type;
      },
    },
    {
      title: 'Giá trị',
      key: 'discount_value',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <Text strong type="success">
          {getDiscountDisplay(record)}
        </Text>
      ),
    },
    {
      title: 'Đơn tối thiểu',
      dataIndex: 'min_order_value',
      key: 'min_order_value',
      width: 130,
      align: 'right',
      render: (value) => (value ? `${value?.toLocaleString('vi-VN')} đ` : '-'),
    },
    {
      title: 'Giảm tối đa',
      dataIndex: 'max_discount_amount',
      key: 'max_discount_amount',
      width: 130,
      align: 'right',
      render: (value) => (value ? `${value?.toLocaleString('vi-VN')} đ` : '-'),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity_limit',
      key: 'quantity_limit',
      width: 100,
      align: 'center',
      render: (qty) => qty || 'Không giới hạn',
    },
    {
      title: 'Thời gian',
      key: 'date_range',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 12 }}>
            Từ: {record.start_date ? dayjs(record.start_date).format('DD/MM/YYYY') : 'N/A'}
          </Text>
          <Text style={{ fontSize: 12 }}>
            Đến: {record.end_date ? dayjs(record.end_date).format('DD/MM/YYYY') : 'N/A'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusInfo = statusOptions.find((s) => s.value === status);
        return statusInfo ? <Tag color={statusInfo.color}>{statusInfo.label}</Tag> : status;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openDrawer(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Bạn có chắc muốn xóa coupon này?"
              onConfirm={() => handleDelete(record._id)}
              okText="Có"
              cancelText="Không"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
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
              Quản lý Coupon
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openDrawer()}
            >
              Thêm Coupon
            </Button>
          </div>

          <Space size="middle" style={{ width: '100%', flexWrap: 'wrap' }}>
            <Input
              placeholder="Tìm mã coupon..."
              prefix={<SearchOutlined />}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
              style={{ width: 300 }}
            />
            <Select
              placeholder="Loại giảm giá"
              style={{ width: 180 }}
              value={selectedDiscountType}
              onChange={handleDiscountTypeFilter}
              allowClear
              options={[
                { label: 'Tất cả loại', value: null },
                ...discountTypeOptions.map((opt) => ({
                  label: opt.label,
                  value: opt.value,
                })),
              ]}
            />
            <Select
              placeholder="Trạng thái"
              style={{ width: 150 }}
              value={selectedStatus}
              onChange={handleStatusFilter}
              allowClear
              options={[
                { label: 'Tất cả trạng thái', value: null },
                ...statusOptions.map((opt) => ({
                  label: opt.label,
                  value: opt.value,
                })),
              ]}
            />
          </Space>

          <Table
            columns={columns}
            dataSource={coupons}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => `Tổng ${total} coupon`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1400 }}
          />
        </Space>
      </Card>

      {/* Drawer */}
      <Drawer
        title={editingCoupon ? 'Chỉnh sửa Coupon' : 'Thêm Coupon mới'}
        width={500}
        open={drawerVisible}
        onClose={closeDrawer}
        extra={
          <Space>
            <Button onClick={closeDrawer}>Hủy</Button>
            <Button type="primary" onClick={handleSubmit}>
              {editingCoupon ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="Mã Coupon"
            rules={[
              { required: true, message: 'Vui lòng nhập mã coupon' },
              { max: 50, message: 'Mã coupon tối đa 50 ký tự' },
            ]}
          >
            <Input placeholder="VD: SUMMER2026" style={{ textTransform: 'uppercase' }} />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ max: 255, message: 'Mô tả tối đa 255 ký tự' }]}
          >
            <TextArea rows={2} placeholder="Mô tả khuyến mãi..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="discount_type"
                label="Loại giảm giá"
                rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
              >
                <Select>
                  {discountTypeOptions.map((opt) => (
                    <Select.Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="discount_value"
                label="Giá trị giảm"
                rules={[
                  { required: true, message: 'Vui lòng nhập giá trị' },
                  { type: 'number', min: 0, message: 'Giá trị phải >= 0' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="VD: 20"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="min_order_value"
                label="Giá trị đơn tối thiểu"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="VD: 100000"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="đ"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="max_discount_amount"
                label="Giảm tối đa"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="VD: 50000"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="đ"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="date_range"
            label="Thời gian áp dụng"
          >
            <RangePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="quantity_limit"
                label="Số lượng giới hạn"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Để trống = không giới hạn"
                  min={1}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="points_required"
                label="Điểm yêu cầu"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="VD: 100"
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="is_active"
            label="Trạng thái"
            valuePropName="checked"
          >
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Vô hiệu" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default Coupons;
