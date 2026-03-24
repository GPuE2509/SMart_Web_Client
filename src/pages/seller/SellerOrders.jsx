import { useState, useEffect, useRef } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Input,
  Modal,
  Select,
  message,
  Tag,
  Typography,
  Row,
  Col,
  DatePicker,
  Statistic,
  InputNumber,
  Descriptions,
  Divider,
  Badge,
  Tooltip,
  Image,
} from 'antd';
import {
  ShoppingCartOutlined,
  SearchOutlined,
  FilterOutlined,
  BarcodeOutlined,
  EyeOutlined,
  ReloadOutlined,
  UserOutlined,
  PhoneOutlined,
  CalendarOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import sellerOrderService from '../../services/sellerOrderService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filter states
  const [orderCode, setOrderCode] = useState('');
  const [phone, setPhone] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [minAmount, setMinAmount] = useState(null);
  const [maxAmount, setMaxAmount] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [orderType, setOrderType] = useState(null);
  const [barcode, setBarcode] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal states
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Barcode input ref
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, pageSize]);

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const options = {
        page: currentPage,
        limit: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (orderCode) options.order_code = orderCode;
      if (phone) options.phone = phone;
      if (dateRange && dateRange.length === 2) {
        options.start_date = dateRange[0].format('YYYY-MM-DD');
        options.end_date = dateRange[1].format('YYYY-MM-DD');
      }
      if (minAmount) options.min_amount = minAmount;
      if (maxAmount) options.max_amount = maxAmount;
      if (orderStatus) options.order_status = orderStatus;
      if (paymentStatus) options.payment_status = paymentStatus;
      if (orderType) options.order_type = orderType;
      if (barcode) options.barcode = barcode;

      const result = await sellerOrderService.getOrderList(options);
      setOrders(result.orders || []);
      setTotalRecords(result.pagination?.total || 0);
    } catch (error) {
      message.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const startDate = dayjs().startOf('month').format('YYYY-MM-DD');
      const endDate = dayjs().endOf('month').format('YYYY-MM-DD');
      const result = await sellerOrderService.getOrderStats(startDate, endDate);
      // Map backend field names to frontend expected names
      const statsData = result.stats || {};
      setStats({
        ...statsData,
        total_revenue: statsData.total_amount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Handle search/filter
  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchOrders();
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setOrderCode('');
    setPhone('');
    setDateRange(null);
    setMinAmount(null);
    setMaxAmount(null);
    setOrderStatus(null);
    setPaymentStatus(null);
    setOrderType(null);
    setBarcode('');
    setCurrentPage(1);
    setTimeout(() => {
      fetchOrders();
    }, 100);
  };

  // Handle pagination change
  const handleTableChange = (pagination, filters, sorter) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);

    if (sorter.field) {
      setSortBy(sorter.field);
      setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
    }
  };

  // View order detail
  const handleViewDetail = async (orderId) => {
    try {
      const result = await sellerOrderService.getOrderDetail(orderId);
      setSelectedOrder(result.order);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('Không thể tải chi tiết đơn hàng');
    }
  };

  // Handle barcode scan
  const handleBarcodeSearch = async () => {
    if (!barcode.trim()) {
      message.warning('Vui lòng nhập mã barcode');
      return;
    }

    try {
      const result = await sellerOrderService.searchByBarcode(barcode.trim());
      setOrders(result.orders || []);
      setTotalRecords(result.pagination?.total || 0);
      setBarcodeModalVisible(false);
      message.success(`Tìm thấy ${result.pagination?.total || 0} đơn hàng`);
    } catch (error) {
      message.error('Không tìm thấy đơn hàng với barcode này');
    }
  };

  // Open barcode modal
  const handleOpenBarcodeModal = () => {
    setBarcode('');
    setBarcodeModalVisible(true);
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value || 0);
  };

  // Order status config
  const orderStatusConfig = {
    pending: { color: 'gold', text: 'Chờ xử lý' },
    processing: { color: 'processing', text: 'Đang xử lý' },
    completed: { color: 'success', text: 'Hoàn thành' },
    cancelled: { color: 'error', text: 'Đã hủy' },
    returned: { color: 'default', text: 'Trả hàng' },
  };

  // Payment status config
  const paymentStatusConfig = {
    unpaid: { color: 'warning', text: 'Chưa TT' },
    paid: { color: 'success', text: 'Đã TT' },
    refunded: { color: 'default', text: 'Hoàn tiền' },
  };

  // Table columns
  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'order_code',
      key: 'order_code',
      render: (code) => <Text strong>{code}</Text>,
      sorter: true,
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: '600' }}>
            <UserOutlined style={{ marginRight: 4 }} />
            {record.customer_name || record.customer?.full_name || 'Khách vãng lai'}
          </div>
          {(record.customer_phone || record.customer?.phone) && (
            <div style={{ color: '#6b7280', fontSize: '12px' }}>
              <PhoneOutlined style={{ marginRight: 4 }} />
              {record.customer_phone || record.customer?.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Loại đơn',
      dataIndex: 'order_type',
      key: 'order_type',
      render: (type) => (
        <Tag color={type === 'pos' ? 'blue' : 'purple'}>
          {type === 'pos' ? 'Tại cửa hàng' : 'Online'}
        </Tag>
      ),
    },
    {
      title: 'Sản phẩm',
      key: 'items',
      render: (_, record) => (
        <Text>{record.order_details?.length || record.items?.length || 0} sản phẩm</Text>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'final_amount',
      key: 'final_amount',
      align: 'right',
      render: (amount) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatCurrency(amount)}
        </Text>
      ),
      sorter: true,
    },
    {
      title: 'Trạng thái ĐH',
      dataIndex: 'order_status',
      key: 'order_status',
      render: (status) => {
        const config = orderStatusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Thanh toán',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status) => {
        const config = paymentStatusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => (
        <div>
          <CalendarOutlined style={{ marginRight: 4 }} />
          {dayjs(date).format('DD/MM/YYYY HH:mm')}
        </div>
      ),
      sorter: true,
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Tooltip title="Xem chi tiết">
          <Button
            type="primary"
            ghost
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record._id)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <ShoppingCartOutlined style={{ marginRight: 8 }} />
        Quản lý đơn hàng
      </Title>

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng đơn hàng (tháng)"
              value={stats.total_orders || 0}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đơn hoàn thành"
              value={stats.completed_orders || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đơn chờ xử lý"
              value={stats.pending_orders || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Doanh thu (tháng)"
              value={stats.total_revenue || 0}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={4}>
            <Input
              placeholder="Mã đơn hàng"
              prefix={<SearchOutlined />}
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Input
              placeholder="Số điện thoại"
              prefix={<PhoneOutlined />}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={5}>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={3}>
            <InputNumber
              placeholder="Từ giá trị"
              value={minAmount}
              onChange={setMinAmount}
              style={{ width: '100%' }}
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Col>
          <Col span={3}>
            <InputNumber
              placeholder="Đến giá trị"
              value={maxAmount}
              onChange={setMaxAmount}
              style={{ width: '100%' }}
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Col>
          <Col span={3}>
            <Select
              placeholder="Trạng thái ĐH"
              value={orderStatus}
              onChange={setOrderStatus}
              style={{ width: '100%' }}
              allowClear
            >
              <Select.Option value="pending">Chờ xử lý</Select.Option>
              <Select.Option value="processing">Đang xử lý</Select.Option>
              <Select.Option value="completed">Hoàn thành</Select.Option>
              <Select.Option value="cancelled">Đã hủy</Select.Option>
              <Select.Option value="returned">Trả hàng</Select.Option>
            </Select>
          </Col>
          <Col span={2}>
            <Select
              placeholder="Thanh toán"
              value={paymentStatus}
              onChange={setPaymentStatus}
              style={{ width: '100%' }}
              allowClear
            >
              <Select.Option value="unpaid">Chưa TT</Select.Option>
              <Select.Option value="paid">Đã TT</Select.Option>
              <Select.Option value="refunded">Hoàn tiền</Select.Option>
            </Select>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: '16px' }} align="middle">
          <Col span={3}>
            <Select
              placeholder="Loại đơn"
              value={orderType}
              onChange={setOrderType}
              style={{ width: '100%' }}
              allowClear
            >
              <Select.Option value="pos">Tại cửa hàng</Select.Option>
              <Select.Option value="online">Online</Select.Option>
            </Select>
          </Col>
          <Col flex="auto" />
          <Col>
            <Space>
              <Button
                icon={<BarcodeOutlined />}
                onClick={handleOpenBarcodeModal}
              >
                Quét barcode
              </Button>
              <Button type="primary" icon={<FilterOutlined />} onClick={handleApplyFilters}>
                Lọc
              </Button>
              <Button onClick={handleResetFilters}>
                Đặt lại
              </Button>
              <Button icon={<ReloadOutlined />} onClick={fetchOrders}>
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Orders Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          loading={loading}
          rowKey="_id"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalRecords,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} đơn hàng`,
            pageSizeOptions: ['10', '20', '50'],
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Barcode Modal */}
      <Modal
        title={
          <span>
            <BarcodeOutlined style={{ marginRight: 8 }} />
            Tìm kiếm bằng barcode
          </span>
        }
        open={barcodeModalVisible}
        onCancel={() => setBarcodeModalVisible(false)}
        onOk={handleBarcodeSearch}
        okText="Tìm kiếm"
        cancelText="Hủy"
      >
        <Input
          ref={barcodeInputRef}
          placeholder="Quét hoặc nhập mã barcode sản phẩm..."
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onPressEnter={handleBarcodeSearch}
          prefix={<BarcodeOutlined />}
          size="large"
          autoFocus
        />
        <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
          Nhập mã barcode sản phẩm để tìm các đơn hàng chứa sản phẩm đó
        </Text>
      </Modal>

      {/* Order Detail Modal */}
      <Modal
        title={
          <span>
            <ShoppingCartOutlined style={{ marginRight: 8 }} />
            Chi tiết đơn hàng - {selectedOrder?.order_code}
          </span>
        }
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedOrder(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {selectedOrder && (
          <>
            {/* Order Info */}
            <Descriptions bordered column={2} size="small" style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="Mã đơn">
                <Text strong>{selectedOrder.order_code}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Loại đơn">
                <Tag color={selectedOrder.order_type === 'pos' ? 'blue' : 'purple'}>
                  {selectedOrder.order_type === 'pos' ? 'Tại cửa hàng' : 'Online'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Khách hàng">
                {selectedOrder.customer_name || selectedOrder.user_id?.full_name || selectedOrder.customer?.full_name || 'Khách vãng lai'}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {selectedOrder.customer_phone || selectedOrder.user_id?.phone || selectedOrder.customer?.phone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái đơn">
                <Tag color={orderStatusConfig[selectedOrder.order_status]?.color}>
                  {orderStatusConfig[selectedOrder.order_status]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Thanh toán">
                <Tag color={paymentStatusConfig[selectedOrder.payment_status]?.color}>
                  {paymentStatusConfig[selectedOrder.payment_status]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Phương thức TT">
                {selectedOrder.payment_method === 'cash' ? 'Tiền mặt' :
                 selectedOrder.payment_method === 'bank_transfer' ? 'Chuyển khoản' :
                 selectedOrder.payment_method === 'payos' ? 'PayOS' : selectedOrder.payment_method}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {dayjs(selectedOrder.created_at).format('DD/MM/YYYY HH:mm:ss')}
              </Descriptions.Item>
              {selectedOrder.note && (
                <Descriptions.Item label="Ghi chú" span={2}>
                  {selectedOrder.note}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Order Items */}
            <Divider>Sản phẩm</Divider>
            <Table
              dataSource={selectedOrder.order_details || selectedOrder.items || []}
              rowKey={(record, index) => record._id || record.product_unit_id?._id || index}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Sản phẩm',
                  key: 'product',
                  render: (_, record) => {
                    // Handle both structures: product_unit_id.product_id or product_id
                    const productUnit = record.product_unit_id;
                    const product = productUnit?.product_id || record.product_id;
                    const unit = productUnit?.unit_id;
                    const imageUrl = product?.image_url;
                    const productName = product?.product_name || product?.name || 'N/A';
                    const barcode = productUnit?.barcode || product?.barcode;
                    const unitName = unit?.unit_name;

                    return (
                      <Space>
                        {imageUrl && (
                          <Image
                            src={imageUrl}
                            alt={productName}
                            width={50}
                            height={50}
                            style={{ objectFit: 'cover', borderRadius: '4px' }}
                            placeholder
                          />
                        )}
                        <div>
                          <Text strong>{productName}</Text>
                          {unitName && (
                            <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: 4 }}>
                              ({unitName})
                            </span>
                          )}
                          {barcode && (
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              <BarcodeOutlined /> {barcode}
                            </div>
                          )}
                        </div>
                      </Space>
                    );
                  },
                },
                {
                  title: 'Đơn giá',
                  key: 'unit_price',
                  render: (_, record) => formatCurrency(record.unit_price || record.product_unit_id?.price),
                },
                {
                  title: 'SL',
                  dataIndex: 'quantity',
                  align: 'center',
                },
                {
                  title: 'Thành tiền',
                  key: 'total_price',
                  align: 'right',
                  render: (_, record) => formatCurrency(record.total_price || (record.quantity * (record.unit_price || record.product_unit_id?.price))),
                },
              ]}
            />

            {/* Order Summary */}
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <Row justify="end">
                <Col span={8}>
                  <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text>Tạm tính:</Text>
                      <Text>{formatCurrency(selectedOrder.subtotal || selectedOrder.total_amount)}</Text>
                    </Space>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Text>Giảm giá:</Text>
                        <Text type="danger">-{formatCurrency(selectedOrder.discount_amount)}</Text>
                      </Space>
                    </div>
                  )}
                  <div style={{ padding: '8px 0' }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text strong style={{ fontSize: '16px' }}>Tổng cộng:</Text>
                      <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
                        {formatCurrency(selectedOrder.final_amount)}
                      </Text>
                    </Space>
                  </div>
                </Col>
              </Row>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

export default SellerOrders;
