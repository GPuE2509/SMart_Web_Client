import { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Modal,
  Select,
  message,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Descriptions,
  Divider,
  Progress,
  Timeline,
} from 'antd';
import {
  DollarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ShoppingCartOutlined,
  EyeOutlined,
  TrophyOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import staffPayrollService from '../../services/staffPayrollService';
import authService from '../../services/authService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

function SellerPayroll() {
  const [payslips, setPayslips] = useState([]);
  const [summary, setSummary] = useState({});
  const [attendance, setAttendance] = useState({});
  const [sales, setSales] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal states
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // Check if user is seller staff
  const [userRole, setUserRole] = useState('seller_staff'); // Default to seller_staff

  useEffect(() => {
    // Get user role from auth service
    const fetchUserRole = async () => {
      try {
        const user = await authService.getUser();
        if (user?.role) {
          setUserRole(user.role);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUserRole();

    fetchPayslips();
    fetchSummary();
    fetchCurrentMonthData();
  }, []);

  useEffect(() => {
    fetchPayslips();
    fetchSummary();
  }, [selectedYear, currentPage, pageSize]);

  // Fetch payslips
  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const result = await staffPayrollService.getMyPayrollList(selectedYear, currentPage, pageSize);
      setPayslips(result.payslips || []);
      setTotalRecords(result.pagination?.total || 0);
    } catch (error) {
      message.error('Không thể tải danh sách bảng lương');
    } finally {
      setLoading(false);
    }
  };

  // Fetch yearly summary
  const fetchSummary = async () => {
    try {
      const result = await staffPayrollService.getMyPayrollSummary(selectedYear);
      setSummary(result.summary || {});
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  // Fetch current month attendance and sales
  const fetchCurrentMonthData = async () => {
    try {
      const [attendanceResult, salesResult] = await Promise.all([
        staffPayrollService.getMyCurrentMonthAttendance(),
        staffPayrollService.getMyCurrentMonthSales().catch(() => ({ sales: {} })),
      ]);
      setAttendance(attendanceResult.attendance || {});
      setSales(salesResult.sales || {});
    } catch (error) {
      console.error('Error fetching current month data:', error);
    }
  };

  // Handle year change
  const handleYearChange = (year) => {
    setSelectedYear(year);
    setCurrentPage(1);
  };

  // Handle pagination change
  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  // View payslip detail
  const handleViewDetail = async (payslipId) => {
    try {
      const result = await staffPayrollService.getMyPayslipDetail(payslipId);
      setSelectedPayslip(result.payslip);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('Không thể tải chi tiết bảng lương');
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value || 0);
  };

  // Generate year options
  const yearOptions = [];
  const currentYear = dayjs().year();
  for (let year = currentYear; year >= currentYear - 5; year--) {
    yearOptions.push({ value: year, label: `Năm ${year}` });
  }

  // Get month name
  const getMonthName = (month) => {
    const months = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
      'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
      'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    return months[month - 1];
  };

  // Table columns
  const columns = [
    {
      title: 'Tháng/Năm',
      key: 'period',
      render: (_, record) => (
        <Text strong>{getMonthName(record.month)} {record.year}</Text>
      ),
    },
    {
      title: 'Ngày công',
      dataIndex: 'total_work_days',
      key: 'total_work_days',
      align: 'center',
      render: (days) => `${days || 0} ngày`,
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
      render: (rate) => (
        <Progress
          type="circle"
          percent={rate || 0}
          width={50}
          format={(percent) => `${percent?.toFixed(0)}%`}
          strokeColor={rate >= 80 ? '#52c41a' : rate >= 60 ? '#faad14' : '#f5222d'}
        />
      ),
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
      render: (amount) => (
        <Text type="success">{formatCurrency(amount)}</Text>
      ),
    },
    {
      title: 'Lương thực nhận',
      dataIndex: 'net',
      key: 'net',
      align: 'right',
      render: (amount) => (
        <Text strong style={{ color: '#52c41a', fontSize: '15px' }}>
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
          <Tag color="success" icon={<CheckCircleOutlined />}>Đã nhận</Tag>
        ) : (
          <Tag color="warning" icon={<ClockCircleOutlined />}>Chờ nhận</Tag>
        )
      ),
    },
    {
      title: '',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Button
          type="default"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record._id)}
          style={{
            color: '#f5741f',
            borderColor: '#f5741f',
            minWidth: 120,
            fontWeight: 500,
          }}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <DollarOutlined style={{ marginRight: 8 }} />
        Bảng lương của tôi
      </Title>

      {/* Current Month Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title={`Tháng ${dayjs().month() + 1} - Ngày công`}
              value={attendance.total_work_days || 0}
              suffix="ngày"
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={`Tháng ${dayjs().month() + 1} - Giờ công`}
              value={attendance.total_work_hours?.toFixed(1) || 0}
              suffix="giờ"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        {userRole === 'seller_staff' && (
          <>
            <Col span={6}>
              <Card>
                <Statistic
                  title={`Tháng ${dayjs().month() + 1} - Đơn hoàn thành`}
                  value={sales.completed_orders || 0}
                  suffix="đơn"
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title={`Tháng ${dayjs().month() + 1} - Doanh số`}
                  value={sales.completed_amount || 0}
                  formatter={(value) => formatCurrency(value)}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </>
        )}
        {userRole !== 'seller_staff' && (
          <Col span={12}>
            <Card>
              <Statistic
                title="Số ca làm việc tháng này"
                value={attendance.attendance_records || 0}
                suffix="ca"
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
        )}
      </Row>

      {/* Yearly Summary */}
      <Card
        title={
          <Space>
            <TrophyOutlined />
            <span>Tổng kết năm {selectedYear}</span>
          </Space>
        }
        extra={
          <Select
            value={selectedYear}
            onChange={handleYearChange}
            options={yearOptions}
            style={{ width: 120 }}
          />
        }
        style={{ marginBottom: '24px' }}
      >
        <Row gutter={24}>
          <Col span={6}>
            <Statistic
              title="Tổng lương thực nhận"
              value={summary.total_net || 0}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Lương TB/tháng"
              value={summary.avg_monthly_net || 0}
              formatter={(value) => formatCurrency(value)}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Tổng ngày công"
              value={summary.total_work_days || 0}
              suffix="ngày"
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Tổng giờ công"
              value={summary.total_work_hours?.toFixed(1) || 0}
              suffix="giờ"
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Số tháng đã nhận"
              value={`${summary.paid_months || 0}/${summary.months_worked || 0}`}
              valueStyle={{ color: summary.pending_months > 0 ? '#faad14' : '#52c41a' }}
            />
          </Col>
        </Row>
        {userRole === 'seller_staff' && (
          <Row gutter={24} style={{ marginTop: '16px' }}>
            <Col span={8}>
              <Statistic
                title="Tổng doanh số"
                value={summary.total_sales || 0}
                formatter={(value) => formatCurrency(value)}
                prefix={<ShoppingCartOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Tổng hoa hồng"
                value={summary.total_commission || 0}
                formatter={(value) => formatCurrency(value)}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Tổng thưởng"
                value={summary.total_bonus || 0}
                formatter={(value) => formatCurrency(value)}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
          </Row>
        )}
      </Card>

      {/* Payslips Table */}
      <Card title="Danh sách bảng lương">
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
            pageSizeOptions: ['6', '12', '24'],
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <Space>
            <DollarOutlined />
            <span>
              Chi tiết bảng lương - {getMonthName(selectedPayslip?.month)} {selectedPayslip?.year}
            </span>
          </Space>
        }
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
                {getMonthName(selectedPayslip.month)} {selectedPayslip.year}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {selectedPayslip.payment_status === 'paid' ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>Đã nhận lương</Tag>
                ) : (
                  <Tag color="warning" icon={<ClockCircleOutlined />}>Chờ nhận lương</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày công">
                {selectedPayslip.total_work_days} ngày
              </Descriptions.Item>
              <Descriptions.Item label="Giờ công">
                {selectedPayslip.total_work_hours?.toFixed(1)} giờ
              </Descriptions.Item>
              <Descriptions.Item label="Tỷ lệ chuyên cần">
                <Progress
                  percent={selectedPayslip.attendance_rate || 0}
                  size="small"
                  format={(percent) => `${percent?.toFixed(0)}%`}
                  strokeColor={
                    selectedPayslip.attendance_rate >= 80 ? '#52c41a' :
                    selectedPayslip.attendance_rate >= 60 ? '#faad14' : '#f5222d'
                  }
                />
              </Descriptions.Item>
              <Descriptions.Item label="Lương/giờ">
                {formatCurrency(selectedPayslip.hourly_rate)}
              </Descriptions.Item>
            </Descriptions>

            <Divider>Chi tiết thu nhập</Divider>

            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Lương cơ bản">
                {formatCurrency(selectedPayslip.base_salary)}
              </Descriptions.Item>
              <Descriptions.Item label="Lương theo giờ">
                {formatCurrency(selectedPayslip.hours_based_salary)}
              </Descriptions.Item>
              {userRole === 'seller_staff' && (
                <>
                  <Descriptions.Item label="Doanh số">
                    {formatCurrency(selectedPayslip.total_sales_amount)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số đơn hàng">
                    {selectedPayslip.total_orders_processed} đơn
                  </Descriptions.Item>
                  <Descriptions.Item label={`Hoa hồng (${selectedPayslip.sales_commission_rate}%)`}>
                    <Text type="success">{formatCurrency(selectedPayslip.sales_commission)}</Text>
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="Tổng thưởng">
                <Text type="success">{formatCurrency(selectedPayslip.total_bonus)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng khấu trừ">
                <Text type="danger">{formatCurrency(selectedPayslip.total_deductions)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Lương trước khấu trừ">
                {formatCurrency(selectedPayslip.gross)}
              </Descriptions.Item>
              <Descriptions.Item label="Lương thực nhận" span={2}>
                <Text strong style={{ fontSize: '20px', color: '#52c41a' }}>
                  {formatCurrency(selectedPayslip.net)}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            {selectedPayslip.adjustments?.length > 0 && (
              <>
                <Divider>Điều chỉnh</Divider>
                <Timeline
                  items={selectedPayslip.adjustments.map((adj) => ({
                    color: adj.type === 'bonus' ? 'green' : 'red',
                    children: (
                      <div>
                        <Tag color={adj.type === 'bonus' ? 'green' : 'red'}>
                          {adj.type === 'bonus' ? 'Thưởng' : 'Khấu trừ'}
                        </Tag>
                        <Text strong>{formatCurrency(adj.amount)}</Text>
                        {adj.reason && (
                          <Text type="secondary" style={{ marginLeft: 8 }}>
                            - {adj.reason}
                          </Text>
                        )}
                      </div>
                    ),
                  }))}
                />
              </>
            )}

            {selectedPayslip.payment_status === 'paid' && selectedPayslip.payment_date && (
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Text type="secondary">
                  Đã thanh toán ngày: {dayjs(selectedPayslip.payment_date).format('DD/MM/YYYY HH:mm')}
                </Text>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}

export default SellerPayroll;
