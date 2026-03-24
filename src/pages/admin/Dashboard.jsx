import { useEffect, useState } from 'react';
import { Card, Col, Row, Typography, DatePicker, Space, Segmented, message, Spin, Table } from 'antd';
import {
	DollarOutlined,
	ShoppingCartOutlined,
	RiseOutlined,
	TrophyOutlined,
	BarChartOutlined,
} from '@ant-design/icons';
import { Column } from '@ant-design/charts';
import salesReportService from '../../services/salesReportService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const formatCurrency = (value) =>
	Number(value || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const Dashboard = () => {
	const [summaryLoading, setSummaryLoading] = useState(false);
	const [chartLoading, setChartLoading] = useState(false);
	const [topProductsLoading, setTopProductsLoading] = useState(false);

	const [summary, setSummary] = useState(null);
	const [chartData, setChartData] = useState([]);
	const [topProducts, setTopProducts] = useState([]);
	const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'day'), dayjs()]);
	const [period, setPeriod] = useState('day');

	const fetchSummary = async (startDate, endDate) => {
		setSummaryLoading(true);
		try {
			const response = await salesReportService.getSalesSummary({
				start_date: startDate?.toISOString(),
				end_date: endDate?.toISOString(),
			});
			const rawSummary =
				response?.data?.summary ||
				response?.data?.data?.summary ||
				response?.summary ||
				{};

			const safeRevenue = Number(rawSummary.total_revenue || 0);
			const safeTax = Number(rawSummary.total_tax || 0);
			const safeProfit =
				rawSummary.total_profit !== undefined && rawSummary.total_profit !== null
					? Number(rawSummary.total_profit)
					: Math.max(0, safeRevenue - safeTax);

			setSummary({
				...rawSummary,
				total_revenue: safeRevenue,
				total_tax: safeTax,
				total_profit: safeProfit,
			});
		} catch (error) {
			message.error(error.message || 'Không thể tải thống kê tổng quan');
		} finally {
			setSummaryLoading(false);
		}
	};

	const fetchChartData = async (startDate, endDate, selectedPeriod) => {
		setChartLoading(true);
		try {
			const response = await salesReportService.getRevenueAndProfitChart({
				period: selectedPeriod,
				start_date: startDate?.toISOString(),
				end_date: endDate?.toISOString(),
			});

			// Transform data for chart
			const transformed = response.data.data.map((item) => ({
				date: item.label,
				type: 'Doanh thu',
				value: item.revenue,
			})).concat(
				response.data.data.map((item) => ({
					date: item.label,
					type: 'Lợi nhuận',
					value: item.profit,
				}))
			);

			setChartData(transformed);
		} catch (error) {
			message.error(error.message || 'Không thể tải dữ liệu biểu đồ');
		} finally {
			setChartLoading(false);
		}
	};

	const fetchTopProducts = async (startDate, endDate) => {
		setTopProductsLoading(true);
		try {
			const response = await salesReportService.getTopSellingProducts({
				limit: 10,
				start_date: startDate?.toISOString(),
				end_date: endDate?.toISOString(),
			});
			setTopProducts(response.data.data || []);
		} catch (error) {
			message.error(error.message || 'Không thể tải top sản phẩm');
		} finally {
			setTopProductsLoading(false);
		}
	};

	useEffect(() => {
		if (dateRange && dateRange[0] && dateRange[1]) {
			Promise.all([
				fetchSummary(dateRange[0], dateRange[1]),
				fetchChartData(dateRange[0], dateRange[1], period),
				fetchTopProducts(dateRange[0], dateRange[1]),
			]);
		}
	}, [dateRange, period]);

	const handleDateRangeChange = (dates) => {
		if (dates && dates[0] && dates[1]) {
			setDateRange([dates[0].startOf('day'), dates[1].endOf('day')]);
		}
	};

	const columnChartConfig = {
		data: chartData,
		xField: 'date',
		yField: 'value',
		colorField: 'type',
		seriesField: 'type',
		isGroup: true,
		scale: {
			color: {
				domain: ['Doanh thu', 'Lợi nhuận'],
				range: ['#5B8FF9', '#5AD8A6'],
			},
		},
		color: ['#5B8FF9', '#5AD8A6'],
		columnStyle: {
			radius: [4, 4, 0, 0],
		},
		animation: {
			appear: {
				animation: 'scale-in-y',
				duration: 800,
			},
		},
		legend: {
			position: 'top',
		},
		yAxis: {
			label: {
				formatter: (v) => `${(parseFloat(v) / 1000000).toFixed(1)}M`,
			},
		},
		tooltip: {
			items: [
				{
					channel: 'y',
					name: (d) => d.type,
					valueFormatter: (v) => `${Number(v || 0).toLocaleString('vi-VN')} đ`,
				},
			],
		},
	};

	const topProductsColumns = [
		{
			title: '#',
			key: 'index',
			width: 50,
			render: (_, __, index) => (
				<Text strong style={{ fontSize: 16 }}>
					{index + 1}
				</Text>
			),
		},
		{
			title: 'Sản phẩm',
			dataIndex: 'product_name',
			key: 'product_name',
			render: (name) => <Text strong>{name}</Text>,
		},
		{
			title: 'Số lượng bán',
			dataIndex: 'total_quantity',
			key: 'total_quantity',
			width: 130,
			sorter: (a, b) => a.total_quantity - b.total_quantity,
			render: (qty) => <Text>{qty.toLocaleString()}</Text>,
		},
		{
			title: 'Doanh thu',
			dataIndex: 'total_revenue',
			key: 'total_revenue',
			width: 150,
			sorter: (a, b) => a.total_revenue - b.total_revenue,
			render: (revenue) => (
				<Text strong style={{ color: '#5AD8A6' }}>
					{formatCurrency(revenue)}
				</Text>
			),
		},
	];

	const statCards = [
		{
			title: 'Tổng doanh thu',
			value: summary?.total_revenue || 0,
			icon: <DollarOutlined />,
			color: '#1677ff',
			bgColor: '#e6f4ff',
			format: formatCurrency,
			suffix: '',
		},
		{
			title: 'Tổng lợi nhuận',
			value:
				summary?.total_profit ??
				Math.max(0, Number(summary?.total_revenue || 0) - Number(summary?.total_tax || 0)),
			icon: <RiseOutlined />,
			color: '#52c41a',
			bgColor: '#f6ffed',
			format: formatCurrency,
			suffix: '',
		},
		{
			title: 'Tổng đơn hàng',
			value: summary?.total_orders || 0,
			icon: <ShoppingCartOutlined />,
			color: '#722ed1',
			bgColor: '#f9f0ff',
			format: (v) => Number(v || 0).toLocaleString('vi-VN'),
			suffix: ' đơn',
		},
	];

	return (
		<div style={{ padding: '24px' }}>
			<Space direction="vertical" size="large" style={{ width: '100%' }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
					<Title level={2} style={{ margin: 0 }}>
						Dashboard
					</Title>
					<Space size={12} align="center" wrap>
						<RangePicker
							value={dateRange}
							onChange={handleDateRangeChange}
							format="DD/MM/YYYY"
							allowClear={false}
							presets={[
								{ label: '7 ngày qua', value: [dayjs().subtract(7, 'day'), dayjs()] },
								{ label: '30 ngày qua', value: [dayjs().subtract(30, 'day'), dayjs()] },
								{ label: '90 ngày qua', value: [dayjs().subtract(90, 'day'), dayjs()] },
								{ label: 'Tháng này', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
								{ label: 'Tháng trước', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
							]}
						/>
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
				</div>

				{summaryLoading ? (
					<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
						<Spin size="large" />
					</div>
				) : (
					<Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
						{statCards.map((stat, i) => (
							<Col xs={24} sm={12} lg={8} key={i}>
								<Card style={{ borderRadius: 12, borderTop: `3px solid ${stat.color}` }} styles={{ body: { padding: '20px 24px' } }}>
									<Row justify="space-between" align="middle">
										<Col>
											<Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
												{stat.title}
											</Text>
											<Text strong style={{ fontSize: 22, color: stat.color, lineHeight: '30px' }}>
												{stat.format(stat.value)}
												{stat.suffix}
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
				)}

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
					<Spin spinning={chartLoading}>
						{chartData.length > 0 ? (
							<Column {...columnChartConfig} />
						) : (
							<div style={{ textAlign: 'center', padding: '80px 0' }}>
								<BarChartOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 12, display: 'block' }} />
								<Text type="secondary">Không có dữ liệu trong khoảng thời gian này</Text>
							</div>
						)}
					</Spin>
				</Card>

				<Card
					title={
						<Space>
							<TrophyOutlined />
							<span>Top 10 Sản phẩm bán chạy</span>
						</Space>
					}
					loading={topProductsLoading}
				>
					<Table
						columns={topProductsColumns}
						dataSource={topProducts}
						rowKey="product_id"
						pagination={false}
						locale={{
							emptyText: 'Chưa có dữ liệu',
						}}
					/>
				</Card>

				<Row gutter={[16, 16]}>
					<Col xs={24} md={12}>
						<Card title="Thống kê chi tiết">
							<Space direction="vertical" style={{ width: '100%' }} size="middle">
								<div style={{ display: 'flex', justifyContent: 'space-between' }}>
									<Text>Tổng doanh thu:</Text>
									<Text strong style={{ fontSize: 16, color: '#3f8600' }}>
										{formatCurrency(summary?.total_revenue || 0)}
									</Text>
								</div>
								<div style={{ display: 'flex', justifyContent: 'space-between' }}>
									<Text>Tổng thuế:</Text>
									<Text strong style={{ fontSize: 16 }}>
										{formatCurrency(summary?.total_tax || 0)}
									</Text>
								</div>
								<div style={{ display: 'flex', justifyContent: 'space-between' }}>
									<Text>Tổng giảm giá:</Text>
									<Text strong style={{ fontSize: 16, color: '#ff4d4f' }}>
										{formatCurrency(summary?.total_discount || 0)}
									</Text>
								</div>
								<div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
									<Text strong>Lợi nhuận ròng:</Text>
									<Text strong style={{ fontSize: 18, color: '#52c41a' }}>
										{formatCurrency((summary?.total_revenue || 0) - (summary?.total_tax || 0))}
									</Text>
								</div>
							</Space>
						</Card>
					</Col>
					<Col xs={24} md={12}>
						<Card title="Hiệu suất bán hàng">
							<Space direction="vertical" style={{ width: '100%' }} size="middle">
								<div style={{ display: 'flex', justifyContent: 'space-between' }}>
									<Text>Tổng đơn hàng:</Text>
									<Text strong style={{ fontSize: 16 }}>
										{summary?.total_orders || 0} đơn
									</Text>
								</div>
								<div style={{ display: 'flex', justifyContent: 'space-between' }}>
									<Text>Giá trị TB/đơn:</Text>
									<Text strong style={{ fontSize: 16, color: '#1890ff' }}>
										{formatCurrency(summary?.avg_order_value || 0)}
									</Text>
								</div>
								{summary?.total_orders > 0 && (
									<>
										<div style={{ display: 'flex', justifyContent: 'space-between' }}>
											<Text>Doanh thu TB/ngày:</Text>
											<Text strong style={{ fontSize: 16 }}>
												{formatCurrency((summary?.total_revenue || 0) / Math.max(1, dateRange[1].diff(dateRange[0], 'day')))}
											</Text>
										</div>
										<div style={{ display: 'flex', justifyContent: 'space-between' }}>
											<Text>Đơn hàng TB/ngày:</Text>
											<Text strong style={{ fontSize: 16 }}>
												{((summary?.total_orders || 0) / Math.max(1, dateRange[1].diff(dateRange[0], 'day'))).toFixed(1)} đơn
											</Text>
										</div>
									</>
								)}
							</Space>
						</Card>
					</Col>
				</Row>
			</Space>
		</div>
	);
};

export default Dashboard;
