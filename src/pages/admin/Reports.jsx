import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  DatePicker,
  Segmented,
  Spin,
  message,
  Space,
  Typography,
  Tooltip,
} from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  RiseOutlined,
  PercentageOutlined,
  BarChartOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { Column, Heatmap } from '@ant-design/charts';
import dayjs from 'dayjs';
import {
  getRevenueAndProfitChart,
  getTopSellingProducts,
  getPeakHoursHeatmap,
} from '../../services/salesReportService';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const MEDAL_BG = ['#fffbe6', '#fafafa', '#fff7e6'];
const MEDAL_BORDER = ['#ffe58f', '#e8e8e8', '#ffd591'];
const MEDAL_COLOR = ['#d48806', '#8c8c8c', '#ad4e00'];

/**
 * Format number to VND currency
 */
const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value || 0);
};

/**
 * Reports Dashboard with Revenue & Profit, Top Products, Peak Hours
 */
function Reports() {
  // State for filters
  const [period, setPeriod] = useState('day');
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);

  // State for chart data
  const [revenueData, setRevenueData] = useState({ data: [], summary: {} });
  const [topProducts, setTopProducts] = useState({ data: [] });
  const [peakHours, setPeakHours] = useState({ data: [] });

  // Loading states
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingPeakHours, setLoadingPeakHours] = useState(false);

  /**
   * Fetch Revenue & Profit data
   */
  const fetchRevenueData = async () => {
    setLoadingRevenue(true);
    try {
      const params = {
        period,
        start_date: dateRange[0]?.format('YYYY-MM-DD'),
        end_date: dateRange[1]?.format('YYYY-MM-DD'),
      };
      const response = await getRevenueAndProfitChart(params);
      if (response.success) {
        setRevenueData(response.data);
      }
    } catch (error) {
      message.error('Không thể tải dữ liệu doanh thu');
      console.error(error);
    } finally {
      setLoadingRevenue(false);
    }
  };

  /**
   * Fetch Top Selling Products
   */
  const fetchTopProducts = async () => {
    setLoadingProducts(true);
    try {
      const params = {
        limit: 10,
        start_date: dateRange[0]?.format('YYYY-MM-DD'),
        end_date: dateRange[1]?.format('YYYY-MM-DD'),
      };
      const response = await getTopSellingProducts(params);
      if (response.success) {
        setTopProducts(response.data);
      }
    } catch (error) {
      message.error('Không thể tải dữ liệu sản phẩm bán chạy');
      console.error(error);
    } finally {
      setLoadingProducts(false);
    }
  };

  /**
   * Fetch Peak Hours Heatmap
   */
  const fetchPeakHours = async () => {
    setLoadingPeakHours(true);
    try {
      const params = {
        start_date: dateRange[0]?.format('YYYY-MM-DD'),
        end_date: dateRange[1]?.format('YYYY-MM-DD'),
      };
      const response = await getPeakHoursHeatmap(params);
      if (response.success) {
        // Backend returns nested: { heatmap: [{day_name, hours:[{hour,order_count,...}]}] }
        // Flatten to [{day_name, hour, order_count, total_revenue}] for Heatmap chart
        const flatData = (response.data.heatmap || []).flatMap((day) =>
          day.hours.map((h) => ({
            day_name: day.day_name,
            hour: `${h.hour}h`,
            order_count: h.order_count,
            total_revenue: h.total_revenue,
          }))
        );
        setPeakHours({ data: flatData });
      }
    } catch (error) {
      message.error('Không thể tải dữ liệu giờ cao điểm');
      console.error(error);
    } finally {
      setLoadingPeakHours(false);
    }
  };

  // Fetch all data on mount and filter changes
  useEffect(() => {
    fetchRevenueData();
    fetchTopProducts();
    fetchPeakHours();
  }, [period, dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  // Revenue & Profit Grouped Column Chart Config
  const revenueChartData = (revenueData.data || []).flatMap((d) => [
    { label: d.label, type: 'Doanh thu', value: d.revenue },
    { label: d.label, type: 'Lợi nhuận', value: d.profit },
  ]);

  const revenueChartConfig = {
    data: revenueChartData,
    xField: 'label',
    yField: 'value',
    colorField: 'type',
    group: true,
    scale: { color: { range: ['#5B8FF9', '#5AD8A6'] } },
    label: false,
    tooltip: {
      items: [
        { channel: 'y', name: (d) => d.type, valueFormatter: formatCurrency },
      ],
    },
    legend: { position: 'top-right' },
    axis: { y: { labelFormatter: (v) => `${(v / 1000000).toFixed(1)}M` } },
    height: 350,
  };


  // Peak Hours Heatmap Config — flush cells, vertical legend on right (like reference image)
  const peakHoursConfig = {
    data: peakHours.data || [],
    xField: 'hour',
    yField: 'day_name',
    colorField: 'order_count',
    scale: {
      color: {
        range: ['#fff5f0', '#fcc4b8', '#fb8172', '#ef3b2c', '#99000d'],
      },
    },
    style: {
      inset: 0.5,
    },
    label: false,
    tooltip: {
      title: (d) => `${d.day_name} — ${d.hour}`,
      items: [
        { field: 'order_count', name: 'Số đơn hàng' },
        { field: 'total_revenue', name: 'Doanh thu', valueFormatter: formatCurrency },
      ],
    },
    height: 300,
    legend: {
      color: {
        position: 'right',
        layout: { justifyContent: 'center' },
        ribbon: { len: 200, size: 16 },
      },
    },
    axis: {
      x: {
        position: 'top',
        title: false,
        labelSpacing: 4,
        tick: false,
        labelFontSize: 11,
      },
      y: {
        title: false,
        tick: false,
        labelFontSize: 11,
      },
    },
  };

  const statCards = [
    {
      title: 'Tổng doanh thu',
      value: revenueData.summary?.total_revenue || 0,
      icon: <DollarOutlined />,
      color: '#1677ff',
      bgColor: '#e6f4ff',
      format: formatCurrency,
      suffix: '',
    },
    {
      title: 'Tổng lợi nhuận',
      value: revenueData.summary?.total_profit || 0,
      icon: <RiseOutlined />,
      color: '#52c41a',
      bgColor: '#f6ffed',
      format: formatCurrency,
      suffix: '',
    },
    {
      title: 'Tổng đơn hàng',
      value: revenueData.summary?.total_orders || 0,
      icon: <ShoppingCartOutlined />,
      color: '#722ed1',
      bgColor: '#f9f0ff',
      format: (v) => v.toLocaleString('vi-VN'),
      suffix: ' đơn',
    },
    {
      title: 'Tỷ lệ lợi nhuận',
      value: revenueData.summary?.total_revenue
        ? +((revenueData.summary.total_profit / revenueData.summary.total_revenue) * 100).toFixed(1)
        : 0,
      icon: <PercentageOutlined />,
      color: '#eb2f96',
      bgColor: '#fff0f6',
      format: (v) => v,
      suffix: '%',
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0, lineHeight: '26px' }}>Báo cáo doanh số</Title>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card
        style={{ marginBottom: 20, borderRadius: 12 }}
        styles={{ body: { padding: '14px 20px' } }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 10]}>
          <Col>
            <Space size={8} align="center">
              <CalendarOutlined style={{ color: '#8c8c8c' }} />
              <Text type="secondary">Khoảng thời gian:</Text>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                format="DD/MM/YYYY"
                allowClear={false}
              />
            </Space>
          </Col>
          <Col>
            <Space size={8} align="center">
              <Text type="secondary">Hiển thị theo:</Text>
              <Segmented
                value={period}
                onChange={setPeriod}
                options={[
                  { label: 'Ngày', value: 'day' },
                  { label: 'Tuần', value: 'week' },
                  { label: 'Tháng', value: 'month' },
                ]}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Summary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {statCards.map((stat, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card
              style={{ borderRadius: 12, borderTop: `3px solid ${stat.color}` }}
              styles={{ body: { padding: '20px 24px' } }}
            >
              <Row justify="space-between" align="middle">
                <Col>
                  <Text
                    type="secondary"
                    style={{ fontSize: 13, display: 'block', marginBottom: 6 }}
                  >
                    {stat.title}
                  </Text>
                  <Text strong style={{ fontSize: 22, color: stat.color, lineHeight: '30px' }}>
                    {stat.format(stat.value)}{stat.suffix}
                  </Text>
                </Col>
                <Col>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 12,
                      background: stat.bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      color: stat.color,
                    }}
                  >
                    {stat.icon}
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Revenue & Profit Chart */}
      <Card
        style={{ marginBottom: 20, borderRadius: 12 }}
        title={
          <Space size={8}>
            <div style={{ width: 4, height: 18, background: '#1677ff', borderRadius: 2 }} />
            <Text strong style={{ fontSize: 15 }}>Doanh thu & Lợi nhuận</Text>
          </Space>
        }
        extra={
          <Space size={16}>
            <Space size={6}>
              <div style={{ width: 12, height: 12, background: '#5B8FF9', borderRadius: 2 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>Doanh thu</Text>
            </Space>
            <Space size={6}>
              <div style={{ width: 12, height: 12, background: '#5AD8A6', borderRadius: 2 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>Lợi nhuận</Text>
            </Space>
          </Space>
        }
      >
        <Spin spinning={loadingRevenue}>
          {revenueData.data?.length > 0 ? (
            <Column {...revenueChartConfig} />
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <BarChartOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 12, display: 'block' }} />
              <Text type="secondary">Không có dữ liệu trong khoảng thời gian này</Text>
            </div>
          )}
        </Spin>
      </Card>

      <Row gutter={[20, 20]}>
        {/* Top Selling Products */}
        <Col xs={24} lg={12}>
          <Card
            style={{ height: '100%', borderRadius: 12 }}
            styles={{ body: { padding: '16px 20px' } }}
            title={
              <Space size={8}>
                <div style={{ width: 4, height: 18, background: '#722ed1', borderRadius: 2 }} />
                <Text strong style={{ fontSize: 15 }}>Top sản phẩm bán chạy</Text>
              </Space>
            }
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                {topProducts.data?.length || 0} sản phẩm
              </Text>
            }
          >
            <Spin spinning={loadingProducts}>
              {topProducts.data?.length > 0 ? (() => {
                const maxRev = topProducts.data[0]?.total_revenue || 1;
                return (
                  <div style={{ maxHeight: 370, overflowY: 'auto', paddingRight: 4 }}>
                    <Row gutter={[8, 8]}>
                      {topProducts.data.map((item, i) => (
                        <Col span={24} key={i}>
                          <Tooltip
                            title={`${item.category_name ? item.category_name + ' • ' : ''}${item.total_quantity || 0} sản phẩm bán`}
                            placement="right"
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '7px 10px',
                                borderRadius: 8,
                                background: i < 3 ? MEDAL_BG[i] : '#fafafa',
                                border: `1px solid ${i < 3 ? MEDAL_BORDER[i] : '#f0f0f0'}`,
                                cursor: 'default',
                              }}
                            >
                              {/* Rank badge */}
                              <div style={{
                                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                                background: i < 3 ? MEDAL_COLOR[i] : '#e8e8e8',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 700,
                                color: i < 3 ? '#fff' : '#8c8c8c',
                              }}>
                                {i + 1}
                              </div>

                              {/* Name + bar */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                                  <Text
                                    style={{ fontSize: 13, fontWeight: 500, maxWidth: '60%' }}
                                    ellipsis
                                  >
                                    {item.product_name}
                                  </Text>
                                  <Text style={{ fontSize: 12, color: i < 3 ? MEDAL_COLOR[i] : '#1677ff', flexShrink: 0, fontWeight: 600 }}>
                                    {formatCurrency(item.total_revenue)}
                                  </Text>
                                </div>
                                {/* Progress bar */}
                                <div style={{ height: 5, borderRadius: 3, background: '#f0f0f0', overflow: 'hidden' }}>
                                  <div style={{
                                    width: `${Math.round((item.total_revenue / maxRev) * 100)}%`,
                                    height: '100%',
                                    borderRadius: 3,
                                    background: i < 3
                                      ? MEDAL_COLOR[i]
                                      : `hsl(${220 + i * 8}, 70%, ${55 + i * 3}%)`,
                                    transition: 'width 0.4s ease',
                                  }} />
                                </div>
                              </div>

                              {/* Quantity pill */}
                              <div style={{
                                flexShrink: 0, fontSize: 11, color: '#8c8c8c',
                                background: '#f5f5f5', borderRadius: 10,
                                padding: '1px 7px', whiteSpace: 'nowrap',
                              }}>
                                {item.total_quantity || 0} bán
                              </div>
                            </div>
                          </Tooltip>
                        </Col>
                      ))}
                    </Row>
                  </div>
                );
              })() : (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <ShoppingCartOutlined style={{ fontSize: 40, color: '#d9d9d9', marginBottom: 10, display: 'block' }} />
                  <Text type="secondary">Không có dữ liệu sản phẩm</Text>
                </div>
              )}
            </Spin>
          </Card>
        </Col>

        {/* Peak Hours Heatmap */}
        <Col xs={24} lg={12}>
          <Card
            style={{ height: '100%', borderRadius: 12 }}
            title={
              <Space size={8}>
                <div style={{ width: 4, height: 18, background: '#eb2f96', borderRadius: 2 }} />
                <Text strong style={{ fontSize: 15 }}>Giờ cao điểm</Text>
              </Space>
            }
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                Gợi ý sắp xếp ca nhân viên
              </Text>
            }
          >
            <Spin spinning={loadingPeakHours}>
              {peakHours.data?.length > 0 ? (
                <Heatmap {...peakHoursConfig} />
              ) : (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <CalendarOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 12, display: 'block' }} />
                  <Text type="secondary">Không có dữ liệu giờ cao điểm</Text>
                </div>
              )}
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Reports;
