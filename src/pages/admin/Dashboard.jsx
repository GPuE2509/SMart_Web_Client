import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Typography,
  Space,
  Tag,
  Button,
  Alert,
} from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  UserAddOutlined,
  WarningOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { Column, Pie } from '@ant-design/charts';
import dayjs from 'dayjs';
import {
  mockOrders,
  mockProducts,
  mockPayrolls,
  mockUsers,
  getCategoryById,
  getUserById,
} from '../../services/mockData';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [payrollData, setPayrollData] = useState([]);

  const loadDashboardData = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Calculate statistics
    const totalRevenue = mockOrders
      .filter((order) => order.status !== 'cancelled')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    const totalOrders = mockOrders.length;

    const today = dayjs().format('YYYY-MM-DD');
    const newCustomersToday = mockUsers.filter(
      (user) =>
        user.role !== 'admin' &&
        dayjs(user.createdAt).format('YYYY-MM-DD') === today
    ).length;

    const lowStock = mockProducts.filter(
      (product) => product.stock <= product.lowStockThreshold
    );

    setDashboardStats({
      totalRevenue,
      totalOrders,
      newCustomersToday,
      lowStockCount: lowStock.length,
    });

    setLowStockProducts(lowStock);

    // Generate revenue by day (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = dayjs().subtract(6 - i, 'day');
      const dayOrders = mockOrders.filter(
        (order) =>
          order.status !== 'cancelled' &&
          dayjs(order.orderDate).format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
      );
      const revenue = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0);

      return {
        date: date.format('MMM DD'),
        revenue: parseFloat(revenue.toFixed(2)),
      };
    });
    setRevenueData(last7Days);

    // Calculate sales by category
    const categoryStats = {};
    mockOrders
      .filter((order) => order.status !== 'cancelled')
      .forEach((order) => {
        order.items.forEach((item) => {
          const product = mockProducts.find((p) => p.id === item.productId);
          if (product) {
            const category = getCategoryById(product.categoryId);
            if (category) {
              if (!categoryStats[category.name]) {
                categoryStats[category.name] = 0;
              }
              categoryStats[category.name] += item.quantity * item.price;
            }
          }
        });
      });

    const categoryChartData = Object.entries(categoryStats).map(([name, value]) => ({
      category: name,
      value: parseFloat(value.toFixed(2)),
    }));
    setCategoryData(categoryChartData);

    // Prepare payroll data
    const payrollTableData = mockPayrolls.map((payroll) => {
      const user = getUserById(payroll.userId);
      return {
        key: payroll.id,
        id: payroll.id,
        userName: user?.name || 'Unknown',
        period: payroll.period,
        baseSalary: payroll.baseSalary,
        bonus: payroll.bonus,
        deductions: payroll.deductions,
        netSalary: payroll.netSalary,
        status: payroll.status,
      };
    });
    setPayrollData(payrollTableData);

    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExportPayroll = () => {
    console.log('Exporting payroll data to Excel...', payrollData);
    alert('Exporting payroll data to Excel... (Mock function)');
  };

  // Revenue chart config
  const revenueConfig = {
    data: revenueData,
    xField: 'date',
    yField: 'revenue',
    label: {
      position: 'top',
      style: {
        fill: '#000',
        opacity: 0.6,
      },
      formatter: (datum) => `$${datum.revenue}`,
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
      },
    },
    meta: {
      revenue: {
        alias: 'Revenue',
        formatter: (value) => `$${value}`,
      },
    },
    columnStyle: {
      radius: [8, 8, 0, 0],
    },
  };

  // Category pie chart config
  const categoryConfig = {
    data: categoryData,
    angleField: 'value',
    colorField: 'category',
    radius: 0.8,
    innerRadius: 0.6,
    label: {
      type: 'spider',
      labelHeight: 28,
      content: '{name}\n${value}',
    },
    interactions: [
      {
        type: 'element-selected',
      },
      {
        type: 'element-active',
      },
    ],
    statistic: {
      title: false,
      content: {
        style: {
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
        content: 'Total\nSales',
      },
    },
  };

  // Payroll table columns
  const payrollColumns = [
    {
      title: 'Employee',
      dataIndex: 'userName',
      key: 'userName',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
    },
    {
      title: 'Base Salary',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      render: (value) => `$${value.toFixed(2)}`,
    },
    {
      title: 'Bonus',
      dataIndex: 'bonus',
      key: 'bonus',
      render: (value) => <Text type="success">${value.toFixed(2)}</Text>,
    },
    {
      title: 'Deductions',
      dataIndex: 'deductions',
      key: 'deductions',
      render: (value) => <Text type="danger">-${value.toFixed(2)}</Text>,
    },
    {
      title: 'Final Received',
      dataIndex: 'netSalary',
      key: 'netSalary',
      render: (value) => <strong style={{ color: '#1890ff' }}>${value.toFixed(2)}</strong>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          draft: 'default',
          approved: 'processing',
          paid: 'success',
        };
        return <Tag color={colorMap[status]}>{status.toUpperCase()}</Tag>;
      },
    },
  ];

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={3}>Dashboard Overview</Title>
          <Text type="secondary">Welcome back! Here's what's happening today.</Text>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card loading={loading}>
              <Statistic
                title="Total Revenue"
                value={dashboardStats?.totalRevenue || 0}
                precision={2}
                prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card loading={loading}>
              <Statistic
                title="Total Orders"
                value={dashboardStats?.totalOrders || 0}
                prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card loading={loading}>
              <Statistic
                title="New Customers (Today)"
                value={dashboardStats?.newCustomersToday || 0}
                prefix={<UserAddOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card loading={loading}>
              <Statistic
                title="Low Stock Alert"
                value={dashboardStats?.lowStockCount || 0}
                prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f' }}
                suffix="items"
              />
            </Card>
          </Col>
        </Row>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <Alert
            message="Low Stock Warning"
            description={
              <Space direction="vertical">
                <Text>The following products are running low on stock:</Text>
                <Space wrap>
                  {lowStockProducts.slice(0, 5).map((product) => (
                    <Tag key={product.id} color="warning">
                      {product.name} ({product.stock} left)
                    </Tag>
                  ))}
                  {lowStockProducts.length > 5 && (
                    <Tag>+{lowStockProducts.length - 5} more</Tag>
                  )}
                </Space>
              </Space>
            }
            type="warning"
            showIcon
            icon={<WarningOutlined />}
          />
        )}

        {/* Sales Performance Report */}
        <Card title="Sales Performance Report" loading={loading}>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <div>
                <Title level={5}>Revenue by Day (Last 7 Days)</Title>
                <Column {...revenueConfig} height={300} />
              </div>
            </Col>
            <Col xs={24} lg={10}>
              <div>
                <Title level={5}>Sales by Category</Title>
                <Pie {...categoryConfig} height={300} />
              </div>
            </Col>
          </Row>
        </Card>

        {/* Employee Payroll Report */}
        <Card
          title="Employee Payroll Report"
          extra={
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExportPayroll}
            >
              Export to Excel
            </Button>
          }
          loading={loading}
        >
          <Table
            columns={payrollColumns}
            dataSource={payrollData}
            pagination={{ pageSize: 5 }}
            scroll={{ x: 800 }}
          />
        </Card>
      </Space>
    </div>
  );
};

export default Dashboard;
