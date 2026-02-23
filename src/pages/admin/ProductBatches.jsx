import { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Input,
  Select,
  message,
  Popconfirm,
  Tag,
  Typography,
  Modal,
  Form,
  DatePicker,
  Descriptions,
  Timeline,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  StopOutlined,
  SyncOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import productBatchService from '../../services/productBatchService';
import productService from '../../services/productService';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ProductBatches = () => {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [logsModalVisible, setLogsModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchLogs, setBatchLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  
  // Filters
  const [searchText, setSearchText] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [expiryDateRange, setExpiryDateRange] = useState(null);
  
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [rejectForm] = Form.useForm();
  const [statusForm] = Form.useForm();

  // Status options
  const statusOptions = [
    { value: 'instock', label: 'Còn hàng', color: 'green' },
    { value: 'outdate', label: 'Hết hạn', color: 'red' },
    { value: 'onsale', label: 'Đang bán', color: 'blue' },
    { value: 'sold', label: 'Đã bán hết', color: 'orange' },
    { value: 'rejected', label: 'Đã từ chối', color: 'default' },
  ];

  // Reason type labels
  const reasonTypeLabels = {
    sale: 'Bán hàng',
    import: 'Nhập kho',
    return: 'Trả hàng',
    damaged: 'Hư hỏng',
    expired_disposal: 'Xử lý hết hạn',
    rejection: 'Từ chối lô hàng',
  };

  useEffect(() => {
    fetchProducts();
    fetchBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll({ limit: 1000 });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchBatches = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: params.page || pagination.current,
        limit: params.limit || pagination.pageSize,
        ...params,
      };

      // Remove undefined params
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined || queryParams[key] === null || queryParams[key] === '') {
          delete queryParams[key];
        }
      });

      const response = await productBatchService.getAll(queryParams);
      setBatches(response.data || []);
      setPagination(prev => ({
        ...prev,
        current: response.pagination?.page || prev.current,
        pageSize: response.pagination?.limit || prev.pageSize,
        total: response.pagination?.total || 0,
      }));
    } catch (error) {
      message.error(error.message || 'Không thể tải danh sách lô hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    const params = { page: 1 };
    if (value) params.batch_code = value;
    if (selectedProduct) params.product_id = selectedProduct;
    if (selectedStatus) params.status = selectedStatus;
    if (expiryDateRange && expiryDateRange[0]) {
      params.expiry_date_from = expiryDateRange[0].format('YYYY-MM-DD');
    }
    if (expiryDateRange && expiryDateRange[1]) {
      params.expiry_date_to = expiryDateRange[1].format('YYYY-MM-DD');
    }
    fetchBatches(params);
  };

  const handleProductFilter = (productId) => {
    setSelectedProduct(productId);
    const params = { page: 1 };
    if (searchText) params.batch_code = searchText;
    if (productId) params.product_id = productId;
    if (selectedStatus) params.status = selectedStatus;
    if (expiryDateRange && expiryDateRange[0]) {
      params.expiry_date_from = expiryDateRange[0].format('YYYY-MM-DD');
    }
    if (expiryDateRange && expiryDateRange[1]) {
      params.expiry_date_to = expiryDateRange[1].format('YYYY-MM-DD');
    }
    fetchBatches(params);
  };

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    const params = { page: 1 };
    if (searchText) params.batch_code = searchText;
    if (selectedProduct) params.product_id = selectedProduct;
    if (status) params.status = status;
    if (expiryDateRange && expiryDateRange[0]) {
      params.expiry_date_from = expiryDateRange[0].format('YYYY-MM-DD');
    }
    if (expiryDateRange && expiryDateRange[1]) {
      params.expiry_date_to = expiryDateRange[1].format('YYYY-MM-DD');
    }
    fetchBatches(params);
  };

  const handleDateRangeFilter = (dateRange) => {
    setExpiryDateRange(dateRange);
    const params = { page: 1 };
    if (searchText) params.batch_code = searchText;
    if (selectedProduct) params.product_id = selectedProduct;
    if (selectedStatus) params.status = selectedStatus;
    if (dateRange && dateRange[0]) {
      params.expiry_date_from = dateRange[0].format('YYYY-MM-DD');
    }
    if (dateRange && dateRange[1]) {
      params.expiry_date_to = dateRange[1].format('YYYY-MM-DD');
    }
    fetchBatches(params);
  };

  const getCurrentFilterParams = () => {
    const params = {};
    if (searchText) params.batch_code = searchText;
    if (selectedProduct) params.product_id = selectedProduct;
    if (selectedStatus) params.status = selectedStatus;
    if (expiryDateRange && expiryDateRange[0]) {
      params.expiry_date_from = expiryDateRange[0].format('YYYY-MM-DD');
    }
    if (expiryDateRange && expiryDateRange[1]) {
      params.expiry_date_to = expiryDateRange[1].format('YYYY-MM-DD');
    }
    return params;
  };

  const handleTableChange = (paginationConfig) => {
    const params = {
      page: paginationConfig.current,
      limit: paginationConfig.pageSize,
    };
    if (searchText) params.batch_code = searchText;
    if (selectedProduct) params.product_id = selectedProduct;
    if (selectedStatus) params.status = selectedStatus;
    fetchBatches(params);
  };

  const handleViewDetail = async (batch) => {
    setSelectedBatch(batch);
    setDetailModalVisible(true);
  };

  const handleViewLogs = async (batch) => {
    setSelectedBatch(batch);
    setLogsLoading(true);
    setLogsModalVisible(true);
    try {
      const response = await productBatchService.getBatchLogs(batch._id);
      setBatchLogs(response.data || []);
    } catch {
      message.error('Không thể tải lịch sử kho');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleOpenStatusModal = (batch) => {
    setSelectedBatch(batch);
    statusForm.setFieldsValue({ status: batch.status });
    setStatusModalVisible(true);
  };

  const handleUpdateStatus = async () => {
    try {
      const values = await statusForm.validateFields();
      await productBatchService.updateStatus(selectedBatch._id, values.status);
      message.success('Cập nhật trạng thái thành công');
      setStatusModalVisible(false);
      statusForm.resetFields();
      fetchBatches(getCurrentFilterParams());
    } catch (error) {
      message.error(error.message || 'Không thể cập nhật trạng thái');
    }
  };

  const handleOpenRejectModal = (batch) => {
    setSelectedBatch(batch);
    setRejectModalVisible(true);
  };

  const handleRejectBatch = async () => {
    try {
      const values = await rejectForm.validateFields();
      await productBatchService.rejectBatch(selectedBatch._id, values.note);
      message.success('Từ chối lô hàng thành công');
      setRejectModalVisible(false);
      rejectForm.resetFields();
      fetchBatches(getCurrentFilterParams());
    } catch (error) {
      message.error(error.message || 'Không thể từ chối lô hàng');
    }
  };

  const getStatusTag = (status) => {
    const statusInfo = statusOptions.find(s => s.value === status);
    return statusInfo ? (
      <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
    ) : (
      <Tag>{status}</Tag>
    );
  };

  const columns = [
    {
      title: 'Mã lô',
      dataIndex: 'batch_code',
      key: 'batch_code',
      width: 120,
      render: (text) => <Text strong>{text || 'N/A'}</Text>,
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'product_id',
      key: 'product_id',
      width: 200,
      render: (product) => product?.name || 'N/A',
    },
    {
      title: 'SL ban đầu',
      dataIndex: 'quantity_initial',
      key: 'quantity_initial',
      width: 100,
      align: 'center',
    },
    {
      title: 'SL hiện tại',
      dataIndex: 'quantity_current',
      key: 'quantity_current',
      width: 100,
      align: 'center',
      render: (qty, record) => (
        <Text type={qty === 0 ? 'danger' : qty < record.quantity_initial * 0.2 ? 'warning' : 'success'}>
          {qty}
        </Text>
      ),
    },
    {
      title: 'Giá nhập',
      dataIndex: 'import_price',
      key: 'import_price',
      width: 120,
      align: 'right',
      render: (price) => price?.toLocaleString('vi-VN') + ' đ',
    },
    {
      title: 'Ngày hết hạn',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      width: 120,
      render: (date) => {
        if (!date) return 'N/A';
        const expiryDate = dayjs(date);
        const isExpired = expiryDate.isBefore(dayjs());
        const isNearExpiry = expiryDate.diff(dayjs(), 'day') <= 30;
        return (
          <Text type={isExpired ? 'danger' : isNearExpiry ? 'warning' : undefined}>
            {expiryDate.format('DD/MM/YYYY')}
          </Text>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="Lịch sử">
            <Button
              type="text"
              icon={<HistoryOutlined />}
              onClick={() => handleViewLogs(record)}
            />
          </Tooltip>
          {!record.is_deleted && (
            <>
              <Tooltip title="Đổi trạng thái">
                <Button
                  type="text"
                  icon={<SyncOutlined />}
                  onClick={() => handleOpenStatusModal(record)}
                />
              </Tooltip>
              <Tooltip title="Từ chối lô">
                <Popconfirm
                  title="Bạn có chắc muốn từ chối lô hàng này?"
                  onConfirm={() => handleOpenRejectModal(record)}
                  okText="Có"
                  cancelText="Không"
                >
                  <Button
                    type="text"
                    danger
                    icon={<StopOutlined />}
                  />
                </Popconfirm>
              </Tooltip>
            </>
          )}
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
              Quản lý Lô hàng
            </Title>
          </div>

          <Space size="middle" style={{ width: '100%', flexWrap: 'wrap' }}>
            <Input
              placeholder="Tìm mã lô hàng..."
              prefix={<SearchOutlined />}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
              style={{ width: 250 }}
            />
            <Select
              placeholder="Chọn sản phẩm"
              style={{ width: 200 }}
              value={selectedProduct}
              onChange={handleProductFilter}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={[
                { label: 'Tất cả sản phẩm', value: null },
                ...products.map(product => ({
                  label: product.name,
                  value: product._id,
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
                ...statusOptions.map(opt => ({
                  label: opt.label,
                  value: opt.value,
                })),
              ]}
            />
            <RangePicker
              placeholder={['Từ ngày HH', 'Đến ngày HH']}
              value={expiryDateRange}
              onChange={handleDateRangeFilter}
              format="DD/MM/YYYY"
            />
          </Space>

          <Table
            columns={columns}
            dataSource={batches}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => `Tổng ${total} lô hàng`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
          />
        </Space>
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết Lô hàng"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedBatch && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Mã lô" span={2}>
              {selectedBatch.batch_code || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Sản phẩm" span={2}>
              {selectedBatch.product_id?.name || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="SL ban đầu">
              {selectedBatch.quantity_initial}
            </Descriptions.Item>
            <Descriptions.Item label="SL hiện tại">
              {selectedBatch.quantity_current}
            </Descriptions.Item>
            <Descriptions.Item label="Giá nhập">
              {selectedBatch.import_price?.toLocaleString('vi-VN')} đ
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {getStatusTag(selectedBatch.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Nhà cung cấp" span={2}>
              {selectedBatch.supplier_name || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày sản xuất">
              {selectedBatch.manufacture_date
                ? dayjs(selectedBatch.manufacture_date).format('DD/MM/YYYY')
                : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày hết hạn">
              {selectedBatch.expiry_date
                ? dayjs(selectedBatch.expiry_date).format('DD/MM/YYYY')
                : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo" span={2}>
              {dayjs(selectedBatch.created_at).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            {selectedBatch.is_deleted && (
              <>
                <Descriptions.Item label="Ngày từ chối" span={2}>
                  {dayjs(selectedBatch.deleted_at).format('DD/MM/YYYY HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="Từ chối bởi" span={2}>
                  {selectedBatch.deleted_by?.full_name || selectedBatch.deleted_by?.email || 'N/A'}
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Logs Modal */}
      <Modal
        title="Lịch sử Kho"
        open={logsModalVisible}
        onCancel={() => setLogsModalVisible(false)}
        footer={null}
        width={600}
      >
        {logsLoading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>Đang tải...</div>
        ) : batchLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20 }}>Không có lịch sử</div>
        ) : (
          <Timeline
            items={batchLogs.map(log => ({
              color: log.quantity_change > 0 ? 'green' : 'red',
              children: (
                <div>
                  <Text strong>
                    {log.quantity_change > 0 ? '+' : ''}{log.quantity_change}
                  </Text>
                  {' - '}
                  <Tag>{reasonTypeLabels[log.reason_type] || log.reason_type}</Tag>
                  <br />
                  {log.note && <Text type="secondary">{log.note}</Text>}
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(log.created_at).format('DD/MM/YYYY HH:mm')}
                    {log.created_by && ` - ${log.created_by.full_name || log.created_by.email}`}
                  </Text>
                </div>
              ),
            }))}
          />
        )}
      </Modal>

      {/* Status Modal */}
      <Modal
        title="Cập nhật Trạng thái"
        open={statusModalVisible}
        onCancel={() => {
          setStatusModalVisible(false);
          statusForm.resetFields();
        }}
        onOk={handleUpdateStatus}
        okText="Cập nhật"
        cancelText="Hủy"
      >
        <Form form={statusForm} layout="vertical">
          <Form.Item
            name="status"
            label="Trạng thái mới"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select>
              {statusOptions
                .filter(opt => opt.value !== 'rejected')
                .map(opt => (
                  <Select.Option key={opt.value} value={opt.value}>
                    <Tag color={opt.color}>{opt.label}</Tag>
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Từ chối Lô hàng"
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          rejectForm.resetFields();
        }}
        onOk={handleRejectBatch}
        okText="Xác nhận từ chối"
        okButtonProps={{ danger: true }}
        cancelText="Hủy"
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="note"
            label="Lý do từ chối"
            rules={[{ required: true, message: 'Vui lòng nhập lý do từ chối' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập lý do từ chối lô hàng này..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductBatches;
