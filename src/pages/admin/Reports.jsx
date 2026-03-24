import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  DatePicker,
  Segmented,
  Spin,
  App,
  Space,
  Typography,
  Tooltip,
  Button,
  InputNumber,
} from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  RiseOutlined,
  PercentageOutlined,
  BarChartOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import { Column, Heatmap, Line, Area } from '@ant-design/charts';
import dayjs from 'dayjs';
import {
  getRevenueAndProfitChart,
  getTopSellingProducts,
  getPeakHoursHeatmap,
  getRescueEfficiencyReport,
  getCashFlowChart,
  getCostRetailTrendChart,
  getAfterTaxRevenueReport,
} from '../../services/salesReportService';
import { exportReportToPdf } from '../../utils/reportPdfExport';

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
  const { message } = App.useApp();

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
  const [rescueEfficiency, setRescueEfficiency] = useState(null);
  const [cashFlowData, setCashFlowData] = useState({ data: [], summary: {} });
  const [costRetailData, setCostRetailData] = useState({ data: [], summary: {} });
  const [afterTaxRevenue, setAfterTaxRevenue] = useState({ summary: {}, tax_breakdown: {} });
  const [afterTaxRates, setAfterTaxRates] = useState({
    personal_income_tax_rate: 0.05,
    small_business_tax_rate: 0.03,
    corporate_tax_rate: 0.2,
    special_excise_tax_rate: 0.1,
  });

  // Loading states
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingPeakHours, setLoadingPeakHours] = useState(false);
  const [loadingRescue, setLoadingRescue] = useState(false);
  const [loadingCashFlow, setLoadingCashFlow] = useState(false);
  const [loadingCostRetail, setLoadingCostRetail] = useState(false);
  const [loadingAfterTax, setLoadingAfterTax] = useState(false);

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

  /**
   * Fetch Cash Flow Chart (inflows: sales, outflows: inventory + operations)
   */
  const fetchCashFlow = async () => {
    setLoadingCashFlow(true);
    try {
      const params = {
        period,
        start_date: dateRange[0]?.format('YYYY-MM-DD'),
        end_date: dateRange[1]?.format('YYYY-MM-DD'),
      };
      const response = await getCashFlowChart(params);
      if (response.success) {
        setCashFlowData(response.data);
      }
    } catch (error) {
      message.error('Không thể tải dữ liệu dòng tiền');
      console.error(error);
    } finally {
      setLoadingCashFlow(false);
    }
  };

  /**
   * Fetch Cost vs Retail Price Trend Chart
   */
  const fetchCostRetailTrend = async () => {
    setLoadingCostRetail(true);
    try {
      const params = {
        period,
        start_date: dateRange[0]?.format('YYYY-MM-DD'),
        end_date: dateRange[1]?.format('YYYY-MM-DD'),
      };
      const response = await getCostRetailTrendChart(params);
      if (response.success) {
        setCostRetailData(response.data);
      }
    } catch (error) {
      message.error('Không thể tải dữ liệu xu hướng giá vốn & giá bán');
      console.error(error);
    } finally {
      setLoadingCostRetail(false);
    }
  };

  /**
   * Fetch After-tax Revenue Report
   */
  const fetchAfterTaxRevenue = async () => {
    setLoadingAfterTax(true);
    try {
      const params = {
        start_date: dateRange[0]?.format('YYYY-MM-DD'),
        end_date: dateRange[1]?.format('YYYY-MM-DD'),
        ...afterTaxRates,
      };
      const response = await getAfterTaxRevenueReport(params);
      if (response.success) {
        setAfterTaxRevenue(response.data);
        if (response.data?.tax_rates) {
          setAfterTaxRates(response.data.tax_rates);
        }
      }
    } catch (error) {
      message.error('Không thể tải báo cáo doanh thu sau khấu trừ');
      console.error(error);
    } finally {
      setLoadingAfterTax(false);
    }
  };

  /**
   * Fetch Rescue Efficiency Report
   */
  const fetchRescueEfficiency = async () => {
    setLoadingRescue(true);
    try {
      const params = {
        start_date: dateRange[0]?.format('YYYY-MM-DD'),
        end_date: dateRange[1]?.format('YYYY-MM-DD'),
      };
      const response = await getRescueEfficiencyReport(params);
      if (response.success) {
        setRescueEfficiency(response.data);
      }
    } catch (error) {
      const status = error.response?.status;
      const is404 = status === 404;
      message.error(
        is404
          ? 'API báo cáo cứu hàng chưa sẵn sàng (404). Vui lòng khởi động lại server API.'
          : 'Không thể tải báo cáo hiệu quả cứu hàng',
        5
      );
      console.error('[Rescue efficiency report]', error?.response?.data || error);
    } finally {
      setLoadingRescue(false);
    }
  };

  // Fetch all data on mount and filter changes
  useEffect(() => {
    fetchRevenueData();
    fetchTopProducts();
    fetchPeakHours();
    fetchRescueEfficiency();
    fetchCashFlow();
    fetchCostRetailTrend();
    fetchAfterTaxRevenue();
  }, [period, dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Export current report data to PDF (uses current state snapshot)
   */
  const handleExportPdf = async () => {
    try {
      const { fontLoaded } = await exportReportToPdf({
        revenueData,
        topProducts,
        rescueEfficiency,
        cashFlowData,
        costRetailData,
        dateRange,
        period,
      });
      message.success('Đã xuất báo cáo ra PDF');
      if (!fontLoaded) {
        message.warning(
          'Font tiếng Việt không tải được (CDN chặn). Đặt NotoSans-Regular.ttf vào public/fonts/ để hiển thị đúng dấu.',
          6
        );
      }
    } catch (error) {
      message.error('Không thể xuất PDF');
      console.error('[Export PDF]', error);
    }
  };

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
  // Cash Flow: Area chart data (inflow + outflow series)
  const cashFlowChartData = (cashFlowData.data || []).flatMap((d) => [
    { label: d.label, type: 'Thu vào (Doanh thu)', value: d.inflow },
    { label: d.label, type: 'Chi ra (Tồn kho + Vận hành)', value: d.outflow_total },
  ]);

  const cashFlowChartConfig = {
    data: cashFlowChartData,
    xField: 'label',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    scale: { color: { range: ['#5AD8A6', '#E86452'] } },
    axis: { y: { labelFormatter: (v) => `${(v / 1000000).toFixed(1)}M` } },
    tooltip: {
      items: [
        { channel: 'y', name: (d) => d.type, valueFormatter: formatCurrency },
      ],
    },
    legend: { position: 'top-right' },
    height: 320,
  };

  // Cost vs Retail: Multi-line chart
  const costRetailChartData = (costRetailData.data || []).flatMap((d) => [
    { label: d.label, type: 'Giá vốn (Cost)', value: d.avg_cost },
    { label: d.label, type: 'Giá bán lẻ (Retail)', value: d.avg_retail },
  ]);

  const costRetailChartConfig = {
    data: costRetailChartData,
    xField: 'label',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    scale: { color: { range: ['#5B8FF9', '#F6BD16'] } },
    axis: { y: { labelFormatter: (v) => formatCurrency(v) } },
    tooltip: {
      items: [
        { channel: 'y', name: (d) => d.type, valueFormatter: formatCurrency },
      ],
    },
    legend: { position: 'top-right' },
    height: 320,
  };

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
            <Space size={12} align="center">
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
              <Button
                type="primary"
                icon={<FilePdfOutlined />}
                onClick={handleExportPdf}
              >
                Xuất báo cáo PDF
              </Button>
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

      {/* Rescue Efficiency Report */}
      <Card
        style={{ marginBottom: 20, borderRadius: 12 }}
        title={
          <Space size={8}>
            <ThunderboltOutlined style={{ color: '#fa8c16' }} />
            <Text strong style={{ fontSize: 15 }}>Báo cáo hiệu quả cứu hàng</Text>
          </Space>
        }
        extra={
          <Text type="secondary" style={{ fontSize: 12 }}>
            Doanh thu từ hàng giảm giá • Tổn thất • Tỷ lệ cứu thành công
          </Text>
        }
      >
        <Spin spinning={loadingRescue}>
          {rescueEfficiency ? (
            <>
              <Row gutter={[16, 16]} style={{ marginBottom: 12 }}>
                <Col xs={24} sm={8}>
                  <Card
                    size="small"
                    style={{ borderRadius: 8, borderTop: '3px solid #52c41a' }}
                    styles={{ body: { padding: '16px' } }}
                  >
                    <Space orientation="vertical" size={4}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Recovered revenue (Salvage Value)
                      </Text>
                      <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                        {formatCurrency(rescueEfficiency.recovered_revenue)}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Doanh thu từ bán hàng giảm giá (gần hết hạn)
                      </Text>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card
                    size="small"
                    style={{ borderRadius: 8, borderTop: '3px solid #ff4d4f' }}
                    styles={{ body: { padding: '16px' } }}
                  >
                    <Space orientation="vertical" size={4}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Loss of cost
                      </Text>
                      <Text strong style={{ fontSize: 18, color: '#ff4d4f' }}>
                        {formatCurrency(rescueEfficiency.loss_of_cost)}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Chi phí hàng hủy (hết hạn / hỏng / trả lô)
                      </Text>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card
                    size="small"
                    style={{ borderRadius: 8, borderTop: '3px solid #1677ff' }}
                    styles={{ body: { padding: '16px' } }}
                  >
                    <Space orientation="vertical" size={4}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Successful rescue rate
                      </Text>
                      <Text strong style={{ fontSize: 18, color: '#1677ff' }}>
                        {rescueEfficiency.successful_rescue_rate}%
                      </Text>
                      <Tooltip title="Tổng lượng gần hết hạn = Lượng bán giảm giá + Lượng hủy trong kỳ">
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          (Số lượng bán giảm giá / Tổng lượng gần hết hạn) × 100%
                        </Text>
                      </Tooltip>
                    </Space>
                  </Card>
                </Col>
              </Row>
              <Row gutter={8}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <CheckCircleOutlined /> Lượng bán với giá giảm: {rescueEfficiency.quantity_sold_at_discount ?? 0} (đơn vị)
                  </Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <WarningOutlined /> Lượng hủy: {rescueEfficiency.quantity_destroyed ?? 0} (đơn vị)
                  </Text>
                </Col>
              </Row>
              <Row style={{ marginTop: 4 }}>
                <Col span={24}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Tổng lượng gần hết hạn (mẫu số) = {rescueEfficiency.total_quantity_nearing_expiry ?? 0} = bán giảm giá + hủy
                  </Text>
                </Col>
              </Row>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <ThunderboltOutlined style={{ fontSize: 40, color: '#d9d9d9', marginBottom: 10, display: 'block' }} />
              <Text type="secondary">Không có dữ liệu hiệu quả cứu hàng</Text>
            </div>
          )}
        </Spin>
      </Card>

      {/* Finance Report: Cash Flow Chart (Area) */}
      <Card
        style={{ marginBottom: 20, borderRadius: 12 }}
        title={
          <Space size={8}>
            <div style={{ width: 4, height: 18, background: '#5AD8A6', borderRadius: 2 }} />
            <Text strong style={{ fontSize: 15 }}>Dòng tiền (Cash Flow)</Text>
          </Space>
        }
        extra={
          <Text type="secondary" style={{ fontSize: 12 }}>
            Thu vào: doanh thu bán hàng • Chi ra: tồn kho (nhập) + vận hành (hủy hàng)
          </Text>
        }
      >
        <Spin spinning={loadingCashFlow}>
          {cashFlowChartData.length > 0 ? (
            <Area {...cashFlowChartConfig} />
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <DollarOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 12, display: 'block' }} />
              <Text type="secondary">Không có dữ liệu dòng tiền trong khoảng thời gian này</Text>
            </div>
          )}
        </Spin>
      </Card>

      {/* Finance Report: Cost vs Retail Price Trend (Multi-line) */}
      <Card
        style={{ marginBottom: 20, borderRadius: 12 }}
        title={
          <Space size={8}>
            <div style={{ width: 4, height: 18, background: '#5B8FF9', borderRadius: 2 }} />
            <Text strong style={{ fontSize: 15 }}>Xu hướng Giá vốn vs Giá bán lẻ</Text>
          </Space>
        }
        extra={
          <Text type="secondary" style={{ fontSize: 12 }}>
            Theo dõi biên lợi nhuận gộp (gross margin) có bị thu hẹp khi giá nhập tăng
          </Text>
        }
      >
        <Spin spinning={loadingCostRetail}>
          {costRetailChartData.length > 0 ? (
            <Line {...costRetailChartConfig} />
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <RiseOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 12, display: 'block' }} />
              <Text type="secondary">Không có dữ liệu xu hướng giá (cần đơn hàng có batch)</Text>
            </div>
          )}
        </Spin>
      </Card>

      {/* Finance Report: After-tax Revenue (Net Revenue after deductions) */}
      <Card
        style={{ marginBottom: 20, borderRadius: 12 }}
        title={
          <Space size={8}>
            <div style={{ width: 4, height: 18, background: '#13c2c2', borderRadius: 2 }} />
            <Text strong style={{ fontSize: 15 }}>After-tax report: Doanh thu sau khấu trừ</Text>
          </Space>
        }
        extra={
          <Text type="secondary" style={{ fontSize: 12 }}>
            Hiển thị doanh thu ròng sau khi trừ giảm giá, hoàn trả và thuế
          </Text>
        }
      >
        <Spin spinning={loadingAfterTax}>
          <Row gutter={[12, 12]} style={{ marginBottom: 14 }}>
            <Col xs={24}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Cấu hình thuế cho report (nhập dạng phần trăm, ví dụ 5 = 5%)
              </Text>
            </Col>
            <Col xs={24} md={6}>
              <Space direction="vertical" size={2} style={{ width: '100%' }}>
                <Text style={{ fontSize: 12 }}>Thuế cá nhân (%)</Text>
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  style={{ width: '100%' }}
                  value={(afterTaxRates.personal_income_tax_rate || 0) * 100}
                  onChange={(value) =>
                    setAfterTaxRates((prev) => ({
                      ...prev,
                      personal_income_tax_rate: Number(value || 0) / 100,
                    }))
                  }
                />
              </Space>
            </Col>
            <Col xs={24} md={6}>
              <Space direction="vertical" size={2} style={{ width: '100%' }}>
                <Text style={{ fontSize: 12 }}>Thuế buôn bán nhỏ lẻ (%)</Text>
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  style={{ width: '100%' }}
                  value={(afterTaxRates.small_business_tax_rate || 0) * 100}
                  onChange={(value) =>
                    setAfterTaxRates((prev) => ({
                      ...prev,
                      small_business_tax_rate: Number(value || 0) / 100,
                    }))
                  }
                />
              </Space>
            </Col>
            <Col xs={24} md={6}>
              <Space direction="vertical" size={2} style={{ width: '100%' }}>
                <Text style={{ fontSize: 12 }}>Thuế doanh nghiệp (%)</Text>
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  style={{ width: '100%' }}
                  value={(afterTaxRates.corporate_tax_rate || 0) * 100}
                  onChange={(value) =>
                    setAfterTaxRates((prev) => ({
                      ...prev,
                      corporate_tax_rate: Number(value || 0) / 100,
                    }))
                  }
                />
              </Space>
            </Col>
            <Col xs={24} md={6}>
              <Space direction="vertical" size={2} style={{ width: '100%' }}>
                <Text style={{ fontSize: 12 }}>Thuế hàng hóa đặc biệt (%)</Text>
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  style={{ width: '100%' }}
                  value={(afterTaxRates.special_excise_tax_rate || 0) * 100}
                  onChange={(value) =>
                    setAfterTaxRates((prev) => ({
                      ...prev,
                      special_excise_tax_rate: Number(value || 0) / 100,
                    }))
                  }
                />
              </Space>
            </Col>
            <Col xs={24}>
              <Button type="primary" onClick={fetchAfterTaxRevenue} loading={loadingAfterTax}>
                Áp dụng cấu hình thuế
              </Button>
            </Col>
          </Row>

          {(afterTaxRevenue?.summary?.gross_revenue || 0) > 0 ? (
            <>
              <Row gutter={[16, 16]} style={{ marginBottom: 12 }}>
                <Col xs={24} sm={8}>
                  <Card size="small" style={{ borderRadius: 8, borderTop: '3px solid #1677ff' }}>
                    <Space direction="vertical" size={2}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Tổng doanh thu gộp</Text>
                      <Text strong style={{ fontSize: 18, color: '#1677ff' }}>
                        {formatCurrency(afterTaxRevenue.summary.gross_revenue)}
                      </Text>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small" style={{ borderRadius: 8, borderTop: '3px solid #fa8c16' }}>
                    <Space direction="vertical" size={2}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Tổng khoản khấu trừ</Text>
                      <Text strong style={{ fontSize: 18, color: '#fa8c16' }}>
                        {formatCurrency(
                          (afterTaxRevenue.summary.total_discount || 0) +
                          (afterTaxRevenue.summary.total_returns || 0) +
                          (afterTaxRevenue.summary.total_tax || 0)
                        )}
                      </Text>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small" style={{ borderRadius: 8, borderTop: '3px solid #52c41a' }}>
                    <Space direction="vertical" size={2}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Doanh thu ròng</Text>
                      <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                        {formatCurrency(afterTaxRevenue.summary.net_revenue)}
                      </Text>
                    </Space>
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 12]}>
                <Col xs={24} md={12}>
                  <Card size="small" style={{ borderRadius: 8 }}>
                    <Space direction="vertical" size={6} style={{ width: '100%' }}>
                      <Text strong>Chi tiết khấu trừ</Text>
                      <Text type="secondary">Giảm giá: {formatCurrency(afterTaxRevenue.summary.total_discount)}</Text>
                      <Text type="secondary">Hoàn trả: {formatCurrency(afterTaxRevenue.summary.total_returns)}</Text>
                      <Text type="secondary">Doanh thu chịu thuế: {formatCurrency(afterTaxRevenue.summary.taxable_revenue)}</Text>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card size="small" style={{ borderRadius: 8 }}>
                    <Space direction="vertical" size={6} style={{ width: '100%' }}>
                      <Text strong>Chi tiết thuế</Text>
                      <Text type="secondary">
                        Thuế cá nhân: {formatCurrency(afterTaxRevenue.tax_breakdown?.personal_income_tax)}
                      </Text>
                      <Text type="secondary">
                        Thuế buôn bán nhỏ lẻ: {formatCurrency(afterTaxRevenue.tax_breakdown?.small_business_tax)}
                      </Text>
                      <Text type="secondary">
                        Thuế doanh nghiệp: {formatCurrency(afterTaxRevenue.tax_breakdown?.corporate_tax)}
                      </Text>
                      <Text type="secondary">
                        Thuế hàng hóa đặc biệt: {formatCurrency(afterTaxRevenue.tax_breakdown?.special_excise_tax)}
                      </Text>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <DollarOutlined style={{ fontSize: 42, color: '#d9d9d9', marginBottom: 10, display: 'block' }} />
              <Text type="secondary">Không có dữ liệu doanh thu sau khấu trừ trong khoảng thời gian này</Text>
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
