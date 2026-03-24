import { useEffect, useRef, useState } from "react";
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import adminOrderService from "../../services/adminOrderService";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);

function Orders() {
  const { message } = App.useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState("");
  const [orderStatus, setOrderStatus] = useState(null);
  const [dateRange, setDateRange] = useState(null); // pending date selection
  const [appliedDateRange, setAppliedDateRange] = useState(null);
  const isInitialized = useRef(false);

  const buildQueryParams = (params = {}) => {
    const query = {
      page: params.page || pagination.current,
      limit: params.limit || pagination.pageSize,
    };

    const effectiveSearch =
      params.searchTextOverride !== undefined
        ? params.searchTextOverride
        : searchText;
    const effectiveStatus =
      params.orderStatusOverride !== undefined
        ? params.orderStatusOverride
        : orderStatus;

    if (effectiveSearch?.trim()) {
      query.search = effectiveSearch.trim();
    }

    if (effectiveStatus) {
      query.order_status = effectiveStatus;
    }

    const effectiveDateRange =
      params.appliedDateRangeOverride !== undefined
        ? params.appliedDateRangeOverride
        : appliedDateRange;

    if (effectiveDateRange && effectiveDateRange.length === 2) {
      query.start_date = effectiveDateRange[0].format("YYYY-MM-DD");
      query.end_date = effectiveDateRange[1].format("YYYY-MM-DD");
    }

    return query;
  };

  const fetchOrders = async (params = {}) => {
    setLoading(true);
    try {
      const query = buildQueryParams(params);
      const response = await adminOrderService.getOrderList(query);
      const rawOrders = response.data || [];
      const finalOrders = rawOrders.filter((record) => {
        if (query.start_date || query.end_date) {
          const createdAt = new Date(record.created_at);
          if (Number.isNaN(createdAt.getTime())) return false;

          if (query.start_date) {
            const start = new Date(`${query.start_date}T00:00:00`);
            if (createdAt < start) return false;
          }

          if (query.end_date) {
            const end = new Date(`${query.end_date}T23:59:59.999`);
            if (createdAt > end) return false;
          }
        }

        if (query.order_status) {
          const matchedOrderStatus = record.order_status === query.order_status;
          const matchedPaymentStatus = record.payment_status === query.order_status;
          if (!matchedOrderStatus && !matchedPaymentStatus) return false;
        }

        if (query.search) {
          const searchLower = query.search.toLowerCase();
          const haystack = [
            record.order_code,
            record._id,
            record.user?.full_name,
            record.user?.email,
            record.user?.phone,
            record.seller?.full_name,
            record.seller?.username,
            String(record.final_amount || ""),
            String(record.total_amount || ""),
            String(record.payos_order_code || ""),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(searchLower)) return false;
        }

        return true;
      });

      setOrders(finalOrders);
      setPagination((prev) => ({
        ...prev,
        current: response.pagination?.page || query.page,
        pageSize: response.pagination?.limit || query.limit,
        total: response.pagination?.total || finalOrders.length,
      }));
    } catch (error) {
      message.error(error?.message || "Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders({ page: 1, limit: pagination.pageSize });
    isInitialized.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto search when typing (date range is excluded).
  useEffect(() => {
    if (!isInitialized.current) {
      return;
    }

    const timer = setTimeout(() => {
      fetchOrders({
        page: 1,
        limit: pagination.pageSize,
        searchTextOverride: searchText,
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [searchText]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto filter immediately when status changes.
  useEffect(() => {
    if (!isInitialized.current) {
      return;
    }
    fetchOrders({
      page: 1,
      limit: pagination.pageSize,
      orderStatusOverride: orderStatus,
    });
  }, [orderStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTableChange = (paginationConfig) => {
    fetchOrders({
      page: paginationConfig.current,
      limit: paginationConfig.pageSize,
    });
  };

  const handleApplyFilters = () => {
    if (!dateRange || dateRange.length !== 2) {
      message.warning("Vui lòng chọn đủ Start date và End date");
      return;
    }

    setAppliedDateRange(dateRange);
    fetchOrders({
      page: 1,
      limit: pagination.pageSize,
      appliedDateRangeOverride: dateRange,
    });
  };

  const handleResetFilters = () => {
    setSearchText("");
    setOrderStatus(null);
    setDateRange(null);
    setAppliedDateRange(null);
    setTimeout(() => {
      fetchOrders({ page: 1, limit: pagination.pageSize });
    }, 0);
  };

  const handleConfirmPayment = async (orderId) => {
    try {
      await adminOrderService.confirmPayment(orderId);
      message.success("Đã xác nhận thanh toán: Unpaid -> Paid");
      fetchOrders({ page: pagination.current, limit: pagination.pageSize });
    } catch (error) {
      message.error(error?.message || "Không thể xác nhận thanh toán");
    }
  };

  const columns = [
    {
      title: "Order ID",
      key: "order_id",
      render: (_, record) => <Text strong>{record.order_code || record._id}</Text>,
    },
    {
      title: "Customer Name",
      key: "customer_name",
      render: (_, record) => record.user?.full_name || "Khách vãng lai",
    },
    {
      title: "Seller Name",
      key: "seller_name",
      render: (_, record) =>
        record.seller?.full_name || record.seller?.username || "-",
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        const orderStatusMap = {
          pending: { color: "gold", text: "Pending" },
          processing: { color: "processing", text: "Processing" },
          completed: { color: "success", text: "Completed" },
          cancelled: { color: "error", text: "Cancelled" },
          returned: { color: "default", text: "Returned" },
        };
        const order = orderStatusMap[record.order_status] || {
          color: "default",
          text: record.order_status || "Unknown",
        };
        return <Tag color={order.color}>{order.text}</Tag>;
      },
    },
    {
      title: "Reason",
      key: "reason",
      render: (_, record) => {
        const paymentStatusMap = {
          unpaid: "Unpaid",
          paid: "Paid",
          refunded: "Refunded",
        };
        return paymentStatusMap[record.payment_status] || "Unknown";
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        if (record.payment_status !== "unpaid") {
          return <Text type="secondary">-</Text>;
        }

        return (
          <Popconfirm
            title="Xác nhận thanh toán?"
            description="Chuyển trạng thái từ Unpaid sang Paid"
            okText="Xác nhận"
            cancelText="Hủy"
            onConfirm={() => handleConfirmPayment(record._id)}
          >
            <Button
              type="default"
              size="small"
              icon={<CheckCircleOutlined />}
              style={{
                borderColor: "#52c41a",
                color: "#52c41a",
                fontWeight: 500,
              }}
            >
              Confirm Paid
            </Button>
          </Popconfirm>
        );
      },
    },
    {
      title: "Total Amount",
      dataIndex: "final_amount",
      key: "final_amount",
      align: "right",
      render: (value) => <Text strong>{formatCurrency(value)}</Text>,
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (value) => dayjs(value).format("DD/MM/YYYY HH:mm"),
    },
  ];

  return (
    <div>
      <Title level={3}>
        <ShoppingCartOutlined style={{ marginRight: 8 }} />
        Order Management
      </Title>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Input
              allowClear
              placeholder="Search by order code, amount, customer, email..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              allowClear
              placeholder="Order status"
              style={{ width: "100%" }}
              value={orderStatus}
              onChange={setOrderStatus}
              options={[
                { value: "pending", label: "Pending" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
          </Col>
          <Col xs={24} md={7}>
            <RangePicker
              style={{ width: "100%" }}
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
              placeholder={["Start date", "End date"]}
            />
          </Col>
          <Col xs={24} md={3}>
            <Space>
              <Button type="primary" onClick={handleApplyFilters}>
                Apply
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
                Reset
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total) => `Tổng ${total} đơn hàng`,
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
}

export default Orders;
