import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Avatar,
	Button,
	Card,
	Col,
	Empty,
	Image,
	Input,
	InputNumber,
	List,
	message,
	Modal,
	Pagination,
	Popconfirm,
	Row,
	Select,
	Space,
	Statistic,
	Table,
	Typography,
} from 'antd';
import {
	CheckCircleOutlined,
	DeleteOutlined,
	QrcodeOutlined,
	PlusOutlined,
	SearchOutlined,
	ShoppingCartOutlined,
	AppstoreOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import posService from '../../services/posService';

const { Title, Text } = Typography;
const ACTIVE_TRANSACTION_STORAGE_KEY = 'seller_pos_active_transaction_id';
const ITEM_FIELD_BORDER = '1px solid #d9d9d9';

const formatCurrency = (value) =>
	Number(value || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const getStockLevel = (stock) => {
	if (stock <= 5) return { label: 'Sắp hết hàng', color: 'red', value: 'low' };
	if (stock <= 20) return { label: 'Tồn kho vừa', color: 'orange', value: 'medium' };
	return { label: 'Tồn kho tốt', color: 'green', value: 'high' };
};

function SellerPOS() {
	const [loading, setLoading] = useState(false);
	const [transactionLoading, setTransactionLoading] = useState(false);
	const [transactionId, setTransactionId] = useState('');
	const [transaction, setTransaction] = useState(null);
	const [paymentModalOpen, setPaymentModalOpen] = useState(false);
	const [paymentInfo, setPaymentInfo] = useState(null);
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const [products, setProducts] = useState([]);
	const [categories, setCategories] = useState([]);
	const [quantityMap, setQuantityMap] = useState({});
	const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0 });

	const [searchText, setSearchText] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [categoryFilter, setCategoryFilter] = useState(undefined);
	const [stockFilter, setStockFilter] = useState('all');

	const fetchCategories = useCallback(async () => {
		try {
			const response = await posService.getCategories();
			setCategories(response.data || []);
		} catch (error) {
			console.error('Fetch categories error:', error);
		}
	}, []);

	const fetchProducts = useCallback(
		async (page = pagination.page) => {
			if (!transactionId) return;

			setLoading(true);
			try {
				const response = await posService.getProducts({
					page,
					limit: pagination.limit,
					search: debouncedSearch,
					category_id: categoryFilter,
					stock_level: stockFilter === 'all' ? undefined : stockFilter,
				});

				setProducts(response.data.products || []);
				setPagination((prev) => ({
					...prev,
					page: response.data.pagination.page,
					total: response.data.pagination.total,
				}));
			} catch (error) {
				message.error(error.message || 'Không thể tải danh sách sản phẩm');
			} finally {
				setLoading(false);
			}
		},
		[
			transactionId,
			pagination.page,
			pagination.limit,
			debouncedSearch,
			categoryFilter,
			stockFilter,
		],
	);

	const fetchTransaction = useCallback(async (id) => {
		if (!id) return;
		setTransactionLoading(true);
		try {
			const response = await posService.getTransactionDetail(id);
			setTransaction(response.data);
		} catch (error) {
			setTransaction(null);
			setTransactionId('');
			message.error(error.message || 'Không thể tải transaction');
		} finally {
			setTransactionLoading(false);
		}
	}, []);

	const resetToMainScreen = useCallback(() => {
		if (typeof window !== 'undefined') {
			window.localStorage.removeItem(ACTIVE_TRANSACTION_STORAGE_KEY);
		}
		setTransaction(null);
		setTransactionId('');
		setProducts([]);
		setQuantityMap({});
		setPaymentInfo(null);
		setPaymentModalOpen(false);
		setSearchText('');
		setDebouncedSearch('');
		setCategoryFilter(undefined);
		setStockFilter('all');
		setPagination((prev) => ({ ...prev, page: 1 }));
		navigate('/seller/pos', { replace: true });
	}, [navigate]);

	useEffect(() => {
		fetchCategories();
	}, [fetchCategories]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const savedTransactionId = window.localStorage.getItem(ACTIVE_TRANSACTION_STORAGE_KEY);
		if (savedTransactionId) {
			setTransactionId(savedTransactionId);
		}
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (!transactionId) {
			window.localStorage.removeItem(ACTIVE_TRANSACTION_STORAGE_KEY);
			return;
		}
		window.localStorage.setItem(ACTIVE_TRANSACTION_STORAGE_KEY, transactionId);
	}, [transactionId]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchText.trim());
			setPagination((prev) => ({ ...prev, page: 1 }));
		}, 300);
		return () => clearTimeout(timer);
	}, [searchText]);

	useEffect(() => {
		if (!transactionId) return;
		fetchProducts(pagination.page);
	}, [
		fetchProducts,
		transactionId,
		pagination.page,
		debouncedSearch,
		categoryFilter,
		stockFilter,
	]);

	useEffect(() => {
		if (!transactionId) {
			setTransaction(null);
			return;
		}
		fetchTransaction(transactionId);
	}, [transactionId, fetchTransaction]);

	useEffect(() => {
		const isPayOSFlow = searchParams.get('payos');
		const flow = searchParams.get('flow');
		const callbackTransactionId = searchParams.get('transactionId');

		if (isPayOSFlow !== '1' || !callbackTransactionId) {
			return;
		}

		const syncPaymentStatus = async () => {
			try {
				const statusResponse = await posService.checkPaymentStatus(callbackTransactionId);
				const statusData = statusResponse.data;

				if (statusData.payment_status === 'paid') {
					resetToMainScreen();
					message.success('Thanh toán thành công. Đã quay về giao diện Staff.');
					return;
				}

				setTransactionId(callbackTransactionId);
				await fetchTransaction(callbackTransactionId);

				if (flow === 'cancel') {
					message.warning('Bạn đã hủy thanh toán. Đơn hàng vẫn được giữ nguyên.');
				} else {
					message.info('Thanh toán chưa thành công. Đơn hàng vẫn được giữ nguyên.');
				}
				navigate('/seller/pos', { replace: true });
			} catch (error) {
				message.error(error.message || 'Không thể cập nhật trạng thái thanh toán PayOS');
				navigate('/seller/pos', { replace: true });
			}
		};

		syncPaymentStatus();
	}, [searchParams, fetchTransaction, navigate, resetToMainScreen]);

	const createTransaction = async () => {
		setTransactionLoading(true);
		try {
			const response = await posService.createTransaction();
			const createdId = response.data?._id;
			setTransactionId(createdId);
			setTransaction({ order: response.data, items: [] });
			message.success('Đã tạo Sales Transaction');
			fetchTransaction(createdId);
		} catch (error) {
			message.error(error.message || 'Không thể tạo transaction');
		} finally {
			setTransactionLoading(false);
		}
	};

	const handleAddItem = async (item) => {
		const quantity = Number(quantityMap[item.product_unit_id] || 1);
		try {
			const response = await posService.addItem(transactionId, {
				product_unit_id: item.product_unit_id,
				quantity,
			});
			setTransaction(response.data);
			message.success('Đã thêm sản phẩm vào giao dịch');
			fetchProducts(pagination.page);
		} catch (error) {
			message.error(error.message || 'Không thể thêm sản phẩm');
		}
	};

	const handleRemoveItem = async (itemId) => {
		try {
			const response = await posService.removeItem(transactionId, itemId);
			setTransaction(response.data);
			message.success('Đã xóa sản phẩm khỏi giao dịch');
			fetchProducts(pagination.page);
		} catch (error) {
			message.error(error.message || 'Không thể xóa sản phẩm');
		}
	};

	const handleUpdateItemQuantity = async (itemId, newQuantity) => {
		try {
			const response = await posService.updateItemQuantity(transactionId, itemId, newQuantity);
			setTransaction(response.data);
			if (newQuantity === 0) {
				message.success('Đã xóa sản phẩm khỏi giao dịch');
			} else {
				message.success('Đã cập nhật số lượng sản phẩm');
			}
			fetchProducts(pagination.page);
		} catch (error) {
			message.error(error.message || 'Không thể cập nhật số lượng sản phẩm');
		}
	};

	const handlePayWithPayOS = async () => {
		if (!transactionId) {
			message.warning('Vui lòng tạo transaction trước');
			return;
		}

		try {
			const response = await posService.createPayOSPayment(transactionId);
			setTransaction((prev) =>
				prev
					? {
							...prev,
							order: {
								...prev.order,
								payment_method: 'payos',
								order_status: 'processing',
							},
						}
					: prev,
			);
			setPaymentInfo(response.data);
			setPaymentModalOpen(true);
		} catch (error) {
			message.error(error.message || 'Không thể tạo thanh toán PayOS');
		}
	};

	const handleCompleteCashPayment = async () => {
		if (!transactionId) {
			message.warning('Vui lòng tạo transaction trước');
			return;
		}

		setTransactionLoading(true);
		try {
			await posService.completeCashPayment(transactionId);
			resetToMainScreen();
			message.success('Đã hoàn thành đơn tiền mặt (đã thanh toán)');
		} catch (error) {
			message.error(error.message || 'Không thể hoàn thành đơn tiền mặt');
		} finally {
			setTransactionLoading(false);
		}
	};

	const handleDeleteTransaction = async () => {
		if (!transactionId) {
			return;
		}

		setTransactionLoading(true);
		try {
			await posService.deleteTransaction(transactionId);
			resetToMainScreen();
			message.success('Đã xóa Sales Transaction');
		} catch (error) {
			message.error(error.message || 'Không thể xóa Sales Transaction');
		} finally {
			setTransactionLoading(false);
		}
	};

	const orderSummary = useMemo(() => transaction?.order || {}, [transaction]);
	const canCompleteCash =
		Boolean(transaction?.items?.length) &&
		Number(orderSummary.final_amount || 0) > 0 &&
		orderSummary.payment_status !== 'paid' &&
		orderSummary.payment_method !== 'payos';

	const cartColumns = [
		{
			title: 'Sản phẩm',
			key: 'product',
			render: (_, record) => (
				<Space direction="vertical" size={0}>
					<Text strong>{record.product_unit_id?.product_id?.name}</Text>
					<Text type="secondary">ĐVT: {record.product_unit_id?.unit_id?.name || '-'}</Text>
				</Space>
			),
		},
		{
			title: 'SL',
			dataIndex: 'quantity',
			width: 100,
			render: (quantity, record) => (
				<InputNumber
					min={0}
					max={999}
					value={quantity}
					onChange={(value) => handleUpdateItemQuantity(record._id, value || 0)}
					size="small"
					style={{ width: 70 }}
				/>
			),
		},
		{
			title: 'Đơn giá',
			dataIndex: 'unit_price',
			render: (value) => formatCurrency(value),
		},
		{
			title: 'Thành tiền',
			dataIndex: 'total_price',
			render: (value) => formatCurrency(value),
		},
		{
			title: 'Thao tác',
			key: 'actions',
			width: 80,
			render: (_, record) => (
				<Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleRemoveItem(record._id)}>
					Xóa
				</Button>
			),
		},
	];

	return (
		<div>
			<Card>
				<Space direction="vertical" size="large" style={{ width: '100%' }}>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							gap: 12,
							flexWrap: 'wrap',
						}}
					>
						<Title level={3} style={{ margin: 0 }}>
							POS thanh toán
						</Title>
						<Button
							type="primary"
							icon={<ShoppingCartOutlined />}
							onClick={createTransaction}
							loading={transactionLoading}
							disabled={Boolean(transactionId)}
						>
							{transactionId ? 'Đang có Sales Transaction' : 'Tạo đơn thanh toán'}
						</Button>
					</div>

					{!transactionId && (
						<Empty
							description="Chưa có đơn thanh toán. Hãy bấm Tạo đơn thanh toán để bắt đầu."
							image={Empty.PRESENTED_IMAGE_SIMPLE}
						/>
					)}

					{transactionId && (
						<>
							<Row gutter={16}>
								<Col xs={24} sm={12} md={8} lg={6}>
									<Input
										placeholder="Tìm theo tên hoặc barcode"
										prefix={<SearchOutlined />}
										value={searchText}
										onChange={(e) => setSearchText(e.target.value)}
										allowClear
									/>
								</Col>
								<Col xs={24} sm={12} md={8} lg={4}>
									<Select
										allowClear
										placeholder="Danh mục"
										value={categoryFilter}
										onChange={(value) => {
											setCategoryFilter(value);
											setPagination((prev) => ({ ...prev, page: 1 }));
										}}
										style={{ width: '100%' }}
										options={categories.map((item) => ({ label: item.name, value: item._id }))}
									/>
								</Col>
								<Col xs={24} sm={12} md={8} lg={6}>
									<Select
										value={stockFilter}
										onChange={(value) => {
											setStockFilter(value);
											setPagination((prev) => ({ ...prev, page: 1 }));
										}}
										style={{ width: '100%' }}
										options={[
											{ label: 'Mọi mức tồn kho', value: 'all' },
											{ label: 'Sắp hết hàng', value: 'low' },
											{ label: 'Tồn kho vừa', value: 'medium' },
											{ label: 'Tồn kho tốt', value: 'high' },
										]}
									/>
								</Col>
							</Row>

							<Row gutter={16}>
								<Col xs={24} lg={10} xl={9}>
									<Card title="Danh sách sản phẩm" loading={loading}>
										<List
											dataSource={products}
											size="small"
											locale={{ emptyText: <Empty description="Không có sản phẩm" /> }}
											renderItem={(item) => {
												const stock = getStockLevel(item.available_stock || 0);
												return (
													<List.Item style={{ paddingBlock: 10 }}>
														<div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
															<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
																<div style={{ border: ITEM_FIELD_BORDER, borderRadius: 4, padding: '2px 8px', minWidth: 140, maxWidth: 240 }}>
																	<Text strong ellipsis>{item.product_name}</Text>
																</div>
																<InputNumber
																	size="small"
																	min={1}
																	max={item.available_stock}
																	value={quantityMap[item.product_unit_id] || 1}
																	onChange={(value) =>
																		setQuantityMap((prev) => ({
																			...prev,
																			[item.product_unit_id]: value || 1,
																		}))
																	}
																	style={{ width: 64 }}
																/>
																<Button
																	size="small"
																	type="primary"
																	icon={<PlusOutlined />}
																	onClick={() => handleAddItem(item)}
																	style={{ borderRadius: 4, height: 24, paddingInline: 8 }}
																>
																	Thêm
																</Button>
															</div>

															<div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
																<div style={{ width: 92, display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
																	<div
																		style={{
																			width: 70,
																			height: 70,
																			border: ITEM_FIELD_BORDER,
																			borderRadius: 4,
																			display: 'flex',
																			alignItems: 'center',
																			justifyContent: 'center',
																			overflow: 'hidden',
																		}}
																	>
																		{item.product_image_url ? (
																			<Image
																				src={item.product_image_url}
																				alt={item.product_name}
																				width={70}
																				height={70}
																				style={{ objectFit: 'cover' }}
																				preview={false}
																			/>
																		) : (
																			<Avatar shape="square" size={40} icon={<AppstoreOutlined />} />
																		)}
																	</div>
																	<div style={{ border: ITEM_FIELD_BORDER, borderRadius: 4, padding: '2px 8px', width: '100%' }}>
																		<Text ellipsis>{item.category_name || 'N/A'}</Text>
																	</div>
																</div>

																<div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 150, maxWidth: 220, flex: 1 }}>
																	<div style={{ border: ITEM_FIELD_BORDER, borderRadius: 4, padding: '2px 8px' }}>
																		<Text ellipsis>Barcode: {item.barcode || 'N/A'}</Text>
																	</div>
																	<div style={{ border: ITEM_FIELD_BORDER, borderRadius: 4, padding: '2px 8px' }}>
																		<Text>Giá: {formatCurrency(item.price)}</Text>
																	</div>
																	<div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
																		<div style={{ border: ITEM_FIELD_BORDER, borderRadius: 4, padding: '2px 8px', minWidth: 104 }}>
																			<Text>Tồn kho: {item.available_stock}</Text>
																		</div>
																		<div style={{ border: ITEM_FIELD_BORDER, borderRadius: 4, padding: '2px 8px', minWidth: 112 }}>
																			<Text style={{ color: stock.color === 'red' ? '#c1121f' : stock.color === 'orange' ? '#bc6c25' : '#2b9348' }}>
																				{stock.label}
																			</Text>
																		</div>
																	</div>
																</div>
															</div>
														</div>
													</List.Item>
												);
											}}
										/>

										<div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
											<Text type="secondary">Tổng sản phẩm: {pagination.total}</Text>
											<Pagination
												current={pagination.page}
												pageSize={pagination.limit}
												total={pagination.total}
												showSizeChanger={false}
												onChange={(page) => setPagination((prev) => ({ ...prev, page }))}
											/>
										</div>
									</Card>
								</Col>

								<Col xs={24} lg={14} xl={15}>
									<Card
										title={`Sales Transaction: ${transactionId}`}
										loading={transactionLoading}
										extra={
											<Popconfirm
												title="Xóa Sales Transaction"
												description="Bạn chắc chắn muốn xóa transaction này?"
												onConfirm={handleDeleteTransaction}
												okText="Xóa"
												cancelText="Hủy"
												okButtonProps={{ danger: true }}
											>
												<Button danger size="small" icon={<DeleteOutlined />}>
													Xóa Sales Transaction
												</Button>
											</Popconfirm>
										}
									>
										<Table
											rowKey="_id"
											columns={cartColumns}
											dataSource={transaction?.items || []}
											pagination={false}
											locale={{ emptyText: <Empty description="Chưa có sản phẩm trong giao dịch" /> }}
											size="small"
										/>

										<Space direction="vertical" style={{ marginTop: 16, width: '100%' }}>
											<Statistic
												title="Tạm tính"
												value={orderSummary.total_amount || 0}
												formatter={(value) => formatCurrency(value)}
											/>
											<Statistic
												title="Thuế"
												value={orderSummary.tax_amount || 0}
												formatter={(value) => formatCurrency(value)}
											/>
											<Statistic
												title="Tổng thanh toán"
												value={orderSummary.final_amount || 0}
												formatter={(value) => formatCurrency(value)}
												valueStyle={{ color: '#f5741f', fontWeight: 800, fontSize: 36 }}
											/>
											<Space wrap>
												<Button type="primary" icon={<QrcodeOutlined />} onClick={handlePayWithPayOS}>
													Thanh toán PayOS
												</Button>
												<Popconfirm
													title="Xác nhận hoàn thành"
													description="Đơn tiền mặt sẽ được đánh dấu đã thanh toán và hoàn thành."
													onConfirm={handleCompleteCashPayment}
													okText="Xác nhận"
													cancelText="Hủy"
													disabled={!canCompleteCash}
												>
													<Button
														type="primary"
														icon={<CheckCircleOutlined />}
														disabled={!canCompleteCash}
														style={{ background: '#52c41a', borderColor: '#52c41a' }}
													>
														Hoàn Thành
													</Button>
												</Popconfirm>
											</Space>
										</Space>
									</Card>
								</Col>
							</Row>
						</>
					)}
				</Space>
			</Card>

			<Modal
				title="Mở link thanh toán"
				open={paymentModalOpen}
				onCancel={() => setPaymentModalOpen(false)}
				footer={null}
			>
				<Space direction="vertical" style={{ width: '100%' }}>
					<Text>Bấm nút bên dưới để mở link thanh toán PayOS.</Text>
					{paymentInfo?.checkoutUrl && (
						<Button
							type="primary"
							onClick={() => {
								window.location.assign(paymentInfo.checkoutUrl);
							}}
							block
						>
							Tiếp tục thanh toán PayOS
						</Button>
					)}
				</Space>
			</Modal>
		</div>
	);
}

export default SellerPOS;
