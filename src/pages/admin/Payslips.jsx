import { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Input,
  Modal,
  Form,
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
  Popconfirm,
  Divider,
  Badge,
  Tooltip,
} from 'antd';
import {
  DollarOutlined,
  SearchOutlined,
  FilterOutlined,
  CalculatorOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import payrollService from '../../services/payrollService';
import profileService from '../../services/profileService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

function Payslips() {
  const [payslips, setPayslips] = useState([]);
  const [summary, setSummary] = useState({});
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [roleFilter, setRoleFilter] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal states
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false);
  const [calculateModalVisible, setCalculateModalVisible] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // Forms
  const [adjustmentForm] = Form.useForm();
  const [calculateForm] = Form.useForm();

  useEffect(() => {
    fetchPayrollReport();
    fetchStaffList();
  }, []);

  useEffect(() => {
    fetchPayrollReport();
  }, [currentPage, pageSize]);

  // Fetch payroll report
  const fetchPayrollReport = async () => {
    setLoading(true);
    try {
      const month = selectedMonth.month() + 1;
      const year = selectedMonth.year();

      const result = await payrollService.getPayrollReport(month, year, {
        role: roleFilter,
        search: searchText,
        page: currentPage,
        limit: pageSize,
      });

      setPayslips(result.payslips || []);
      setSummary(result.summary || {});
      setTotalRecords(result.pagination?.total || 0);
    } catch (error) {
      message.error('Không thể tải báo cáo lương');
    } finally {
      setLoading(false);
    }
  };

  // Fetch staff list for calculation
  const fetchStaffList = async () => {
    try {
      const response = await profileService.getAllUsers();
      const staff = (response.data || []).filter(user =>
        ['seller_staff', 'repository_staff'].includes(user.role)
      );
      setStaffList(staff);
    } catch (error) {
      console.error('Error fetching staff list:', error);
    }
  };

  // Handle search/filter
  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchPayrollReport();
  };

  // Handle month change
  const handleMonthChange = (date) => {
    setSelectedMonth(date);
  };

  // Handle pagination change
  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  // Calculate payroll for single staff
  const handleCalculatePayroll = async (values) => {
    setCalculating(true);
    try {
      const month = selectedMonth.month() + 1;
      const year = selectedMonth.year();

      if (values.calculate_all) {
        await payrollService.bulkCalculatePayroll(month, year, {
          hourly_rate: values.hourly_rate,
          base_salary: values.base_salary,
          sales_commission_rate: values.sales_commission_rate,
        });
        message.success('Đã tính lương cho tất cả nhân viên!');
      } else {
        await payrollService.calculatePayroll(
          values.user_id,
          month,
          year,
          {
            hourly_rate: values.hourly_rate,
            base_salary: values.base_salary,
            sales_commission_rate: values.sales_commission_rate,
          }
        );
        message.success('Đã tính lương cho nhân viên!');
      }

      setCalculateModalVisible(false);
      calculateForm.resetFields();
      fetchPayrollReport();
    } catch (error) {
      message.error(error.message || 'Không thể tính lương');
    } finally {
      setCalculating(false);
    }
  };

  // View payslip detail
  const handleViewDetail = async (payslipId) => {
    try {
      const result = await payrollService.getPayslipDetail(payslipId);
      setSelectedPayslip(result.payslip);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('Không thể tải chi tiết bảng lương');
    }
  };

  // Open adjustment modal
  const handleOpenAdjustment = (payslip) => {
    setSelectedPayslip(payslip);
    adjustmentForm.resetFields();
    setAdjustmentModalVisible(true);
  };

  // Add adjustment
  const handleAddAdjustment = async (values) => {
    try {
      await payrollService.addAdjustment(selectedPayslip._id, values);
      message.success('Đã thêm điều chỉnh!');
      setAdjustmentModalVisible(false);
      adjustmentForm.resetFields();
      fetchPayrollReport();

      // Refresh detail if open
      if (detailModalVisible) {
        const result = await payrollService.getPayslipDetail(selectedPayslip._id);
        setSelectedPayslip(result.payslip);
      }
    } catch (error) {
      message.error(error.message || 'Không thể thêm điều chỉnh');
    }
  };

  // Remove adjustment
  const handleRemoveAdjustment = async (payslipId, adjustmentId) => {
    try {
      await payrollService.removeAdjustment(payslipId, adjustmentId);
      message.success('Đã xóa điều chỉnh!');

      // Refresh detail
      const result = await payrollService.getPayslipDetail(payslipId);
      setSelectedPayslip(result.payslip);
      fetchPayrollReport();
    } catch (error) {
      message.error(error.message || 'Không thể xóa điều chỉnh');
    }
  };

  // Update payment status
  const handleUpdateStatus = async (payslipId, status) => {
    try {
      await payrollService.updatePaymentStatus(payslipId, status);
      message.success(`Đã cập nhật trạng thái thành ${status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}`);
      fetchPayrollReport();

      // Refresh detail if open
      if (detailModalVisible && selectedPayslip?._id === payslipId) {
        const result = await payrollService.getPayslipDetail(payslipId);
        setSelectedPayslip(result.payslip);
      }
    } catch (error) {
      message.error(error.message || 'Không thể cập nhật trạng thái');
    }
  };

  // Export to Excel
  const handleExportExcel = async () => {
    try {
      const month = selectedMonth.month() + 1;
      const year = selectedMonth.year();
      const blob = await payrollService.exportToExcel(month, year, roleFilter);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll_${month}_${year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      message.success('Đã xuất file Excel!');
    } catch (error) {
      message.error('Không thể xuất file Excel');
    }
  };

  // Export to PDF
  const handleExportPDF = async () => {
    try {
      const month = selectedMonth.month() + 1;
      const year = selectedMonth.year();
      const blob = await payrollService.exportToPDF(month, year, roleFilter);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll_${month}_${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      message.success('Đã xuất file PDF!');
    } catch (error) {
      message.error('Không thể xuất file PDF');
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value || 0);
  };

  // Table columns
  const columns = [
    {
      title: 'Nhân viên',
      key: 'user',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: '600' }}>{record.user?.full_name}</div>
          <div style={{ color: '#6b7280', fontSize: '12px' }}>{record.user?.email}</div>
        </div>
      ),
    },
    {
      title: 'Vai trò',
      key: 'role',
      render: (_, record) => {
        const role = record.user?.role;
        const roleLabels = {
          seller_staff: 'NV Bán hàng',
          repository_staff: 'NV Kho',
        };
        const colors = {
          seller_staff: 'blue',
          repository_staff: 'green',
        };
        return <Tag color={colors[role]}>{roleLabels[role]}</Tag>;
      },
    },
    {
      title: 'Ngày công',
      dataIndex: 'total_work_days',
      key: 'total_work_days',
      align: 'center',
    },
    {
      title: 'Giờ công',
      dataIndex: 'total_work_hours',
      key: 'total_work_hours',
      align: 'center',
      render: (hours) => `${hours?.toFixed(1) || 0}h`,
    },
    {
      title: 'Tỷ lệ CC',
      dataIndex: 'attendance_rate',
      key: 'attendance_rate',
      align: 'center',
      render: (rate) => `${rate?.toFixed(0) || 0}%`,
    },
    {
      title: 'Doanh số',
      dataIndex: 'total_sales_amount',
      key: 'total_sales_amount',
      align: 'right',
      render: (amount) => formatCurrency(amount),
    },
    {
      title: 'Hoa hồng',
      dataIndex: 'sales_commission',
      key: 'sales_commission',
      align: 'right',
      render: (amount) => formatCurrency(amount),
    },
    {
      title: 'Lương NET',
      dataIndex: 'net',
      key: 'net',
      align: 'right',
      render: (amount) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'payment_status',
      key: 'payment_status',
      align: 'center',
      render: (status) => (
        status === 'paid' ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>Đã TT</Tag>
        ) : (
          <Tag color="warning" icon={<ClockCircleOutlined />}>Chờ TT</Tag>
        )
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record._id)}
            />
          </Tooltip>
          <Tooltip title="Điều chỉnh">
            <Button
              type="text"
              icon={<PlusOutlined />}
              onClick={() => handleOpenAdjustment(record)}
              disabled={record.payment_status === 'paid'}
            />
          </Tooltip>
          {record.payment_status === 'pending' ? (
            <Popconfirm
              title="Xác nhận đã thanh toán?"
              onConfirm={() => handleUpdateStatus(record._id, 'paid')}
            >
              <Button type="link" size="small">Thanh toán</Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Chuyển về trạng thái chờ thanh toán?"
              onConfirm={() => handleUpdateStatus(record._id, 'pending')}
            >
              <Button type="link" size="small" danger>Hủy TT</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <DollarOutlined className="mr-2" />
        Quản lý bảng lương
      </Title>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng số nhân viên"
              value={summary.staff_count || 0}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng lương GROSS"
              value={summary.total_gross || 0}
              formatter={(value) => formatCurrency(value)}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng lương NET"
              value={summary.total_net || 0}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng thưởng"
              value={summary.total_bonus || 0}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter and Actions */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col>
            <DatePicker
              picker="month"
              value={selectedMonth}
              onChange={handleMonthChange}
              format="MM/YYYY"
              placeholder="Chọn tháng"
            />
          </Col>
          <Col>
            <Select
              placeholder="Lọc theo vai trò"
              style={{ width: 180 }}
              allowClear
              value={roleFilter}
              onChange={setRoleFilter}
            >
              <Select.Option value="seller_staff">NV Bán hàng</Select.Option>
              <Select.Option value="repository_staff">NV Kho</Select.Option>
            </Select>
          </Col>
          <Col>
            <Input
              placeholder="Tìm theo tên, email..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 220 }}
              allowClear
            />
          </Col>
          <Col>
            <Button type="primary" icon={<FilterOutlined />} onClick={handleApplyFilters}>
              Lọc
            </Button>
          </Col>
          <Col flex="auto" />
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<CalculatorOutlined />}
                onClick={() => setCalculateModalVisible(true)}
              >
                Tính lương
              </Button>
              <Button icon={<FileExcelOutlined />} onClick={handleExportExcel}>
                Excel
              </Button>
              <Button icon={<FilePdfOutlined />} onClick={handleExportPDF}>
                PDF
              </Button>
              <Button icon={<ReloadOutlined />} onClick={fetchPayrollReport}>
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={payslips}
          loading={loading}
          rowKey="_id"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalRecords,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} bản ghi`,
            pageSizeOptions: ['10', '20', '50'],
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Calculate Modal */}
      <Modal
        title="Tính lương"
        open={calculateModalVisible}
        onCancel={() => {
          setCalculateModalVisible(false);
          calculateForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={calculateForm}
          layout="vertical"
          onFinish={handleCalculatePayroll}
          initialValues={{
            hourly_rate: 30000,
            base_salary: 4000000,
            sales_commission_rate: 1,
            calculate_all: true,
          }}
        >
          <Form.Item name="calculate_all" valuePropName="checked" label="Tính cho tất cả nhân viên">
            <Select
              onChange={(value) => {
                calculateForm.setFieldValue('calculate_all', value === 'all');
              }}
              defaultValue="all"
            >
              <Select.Option value="all">Tất cả nhân viên</Select.Option>
              <Select.Option value="single">Nhân viên cụ thể</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.calculate_all !== currentValues.calculate_all
            }
          >
            {({ getFieldValue }) =>
              !getFieldValue('calculate_all') ? (
                <Form.Item
                  name="user_id"
                  label="Chọn nhân viên"
                  rules={[{ required: true, message: 'Vui lòng chọn nhân viên!' }]}
                >
                  <Select placeholder="Chọn nhân viên" showSearch optionFilterProp="children">
                    {staffList.map((staff) => (
                      <Select.Option key={staff._id} value={staff._id}>
                        {staff.full_name} ({staff.role === 'seller_staff' ? 'Bán hàng' : 'Kho'})
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item name="hourly_rate" label="Lương theo giờ (VND)">
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item name="base_salary" label="Lương cơ bản (VND)">
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item name="sales_commission_rate" label="Tỷ lệ hoa hồng (%)">
            <InputNumber style={{ width: '100%' }} min={0} max={100} step={0.5} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={calculating}>
                Tính lương
              </Button>
              <Button onClick={() => setCalculateModalVisible(false)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Adjustment Modal */}
      <Modal
        title="Thêm điều chỉnh lương"
        open={adjustmentModalVisible}
        onCancel={() => {
          setAdjustmentModalVisible(false);
          adjustmentForm.resetFields();
        }}
        footer={null}
        width={400}
      >
        <Form form={adjustmentForm} layout="vertical" onFinish={handleAddAdjustment}>
          <Form.Item
            name="type"
            label="Loại"
            rules={[{ required: true, message: 'Vui lòng chọn loại!' }]}
          >
            <Select placeholder="Chọn loại">
              <Select.Option value="bonus">Thưởng</Select.Option>
              <Select.Option value="deduction">Khấu trừ</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="amount"
            label="Số tiền (VND)"
            rules={[{ required: true, message: 'Vui lòng nhập số tiền!' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item name="reason" label="Lý do">
            <Input.TextArea rows={3} placeholder="Nhập lý do điều chỉnh..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Thêm
              </Button>
              <Button onClick={() => setAdjustmentModalVisible(false)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={`Chi tiết bảng lương - ${selectedPayslip?.user_id?.full_name || ''}`}
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedPayslip(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={700}
      >
        {selectedPayslip && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Tháng/Năm">
                {selectedPayslip.month}/{selectedPayslip.year}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {selectedPayslip.payment_status === 'paid' ? (
                  <Tag color="success">Đã thanh toán</Tag>
                ) : (
                  <Tag color="warning">Chờ thanh toán</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày công">
                {selectedPayslip.total_work_days} ngày
              </Descriptions.Item>
              <Descriptions.Item label="Giờ công">
                {selectedPayslip.total_work_hours?.toFixed(1)} giờ
              </Descriptions.Item>
              <Descriptions.Item label="Tỷ lệ chuyên cần">
                {selectedPayslip.attendance_rate?.toFixed(0)}%
              </Descriptions.Item>
              <Descriptions.Item label="Lương/giờ">
                {formatCurrency(selectedPayslip.hourly_rate)}
              </Descriptions.Item>
              <Descriptions.Item label="Lương cơ bản">
                {formatCurrency(selectedPayslip.base_salary)}
              </Descriptions.Item>
              <Descriptions.Item label="Lương theo giờ">
                {formatCurrency(selectedPayslip.hours_based_salary)}
              </Descriptions.Item>
              <Descriptions.Item label="Doanh số">
                {formatCurrency(selectedPayslip.total_sales_amount)}
              </Descriptions.Item>
              <Descriptions.Item label="Đơn hàng">
                {selectedPayslip.total_orders_processed} đơn
              </Descriptions.Item>
              <Descriptions.Item label="Hoa hồng ({selectedPayslip.sales_commission_rate}%)">
                {formatCurrency(selectedPayslip.sales_commission)}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng thưởng">
                <Text type="success">{formatCurrency(selectedPayslip.total_bonus)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng khấu trừ">
                <Text type="danger">{formatCurrency(selectedPayslip.total_deductions)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Lương GROSS">
                {formatCurrency(selectedPayslip.gross)}
              </Descriptions.Item>
              <Descriptions.Item label="Lương NET" span={2}>
                <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
                  {formatCurrency(selectedPayslip.net)}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            <Divider>Điều chỉnh</Divider>

            {selectedPayslip.adjustments?.length > 0 ? (
              <Table
                dataSource={selectedPayslip.adjustments}
                rowKey="_id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Loại',
                    dataIndex: 'type',
                    render: (type) => (
                      <Tag color={type === 'bonus' ? 'green' : 'red'}>
                        {type === 'bonus' ? 'Thưởng' : 'Khấu trừ'}
                      </Tag>
                    ),
                  },
                  {
                    title: 'Số tiền',
                    dataIndex: 'amount',
                    render: (amount) => formatCurrency(amount),
                  },
                  {
                    title: 'Lý do',
                    dataIndex: 'reason',
                    render: (reason) => reason || '-',
                  },
                  {
                    title: 'Người tạo',
                    dataIndex: ['created_by', 'full_name'],
                    render: (name) => name || '-',
                  },
                  {
                    title: '',
                    key: 'action',
                    render: (_, record) => (
                      selectedPayslip.payment_status === 'pending' && (
                        <Popconfirm
                          title="Xóa điều chỉnh này?"
                          onConfirm={() => handleRemoveAdjustment(selectedPayslip._id, record._id)}
                        >
                          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                        </Popconfirm>
                      )
                    ),
                  },
                ]}
              />
            ) : (
              <Text type="secondary">Không có điều chỉnh nào</Text>
            )}

            {selectedPayslip.payment_status === 'pending' && (
              <div style={{ marginTop: '16px' }}>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenAdjustment(selectedPayslip)}
                >
                  Thêm điều chỉnh
                </Button>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}

export default Payslips;
