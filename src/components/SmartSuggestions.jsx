import { useState, useEffect } from 'react';
import {
  Modal,
  Card,
  List,
  Tag,
  Typography,
  Alert,
  Row,
  Col,
  Statistic,
  Spin,
  Empty,
  Divider,
  Space,
  Button,
  Tooltip,
  DatePicker,
  Select,
  Radio,
} from 'antd';
import {
  InfoCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  TrophyOutlined,
  ReloadOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import productBatchService from '../services/productBatchService';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const SmartSuggestions = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [daysBack, setDaysBack] = useState(null);
  const [analysisMode, setAnalysisMode] = useState(null);

  // Fetch suggestions khi modal mở
  const fetchSuggestions = async () => {
    if (!analysisMode) {
      Modal.warning({
        title: 'Chưa chọn kiểu phân tích',
        content: 'Vui lòng chọn một trong hai lựa chọn trước khi phân tích.',
      });
      return;
    }

    if (analysisMode === 'period' && !daysBack) {
      Modal.warning({
        title: 'Thiếu khoảng thời gian',
        content: 'Vui lòng chọn số ngày phân tích trước khi tiếp tục.',
      });
      return;
    }

    if (analysisMode === 'custom' && (!dateRange || !dateRange[0] || !dateRange[1])) {
      Modal.warning({
        title: 'Thiếu khoảng ngày',
        content: 'Vui lòng chọn đầy đủ Từ ngày và Đến ngày trước khi phân tích.',
      });
      return;
    }

    setLoading(true);
    try {
      const params = {};
      
      if (analysisMode === 'custom' && dateRange && dateRange[0] && dateRange[1]) {
        params.date_from = dateRange[0].format('YYYY-MM-DD');
        params.date_to = dateRange[1].format('YYYY-MM-DD');
      } else if (analysisMode === 'period' && daysBack) {
        params.days_back = daysBack;
      }

      const response = await productBatchService.getSmartSuggestions(params);
      setData(response.data);
    } catch (error) {
      Modal.error({
        title: 'Lỗi',
        content: error.message || 'Không thể tải gợi ý thông minh',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch khi modal mở lần đầu
  useEffect(() => {
    if (!visible) {
      return;
    }
  }, [visible]);

  // Handle date range preset change
  const handlePresetChange = (value) => {
    setDaysBack(value);
  };

  const handleModeChange = (value) => {
    setAnalysisMode(value);
    if (value === 'period' && !daysBack) {
      setDaysBack(90);
    }
  };

  // Handle custom date range change
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  // Map priority to color and icon
  const getPriorityConfig = (priority) => {
    const configs = {
      high: { color: 'red', icon: <WarningOutlined />, text: 'Cao' },
      medium: { color: 'orange', icon: <InfoCircleOutlined />, text: 'Trung bình' },
      low: { color: 'green', icon: <CheckCircleOutlined />, text: 'Thấp' },
    };
    return configs[priority] || configs.medium;
  };

  // Format waste rate as percentage
  const formatWasteRate = (rate) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  // Format number with thousand separators
  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  return (
    <Modal
      title={
        <Space>
          <BulbOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
          <span>Gợi Ý Nhập Hàng Thông Minh (AI)</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={[
        <Button key="refresh" icon={<ReloadOutlined />} onClick={fetchSuggestions}>
          Làm mới
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      style={{ top: 20 }}
    >
      {/* Date Range Filter */}
      <Card size="small" style={{ marginBottom: 16, background: '#f0f2f5' }}>
        <Row gutter={16} align="middle">
          <Col>
            <Space>
              <CalendarOutlined style={{ fontSize: 16, color: '#1890ff' }} />
              <Text strong>Khoảng thời gian phân tích:</Text>
            </Space>
          </Col>
          <Col span={24}>
            <Radio.Group
              value={analysisMode}
              onChange={(e) => handleModeChange(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="period">Chọn khoảng thời gian</Radio.Button>
              <Radio.Button value="custom">Chọn từ ngày đến ngày</Radio.Button>
            </Radio.Group>
          </Col>
          {analysisMode === 'period' ? (
            <Col>
              <Select
                value={daysBack}
                onChange={handlePresetChange}
                style={{ width: 150 }}
                options={[
                  { label: '7 ngày', value: 7 },
                  { label: '30 ngày', value: 30 },
                  { label: '90 ngày', value: 90 },
                  { label: '180 ngày', value: 180 },
                  { label: '1 năm', value: 365 },
                ]}
              />
            </Col>
          ) : (
            <Col flex="auto">
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                format="DD/MM/YYYY"
                placeholder={['Từ ngày', 'Đến ngày']}
                style={{ width: '100%' }}
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
            </Col>
          )}
          <Col>
            <Button type="primary" icon={<ReloadOutlined />} onClick={fetchSuggestions}>
              Phân tích
            </Button>
          </Col>
        </Row>
        {data?.date_range && (
          <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
            <Text type="secondary">
              📊 Đã phân tích: {data.stats?.total_batches || 0} lô hàng, {data.stats?.total_logs || 0} nhật ký kho
              {data.date_range.from && (
                <> • Từ {new Date(data.date_range.from).toLocaleDateString('vi-VN')}</>
              )}
              {data.date_range.to && (
                <> đến {new Date(data.date_range.to).toLocaleDateString('vi-VN')}</>
              )}
            </Text>
          </div>
        )}
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <Paragraph style={{ marginTop: 16, color: '#999' }}>
            Đang phân tích dữ liệu và tạo gợi ý thông minh...
          </Paragraph>
        </div>
      ) : !data ? (
        <Empty description="Vui lòng chọn loại phân tích và bấm Phân tích" />
      ) : (
        <>

          {/* Overall Analysis */}
          {data.analysis && (
            <Card
              style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              bodyStyle={{ padding: '24px' }}
            >
              <Row gutter={[24, 16]}>
                <Col span={24}>
                  <Title level={4} style={{ color: 'white', marginBottom: 16 }}>
                    <ThunderboltOutlined /> Phân Tích Tổng Quan
                  </Title>
                </Col>
                {data.analysis.total_waste_value_estimate > 0 && (
                  <Col xs={24} sm={12} md={8}>
                    <Card bordered={false} style={{ background: 'rgba(255,255,255,0.9)' }}>
                      <Statistic
                        title="Ước Tính Giá Trị Hao Hụt"
                        value={data.analysis.total_waste_value_estimate}
                        precision={0}
                        suffix="đ"
                        valueStyle={{ color: '#cf1322' }}
                      />
                    </Card>
                  </Col>
                )}
                <Col xs={24} sm={12} md={8}>
                  <Card bordered={false} style={{ background: 'rgba(255,255,255,0.9)' }}>
                    <Statistic
                      title="Số Sản Phẩm Cần Chú Ý"
                      value={data.suggestions?.length || 0}
                      valueStyle={{ color: '#fa8c16' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card bordered={false} style={{ background: 'rgba(255,255,255,0.9)' }}>
                    <Statistic
                      title="Mức Độ Ưu Tiên Cao"
                      value={data.suggestions?.filter((s) => s.priority === 'high').length || 0}
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Key Insights */}
              {data.analysis.key_insights && data.analysis.key_insights.length > 0 && (
                <>
                  <Divider style={{ borderColor: 'rgba(255,255,255,0.3)', margin: '16px 0' }} />
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 8 }}>
                    <Title level={5} style={{ color: 'white', marginBottom: 12 }}>
                      <TrophyOutlined /> Những Phát Hiện Chính
                    </Title>
                    <List
                      size="small"
                      dataSource={data.analysis.key_insights}
                      renderItem={(item) => (
                        <List.Item style={{ border: 'none', padding: '4px 0' }}>
                          <Text style={{ color: 'white' }}>• {item}</Text>
                        </List.Item>
                      )}
                    />
                  </div>
                </>
              )}

              {/* Best Practices */}
              {data.analysis.best_practices && data.analysis.best_practices.length > 0 && (
                <>
                  <Divider style={{ borderColor: 'rgba(255,255,255,0.3)', margin: '16px 0' }} />
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 8 }}>
                    <Title level={5} style={{ color: 'white', marginBottom: 12 }}>
                      <CheckCircleOutlined /> Khuyến Nghị Thực Hành Tốt
                    </Title>
                    <List
                      size="small"
                      dataSource={data.analysis.best_practices}
                      renderItem={(item) => (
                        <List.Item style={{ border: 'none', padding: '4px 0' }}>
                          <Text style={{ color: 'white' }}>✓ {item}</Text>
                        </List.Item>
                      )}
                    />
                  </div>
                </>
              )}
            </Card>
          )}

          {/* Fallback Warning */}
          {data.fallback && (
            <Alert
              message="Chế Độ Dự Phòng"
              description="AI tạm thời không khả dụng. Gợi ý được tạo dựa trên quy tắc cơ bản."
              type="warning"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          {/* Suggestions List */}
          <Title level={4} style={{ marginBottom: 16 }}>
            Gợi Ý Chi Tiết Cho Từng Sản Phẩm
          </Title>

          {data.suggestions && data.suggestions.length > 0 ? (
            <List
              grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 3 }}
              dataSource={data.suggestions}
              renderItem={(item) => {
                const priorityConfig = getPriorityConfig(item.priority);
                return (
                  <List.Item>
                    <Card
                      hoverable
                      style={{
                        borderLeft: `4px solid ${priorityConfig.color}`,
                        height: '100%',
                      }}
                      bodyStyle={{ padding: 16 }}
                    >
                      <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                        {/* Product Name & Priority */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Title level={5} style={{ margin: 0, flex: 1 }}>
                            {item.product_name}
                          </Title>
                          <Tag color={priorityConfig.color} icon={priorityConfig.icon}>
                            {priorityConfig.text}
                          </Tag>
                        </div>

                        <Divider style={{ margin: '8px 0' }} />

                        {/* Stock Info */}
                        <Row gutter={8}>
                          <Col span={12}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Tồn kho hiện tại
                            </Text>
                            <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff' }}>
                              {formatNumber(item.current_stock)}
                            </div>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Nên nhập
                            </Text>
                            <div style={{ fontSize: 16, fontWeight: 'bold', color: '#52c41a' }}>
                              {formatNumber(item.recommended_quantity)}
                            </div>
                          </Col>
                        </Row>

                        {/* Waste Rate */}
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Tỷ lệ hao hụt:{' '}
                          </Text>
                          <Tag color={item.waste_rate > 0.2 ? 'red' : item.waste_rate > 0.1 ? 'orange' : 'green'}>
                            {formatWasteRate(item.waste_rate)}
                          </Tag>
                        </div>

                        {/* Reasoning */}
                        <div
                          style={{
                            background: '#f5f5f5',
                            padding: 12,
                            borderRadius: 8,
                            fontSize: 13,
                          }}
                        >
                          <Text>
                            <InfoCircleOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                            {item.reasoning}
                          </Text>
                        </div>

                        {/* Warning */}
                        {item.warning && (
                          <Alert
                            message={item.warning}
                            type="warning"
                            showIcon
                            icon={<WarningOutlined />}
                            style={{ fontSize: 12 }}
                          />
                        )}
                      </Space>
                    </Card>
                  </List.Item>
                );
              }}
            />
          ) : (
            <Empty description="Không có gợi ý nào. Hệ thống chưa phát hiện vấn đề overstocking." />
          )}

          {/* Timestamp */}
          {data.timestamp && (
            <div style={{ textAlign: 'center', marginTop: 24, color: '#999', fontSize: 12 }}>
              Cập nhật lúc: {new Date(data.timestamp).toLocaleString('vi-VN')}
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

export default SmartSuggestions;
