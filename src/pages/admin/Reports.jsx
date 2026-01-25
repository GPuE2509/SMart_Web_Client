import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Button,
  DatePicker,
  Select,
  Table,
  Tag,
  Statistic,
  Alert,
  Tabs,
} from 'antd';
import {
  DownloadOutlined,
  BarChartOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Line, Column, Pie } from '@ant-design/charts';
import dayjs from 'dayjs';
import {
  mockOrders,
  mockProducts,
  mockUsers,
  getCategoryById,
  getProductById,
} from '../../services/mockData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const Reports = () => {
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const _loading = false;
  const _selectedCategory = null;

  // Calculate order statistics
  const getOrderStats = () => {
    const filteredOrders = mockOrders.filter((order) => {
      const orderDate = dayjs(order.orderDate);
      return (
        orderDate.isAfter(dateRange[0]) &&
        orderDate.isBefore(dateRange[1].add(1, 'day'))
      );
    });

    const totalRevenue = filteredOrders
      .filter((order) => order.status !== 'cancelled')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter(
      (order) => order.status === 'delivered'
    ).length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalRevenue,
      totalOrders,
      completedOrders,
      averageOrderValue,
      filteredOrders,
    };
  };

  // Generate sales trend data
  const getSalesTrendData = () => {
    const stats = getOrderStats();
    const days = dateRange[1].diff(dateRange[0], 'day');
    const interval = days > 60 ? 'month' : days > 14 ? 'week' : 'day';

    const trendData = [];
    let current = dateRange[0].clone();

    while (current.isBefore(dateRange[1])) {
      const nextPeriod =
        interval === 'month'
          ? current.add(1, 'month')
          : interval === 'week'
          ? current.add(1, 'week')
          : current.add(1, 'day');

      const periodOrders = stats.filteredOrders.filter((order) => {
        const orderDate = dayjs(order.orderDate);
        return (
          orderDate.isAfter(current) && orderDate.isBefore(nextPeriod)
        );
      });

      const revenue = periodOrders
        .filter((order) => order.status !== 'cancelled')
        .reduce((sum, order) => sum + order.totalAmount, 0);

      trendData.push({
        date: current.format(
          interval === 'month' ? 'MMM YYYY' : interval === 'week' ? 'MMM DD' : 'MMM DD'
        ),
        revenue: parseFloat(revenue.toFixed(2)),
        orders: periodOrders.length,
      });

      current = nextPeriod;
    }

    return trendData;
  };

  // Get top selling products
  const getTopProducts = () => {
    const productSales = {};

    mockOrders
      .filter((order) => order.status !== 'cancelled')
      .forEach((order) => {
        order.items.forEach((item) => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              productId: item.productId,
              quantity: 0,
              revenue: 0,
            };
          }
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += item.quantity * item.price;
        });
      });

    return Object.values(productSales)
      .map((item) => {
        const product = getProductById(item.productId);
        return {
          productId: item.productId,
          productName: product?.name || 'Unknown',
          quantity: item.quantity,
          revenue: item.revenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  };

  // Get category distribution
  const getCategoryDistribution = () => {
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

    return Object.entries(categoryStats)
      .map(([category, value]) => ({
        category,
        value: parseFloat(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Get customer distribution
  const getCustomerDistribution = () => {
    const customerOrders = {};

    mockOrders.forEach((order) => {
      if (!customerOrders[order.customerId]) {
        customerOrders[order.customerId] = 0;
      }
      customerOrders[order.customerId]++;
    });

    const distribution = {
      new: 0, // 1 order
      regular: 0, // 2-5 orders
      loyal: 0, // 6+ orders
    };

    Object.values(customerOrders).forEach((count) => {
      if (count === 1) distribution.new++;
      else if (count <= 5) distribution.regular++;
      else distribution.loyal++;
    });

    return [
      { type: 'New Customers', value: distribution.new },
      { type: 'Regular Customers', value: distribution.regular },
      { type: 'Loyal Customers', value: distribution.loyal },
    ];
  };

  const stats = getOrderStats();
  const salesTrend = getSalesTrendData();
  const topProducts = getTopProducts();
  const categoryDistribution = getCategoryDistribution();
  const customerDistribution = getCustomerDistribution();

  // Sales trend config
  const salesTrendConfig = {
    data: salesTrend,
    xField: 'date',
    yField: 'revenue',
    smooth: true,
    label: {
      style: {
        fill: '#000',
        opacity: 0.6,
      },
    },
    point: {
      size: 5,
      shape: 'diamond',
    },
    meta: {
      revenue: {
        formatter: (value) => `$${value}`,
      },
    },
  };

  // Category distribution config
  const categoryConfig = {
    data: categoryDistribution,
    xField: 'category',
    yField: 'value',
    label: {
      position: 'top',
      formatter: (datum) => `$${datum.value}`,
    },
    meta: {
      value: {
        formatter: (value) => `$${value}`,
      },
    },
    columnStyle: {
      radius: [8, 8, 0, 0],
    },
  };

  // Customer distribution config
  const customerConfig = {
    data: customerDistribution,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} ({percentage})',
    },
    interactions: [
      {
        type: 'element-active',
      },
    ],
  };

  // Top products table columns
  const productColumns = [
    {
      title: 'Rank',
      key: 'rank',
      render: (_, __, index) => <Tag color="blue">#{index + 1}</Tag>,
      width: 80,
    },
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Units Sold',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      sorter: (a, b) => a.revenue - b.revenue,
      render: (value) => <strong style={{ color: '#52c41a' }}>${value.toFixed(2)}</strong>,
    },
  ];

  const handleExport = (reportType) => {
    console.log(`Exporting ${reportType} report...`);
    alert(`Exporting ${reportType} report to Excel... (Mock function)`);
  };

  const handleDateRangeChange = (dates) => {
    if (dates) {
      setDateRange(dates);
    }
  };

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Revenue"
                  value={stats.totalRevenue}
                  precision={2}
                  prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Orders"
                  value={stats.totalOrders}
                  prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Completed Orders"
                  value={stats.completedOrders}
                  prefix={<ShoppingCartOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Avg Order Value"
                  value={stats.averageOrderValue}
                  precision={2}
                  prefix={<BarChartOutlined style={{ color: '#fa8c16' }} />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>

          <Card
            title="Sales Trend"
            extra={
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => handleExport('Sales Trend')}
              >
                Export
              </Button>
            }
          >
            <Line {...salesTrendConfig} height={350} />
          </Card>
        </Space>
      ),
    },
    {
      key: 'products',
      label: 'Top Products',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            message="Best Selling Products"
            description="Products ranked by total revenue generated"
            type="info"
            showIcon
          />
          <Card
            extra={
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => handleExport('Top Products')}
              >
                Export
              </Button>
            }
          >
            <Table
              columns={productColumns}
              dataSource={topProducts}
              rowKey="productId"
              pagination={false}
            />
          </Card>
        </Space>
      ),
    },
    {
      key: 'categories',
      label: 'Categories',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card
            title="Revenue by Category"
            extra={
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => handleExport('Category Revenue')}
              >
                Export
              </Button>
            }
          >
            <Column {...categoryConfig} height={400} />
          </Card>
        </Space>
      ),
    },
    {
      key: 'customers',
      label: 'Customers',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                title="Customer Distribution"
                extra={
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => handleExport('Customer Distribution')}
                  >
                    Export
                  </Button>
                }
              >
                <Pie {...customerConfig} height={350} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Customer Insights">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Statistic
                    title="Total Unique Customers"
                    value={mockUsers.filter((u) => u.role !== 'admin').length}
                    prefix={<UserOutlined />}
                  />
                  <Statistic
                    title="New Customers"
                    value={customerDistribution[0]?.value || 0}
                    valueStyle={{ color: '#3f8600' }}
                  />
                  <Statistic
                    title="Regular Customers"
                    value={customerDistribution[1]?.value || 0}
                    valueStyle={{ color: '#1890ff' }}
                  />
                  <Statistic
                    title="Loyal Customers"
                    value={customerDistribution[2]?.value || 0}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Space>
              </Card>
            </Col>
          </Row>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Reports & Analytics
            </Title>
            <Text type="secondary">
              Detailed insights and performance metrics
            </Text>
          </div>
          <Space wrap>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              format="YYYY-MM-DD"
              presets={[
                { label: 'Last 7 Days', value: [dayjs().subtract(7, 'day'), dayjs()] },
                { label: 'Last 30 Days', value: [dayjs().subtract(30, 'day'), dayjs()] },
                { label: 'Last 90 Days', value: [dayjs().subtract(90, 'day'), dayjs()] },
                { label: 'This Year', value: [dayjs().startOf('year'), dayjs()] },
              ]}
            />
          </Space>
        </div>

        <Card>
          <Tabs defaultActiveKey="overview" items={tabItems} />
        </Card>
      </Space>
    </div>
  );
};

export default Reports;
