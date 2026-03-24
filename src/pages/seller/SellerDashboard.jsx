import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Table, Typography, DatePicker, Space, Tag, message, Spin } from 'antd';
import {
	DollarOutlined,
	ShoppingCartOutlined,
	CheckCircleOutlined,
	ClockCircleOutlined,
	RiseOutlined,
} from '@ant-design/icons';
import sellerOrderService from '../../services/sellerOrderService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const EMPTY_STATS = {
	total_orders: 0,
	total_amount: 0,
	pending_orders: 0,
	processing_orders: 0,
	completed_orders: 0,
	cancelled_orders: 0,
};

const formatCurrency = (value) =>
	Number(value || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const getOrderStatusTag = (status) => {
	const statusMap = {
		pending: { color: 'orange', text: 'Chờ xử lý' },
		processing: { color: 'blue', text: 'Đang xử lý' },
		completed: { color: 'green', text: 'Hoàn thành' },
		cancelled: { color: 'red', text: 'Đã hủy' },
		returned: { color: 'purple', text: 'Đã trả hàng' },
	};
	const config = statusMap[status] || { color: 'default', text: status };
	return <Tag color={config.color}>{config.text}</Tag>;
};

const getPaymentStatusTag = (status) => {
	const statusMap = {
		unpaid: { color: 'red', text: 'Chưa thanh toán' },
		paid: { color: 'green', text: 'Đã thanh toán' },
		refunded: { color: 'purple', text: 'Đã hoàn tiền' },
	};
	const config = statusMap[status] || { color: 'default', text: status };
	return <Tag color={config.color}>{config.text}</Tag>;
};

const SellerDashboard = () => {
	const [loading, setLoading] = useState(false);
	const [statsLoading, setStatsLoading] = useState(false);
	const [stats, setStats] = useState(EMPTY_STATS);
	const [orders, setOrders] = useState([]);
	const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'day').startOf('day'), dayjs().endOf('day')]);

	const fetchStats = async (startDate, endDate) => {
		setStatsLoading(true);
		try {
			const response = await sellerOrderService.getOrderStats(
				startDate?.format('YYYY-MM-DD'),
				endDate?.format('YYYY-MM-DD')
			);
			const normalizedStats = response?.stats || response?.data?.stats || EMPTY_STATS;
			setStats({ ...EMPTY_STATS, ...normalizedStats });
		} catch (error) {
			message.error(error.message || 'Không thể tải thống kê');
			setStats(EMPTY_STATS);
		} finally {
			setStatsLoading(false);
		}
	};

	const fetchRecentOrders = async () => {
		setLoading(true);
		try {
			const response = await sellerOrderService.getOrderList({
				page: 1,
				limit: 10,
				sort_by: 'created_at',
				sort_order: 'desc',
			});
			setOrders(response?.orders || response?.data?.orders || []);
		} catch (error) {
			message.error(error.message || 'Không thể tải danh sách đơn hàng');
			setOrders([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (dateRange && dateRange[0] && dateRange[1]) {
			fetchStats(dateRange[0], dateRange[1]);
		}
		fetchRecentOrders();
	}, [dateRange]);

	const handleDateRangeChange = (dates) => {
		if (dates && dates[0] && dates[1]) {
			setDateRange([dates[0].startOf('day'), dates[1].endOf('day')]);
		} else {
			setDateRange(null);
		}
	};

	const columns = [
		{
			title: 'Mã đơn',
			dataIndex: 'order_code',
			key: 'order_code',
			width: 140,
			render: (text) => <Text strong>{text}</Text>,
		},
		{
			title: 'Khách hàng',
			dataIndex: 'customer',
			key: 'customer',
			render: (customer, record) => {
				const user = customer || record?.user_id;
				return (
				<Space direction="vertical" size={0}>
					<Text>{user?.full_name || 'Khách vãng lai'}</Text>
					{user?.phone && <Text type="secondary">{user.phone}</Text>}
				</Space>
				);
			},
		},
		{
			title: 'Tổng tiền',
			dataIndex: 'final_amount',
			key: 'final_amount',
			width: 140,
			render: (amount) => <Text strong>{formatCurrency(amount)}</Text>,
		},
		{
			title: 'Trạng thái đơn',
			dataIndex: 'order_status',
			key: 'order_status',
			width: 130,
			render: (status) => getOrderStatusTag(status),
		},
		{
			title: 'Thanh toán',
			dataIndex: 'payment_status',
			key: 'payment_status',
			width: 140,
			render: (status) => getPaymentStatusTag(status),
		},
		{
			title: 'Thời gian',
			dataIndex: 'created_at',
			key: 'created_at',
			width: 160,
			render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
		},
	];

	return (
		<div style={{ padding: '24px' }}>
			<Space direction="vertical" size="large" style={{ width: '100%' }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<Title level={2} style={{ margin: 0 }}>
						Dashboard
					</Title>
					<RangePicker
						value={dateRange}
						onChange={handleDateRangeChange}
						format="DD/MM/YYYY"
						allowClear={false}
						presets={[
							{ label: 'Hôm nay', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
							{ label: 'Tuần này', value: [dayjs().startOf('week'), dayjs().endOf('week')] },
							{ label: 'Tháng này', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
							{ label: '7 ngày qua', value: [dayjs().subtract(7, 'day'), dayjs()] },
							{ label: '30 ngày qua', value: [dayjs().subtract(30, 'day'), dayjs()] },
						]}
					/>
				</div>

				{statsLoading ? (
					<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
						<Spin size="large" />
					</div>
				) : (
					<Row gutter={[16, 16]}>
						<Col xs={24} sm={12} lg={6}>
							<Card>
								<Statistic
									title="Tổng doanh thu"
									value={stats?.total_amount || 0}
									formatter={(value) => formatCurrency(value)}
									prefix={<DollarOutlined />}
									valueStyle={{ color: '#3f8600' }}
								/>
							</Card>
						</Col>
						<Col xs={24} sm={12} lg={6}>
							<Card>
								<Statistic
									title="Tổng đơn hàng"
									value={stats?.total_orders || 0}
									prefix={<ShoppingCartOutlined />}
									valueStyle={{ color: '#1890ff' }}
								/>
							</Card>
						</Col>
						<Col xs={24} sm={12} lg={6}>
							<Card>
								<Statistic
									title="Đơn hoàn thành"
									value={stats?.completed_orders || 0}
									prefix={<CheckCircleOutlined />}
									valueStyle={{ color: '#52c41a' }}
								/>
							</Card>
						</Col>
						<Col xs={24} sm={12} lg={6}>
							<Card>
								<Statistic
									title="Đơn chờ xử lý"
									value={stats?.pending_orders || 0}
									prefix={<ClockCircleOutlined />}
									valueStyle={{ color: '#faad14' }}
								/>
							</Card>
						</Col>
					</Row>
				)}

				<Card
					title={
						<Space>
							<RiseOutlined />
							<span>Đơn hàng gần đây</span>
						</Space>
					}
				>
					<Table
						columns={columns}
						dataSource={orders}
						rowKey="_id"
						loading={loading}
						pagination={false}
						scroll={{ x: 800 }}
						locale={{
							emptyText: 'Chưa có đơn hàng nào',
						}}
					/>
				</Card>

				<Row gutter={[16, 16]}>
					<Col xs={24} sm={12}>
						<Card title="Thống kê theo trạng thái">
							<Space direction="vertical" style={{ width: '100%' }} size="middle">
								<div style={{ display: 'flex', justifyContent: 'space-between' }}>
									<Text>Đang xử lý:</Text>
									<Text strong style={{ color: '#1890ff' }}>
										{stats?.processing_orders || 0} đơn
									</Text>
								</div>
								<div style={{ display: 'flex', justifyContent: 'space-between' }}>
									<Text>Hoàn thành:</Text>
									<Text strong style={{ color: '#52c41a' }}>
										{stats?.completed_orders || 0} đơn
									</Text>
								</div>
								<div style={{ display: 'flex', justifyContent: 'space-between' }}>
									<Text>Đã hủy:</Text>
									<Text strong style={{ color: '#ff4d4f' }}>
										{stats?.cancelled_orders || 0} đơn
									</Text>
								</div>
							</Space>
						</Card>
					</Col>
					<Col xs={24} sm={12}>
						<Card title="Tổng quan">
							<Space direction="vertical" style={{ width: '100%' }} size="middle">
								<div style={{ display: 'flex', justifyContent: 'space-between' }}>
									<Text>Tổng đơn hàng:</Text>
									<Text strong style={{ fontSize: 16 }}>
										{stats?.total_orders || 0}
									</Text>
								</div>
								<div style={{ display: 'flex', justifyContent: 'space-between' }}>
									<Text>Tổng doanh thu:</Text>
									<Text strong style={{ fontSize: 16, color: '#3f8600' }}>
										{formatCurrency(stats?.total_amount || 0)}
									</Text>
								</div>
								{stats?.total_orders > 0 && (
									<div style={{ display: 'flex', justifyContent: 'space-between' }}>
										<Text>Giá trị TB/đơn:</Text>
										<Text strong>
											{formatCurrency((stats?.total_amount || 0) / (stats?.total_orders || 1))}
										</Text>
									</div>
								)}
							</Space>
						</Card>
					</Col>
				</Row>
			</Space>
		</div>
	);
};

export default SellerDashboard;
