import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Table,
  Card,
  Button,
  Space,
  Input,
  Drawer,
  Form,
  Select,
  message,
  Popconfirm,
  Tag,
  Typography,
  InputNumber,
  Row,
  Col,
  Alert,
  Tooltip,
  Radio,
  Divider,
  Statistic,
  Spin,
  Checkbox,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CameraOutlined,
  BarcodeOutlined,
  ThunderboltOutlined,
  StopOutlined,
  CheckCircleOutlined,
  FilterOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import BarcodeScanner from '../../components/BarcodeScanner';
import productUnitService from '../../services/productUnitService';
import productService from '../../services/productService';
import unitService from '../../services/unitService';

const { Title, Text } = Typography;

const ProductUnits = () => {
  const [searchParams] = useSearchParams();
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [stats, setStats] = useState({});
  const [quickAddUnitVisible, setQuickAddUnitVisible] = useState(false);
  const [quickUnitName, setQuickUnitName] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  
  // Barcode input method
  const [barcodeMethod, setBarcodeMethod] = useState('manual');
  
  // Filters
  const [filterBaseUnit, setFilterBaseUnit] = useState('all'); // 'all', 'base', 'non-base'
  
  // Products and units from API
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  
  const [form] = Form.useForm();
  const [initialized, setInitialized] = useState(false);

  // Initialize on mount - load dropdown data and set search from URL
  useEffect(() => {
    const initializePage = async () => {
      // Load dropdown data
      await loadDropdownData();
      
      // Get search param from URL
      const searchParam = searchParams.get('search');
      if (searchParam) {
        setSearchText(searchParam);
      }
      
      // Mark as initialized
      setInitialized(true);
    };
    
    initializePage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load dropdown data (products and units)
  const loadDropdownData = async () => {
    setLoadingDropdowns(true);
    try {
      const [productsRes, unitsRes] = await Promise.all([
        productService.getAll(),
        unitService.getAll()
      ]);

      if (productsRes.success) {
        setProducts(productsRes.data);
      }
      if (unitsRes.success) {
        setUnits(unitsRes.data);
      }
    } catch (error) {
      console.error('Failed to load dropdown data:', error);
      message.error('Không thể tải danh sách sản phẩm và đơn vị');
    } finally {
      setLoadingDropdowns(false);
    }
  };

  // Load data when dependencies change (but only after initialization)
  useEffect(() => {
    if (!initialized) return;
    
    loadProductUnits(searchText);
    loadStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, filterBaseUnit, searchText, initialized]);

  // Load product units from API
  const loadProductUnits = async (searchText = '') => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
      };

      // Add base unit filter
      if (filterBaseUnit === 'base') {
        params.is_base_unit = true;
      } else if (filterBaseUnit === 'non-base') {
        params.is_base_unit = false;
      }

      const response = await productUnitService.getAll(params);

      if (response.data.success) {
        const units = response.data.data.map((unit) => ({
          id: unit._id,
          key: unit._id,
          productId: unit.product_id?._id,
          productName: unit.product_id?.name,
          productImage: unit.product_id?.image_url,
          unitId: unit.unit_id?._id,
          unitName: unit.unit_id?.name,
          exchangeValue: unit.exchange_value,
          price: unit.price,
          barcode: unit.barcode,
          isBaseUnit: unit.is_base_unit,
          isActive: unit.is_active !== false,
        }));

        setFilteredData(units);
        setPagination({
          ...pagination,
          total: response.data.pagination.total,
        });
      }
    } catch (error) {
      message.error(error.message || 'Không thể tải danh sách đơn vị sản phẩm');
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStats = async () => {
    try {
      const response = await productUnitService.getStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Stats error:', error);
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      width: 200,
      render: (text, record) => (
        <Space>
          {record.productImage && (
            <img
              src={record.productImage}
              alt={text}
              style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }}
            />
          )}
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unitName',
      key: 'unitName',
      width: 80,
    },
    {
      title: 'Giá trị',
      dataIndex: 'exchangeValue',
      key: 'exchangeValue',
      align: 'right',
      width: 70,
    },
    {
      title: 'Giá bán',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      width: 100,
      render: (price) => `${price?.toLocaleString()}đ`,
    },
    {
      title: 'Mã vạch',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 150,
      render: (barcode) => (
        barcode ? (
          <Tag icon={<BarcodeOutlined />} color="blue">
            {barcode}
          </Tag>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: 'Cơ sở',
      dataIndex: 'isBaseUnit',
      key: 'isBaseUnit',
      align: 'center',
      width: 70,
      render: (isBase) => (
        isBase ? (
          <StarFilled style={{ color: '#faad14', fontSize: 18 }} />
        ) : (
          <StarOutlined style={{ color: '#d9d9d9', fontSize: 16 }} />
        )
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      align: 'center',
      width: 90,
      render: (isActive) => (
        isActive ? (
          <Tag color="green">Hoạt động</Tag>
        ) : (
          <Tag color="red">Ngưng</Tag>
        )
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Sửa">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title={record.isActive ? "Tắt đơn vị sản phẩm" : "Bật đơn vị sản phẩm"}
            description={record.isActive ? "Đơn vị này sẽ bị ẩn khỏi bán hàng" : "Đơn vị này sẽ hiển thị trong bán hàng"}
            onConfirm={() => handleToggleStatus(record.id, record.isActive)}
            okText="Có"
            cancelText="Không"
          >
            <Tooltip title={record.isActive ? "Tắt" : "Bật"}>
              <Button 
                type="text" 
                size="small" 
                danger={record.isActive}
                style={{ color: record.isActive ? undefined : '#52c41a' }}
                icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />} 
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Handle search
  const handleSearch = (value) => {
    loadProductUnits(value);
  };

  // Open drawer for create
  const handleCreate = () => {
    setEditingUnit(null);
    form.resetFields();
    form.setFieldsValue({
      exchangeValue: 1,
      price: 0,
      isBaseUnit: false,
    });
    setBarcodeMethod('manual');
    setDrawerVisible(true);
  };

  // Open drawer for edit
  const handleEdit = (unit) => {
    setEditingUnit(unit);
    form.setFieldsValue(unit);
    setDrawerVisible(true);
  };

  // Handle toggle status (disable/enable)
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const response = await productUnitService.update(id, { is_active: newStatus });
      if (response.data.success) {
        message.success(`Đã ${newStatus ? 'bật' : 'tắt'} đơn vị sản phẩm thành công`);
        loadProductUnits();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Không thể cập nhật trạng thái đơn vị sản phẩm';
      message.error(errorMessage);
    }
  };

  // Handle save
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // Prepare data for API
      const apiData = {
        product_id: values.productId,
        unit_id: values.unitId,
        exchange_value: values.exchangeValue,
        price: values.price,
        barcode: values.barcode || null,
        is_base_unit: values.isBaseUnit || false,
      };

      if (editingUnit) {
        // Update
        const response = await productUnitService.update(editingUnit.id, apiData);
        if (response.data.success) {
          message.success('Cập nhật đơn vị sản phẩm thành công');
          loadProductUnits();
        }
      } else {
        // Create
        const response = await productUnitService.create(apiData);
        if (response.data.success) {
          message.success('Tạo đơn vị sản phẩm thành công');
          loadProductUnits();
          loadStats();
        }
      }
      
      setDrawerVisible(false);
      form.resetFields();
    } catch (error) {
      // Lấy message từ response nếu có
      const errorMessage = error.response?.data?.message || error.message || 'Không thể lưu đơn vị sản phẩm';
      message.error(errorMessage);
      console.error('Save error:', error);
    }
  };

  // Handle barcode scan
  const handleBarcodeScanned = (barcode) => {
    form.setFieldsValue({ barcode });
    setScannerVisible(false);
    message.success(`Đã quét mã vạch: ${barcode}`);
  };

  // Generate internal barcode
  const handleGenerateBarcode = async () => {
    const productId = form.getFieldValue('productId');
    const unitId = form.getFieldValue('unitId');
    
    if (!productId) {
      message.warning('Vui lòng chọn sản phẩm trước');
      return;
    }
    
    if (!unitId) {
      message.warning('Vui lòng chọn đơn vị trước');
      return;
    }

    try {
      const response = await productUnitService.generateBarcode(productId, unitId);
      if (response.data.success) {
        const generatedBarcode = response.data.data.barcode;
        form.setFieldsValue({ barcode: generatedBarcode });
        message.success(`Đã tạo mã vạch: ${generatedBarcode}`);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Không thể tạo mã vạch';
      message.error(errorMessage);
    }
  };

  // Handle quick add unit
  const handleQuickAddUnit = async () => {
    const trimmedName = quickUnitName.trim();
    
    if (!trimmedName) {
      message.warning('Vui lòng nhập tên đơn vị');
      return;
    }

    // Validate: only letters, numbers, and spaces (not at start/end)
    const nameRegex = /^[a-zA-Z0-9\u00C0-\u1EF9]+( [a-zA-Z0-9\u00C0-\u1EF9]+)*$/;
    if (!nameRegex.test(trimmedName)) {
      message.error('Tên đơn vị chỉ được chứa chữ, số và khoảng trắng (không kí tự đặc biệt)');
      return;
    }

    try {
      const response = await unitService.create({ name: trimmedName });
      if (response.success) {
        message.success(`Đã thêm đơn vị "${trimmedName}" thành công`);
        setQuickAddUnitVisible(false);
        setQuickUnitName('');
        // Reload units
        await loadDropdownData();
        // Set the newly created unit as selected
        form.setFieldsValue({ unitId: response.data._id });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Không thể thêm đơn vị';
      message.error(errorMessage);
    }
  };

  return (
    <div>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={3}>Quản lý đơn vị sản phẩm</Title>
              <Text type="secondary">
                Quản lý đơn vị, giá bán và mã vạch sản phẩm
              </Text>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
                size="large"
              >
                Thêm đơn vị sản phẩm
              </Button>
            </Col>
          </Row>

          {/* Statistics Cards */}
          {stats.totalProductUnits > 0 && (
            <Row gutter={16}>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="Tổng số đơn vị sản phẩm"
                    value={stats.totalProductUnits}
                    styles={{ content: { color: '#3f8600' } }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="Số đơn vị cơ sở"
                    value={stats.totalBaseUnits}
                    styles={{ content: { color: '#1890ff' } }}
                  />
                </Card>
              </Col>
            </Row>
          )}

          {/* Filters and Search */}
          <Space size="middle" wrap style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space size="middle">
              <Space size="small">
                <FilterOutlined />
                <Text strong>Lọc:</Text>
              </Space>
              <Select
                placeholder="Loại đơn vị"
                style={{ width: 180 }}
                size="large"
                value={filterBaseUnit}
                onChange={(value) => {
                  setFilterBaseUnit(value);
                  setPagination({ ...pagination, current: 1 });
                }}
                options={[
                  { label: 'Tất cả', value: 'all' },
                  { label: 'Đơn vị cơ sở', value: 'base' },
                  { label: 'Không cơ sở', value: 'non-base' },
                ]}
              />
            </Space>
            
            <Input
              placeholder="Tìm kiếm theo tên sản phẩm hoặc mã vạch..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="large"
              style={{ width: 400 }}
            />
          </Space>
          
          <Table
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            rowKey="id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => `Tổng ${total} đơn vị sản phẩm`,
              onChange: (page, pageSize) => {
                setPagination({ ...pagination, current: page, pageSize });
              },
            }}
          />
        </Space>
      </Card>

      {/* Add/Edit Drawer */}
      <Drawer
        title={editingUnit ? 'Sửa đơn vị sản phẩm' : 'Thêm đơn vị sản phẩm'}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        size="large"
        extra={
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>Hủy</Button>
            <Button type="primary" onClick={handleSave}>
              Lưu
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Sản phẩm"
            name="productId"
            rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
          >
            <Select
              placeholder="Chọn sản phẩm"
              showSearch
              optionFilterProp="children"
              size="large"
              loading={loadingDropdowns}
              disabled={loadingDropdowns}
            >
              {products.map((product) => (
                <Select.Option key={product._id} value={product._id}>
                  {product.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Đơn vị"
            name="unitId"
            rules={[{ required: true, message: 'Vui lòng chọn đơn vị' }]}
            extra={
              <Button 
                type="link" 
                size="small" 
                icon={<PlusOutlined />}
                onClick={() => setQuickAddUnitVisible(true)}
                style={{ padding: 0, height: 'auto' }}
              >
                Thêm đơn vị mới
              </Button>
            }
          >
            <Select 
              placeholder="Chọn đơn vị" 
              size="large"
              loading={loadingDropdowns}
              disabled={loadingDropdowns}
              showSearch
              filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {units.map((unit) => (
                <Select.Option key={unit._id} value={unit._id}>
                  {unit.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Giá trị quy đổi"
                name="exchangeValue"
                rules={[{ required: true, message: 'Bắt buộc' }]}
                tooltip="Đơn vị này chứa bao nhiêu đơn vị cơ sở?"
              >
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Giá bán (VNĐ)"
                name="price"
                rules={[{ required: true, message: 'Bắt buộc' }]}
              >
                <InputNumber
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  style={{ width: '100%' }}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Phương thức nhập mã vạch</Divider>

          <Radio.Group
            value={barcodeMethod}
            onChange={(e) => setBarcodeMethod(e.target.value)}
            style={{ marginBottom: 16, width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio value="manual">
                <Space>
                  <BarcodeOutlined />
                  <span>Nhập thủ công (từ nhà sản xuất)</span>
                </Space>
              </Radio>
              <Radio value="scan">
                <Space>
                  <CameraOutlined />
                  <span>Quét bằng camera</span>
                </Space>
              </Radio>
              <Radio value="generate">
                <Space>
                  <ThunderboltOutlined />
                  <span>Tạo mã vạch nội bộ</span>
                </Space>
              </Radio>
            </Space>
          </Radio.Group>

          {/* Method 1: Manual Input */}
          {barcodeMethod === 'manual' && (
            <Form.Item
              label="Mã vạch"
              name="barcode"
              extra="Nhập mã vạch từ bao bì sản phẩm (EAN-13, EAN-8, UPC-A, Code-128)"
            >
              <Input
                placeholder="VD: 8934673200011"
                size="large"
                maxLength={50}
              />
            </Form.Item>
          )}

          {/* Phương thức 2: Quét camera */}
          {barcodeMethod === 'scan' && (
            <div>
              <Form.Item label="Mã vạch" name="barcode">
                <Input
                  placeholder="Mã vạch đã quét sẽ hiển thị ở đây"
                  size="large"
                  readOnly
                />
              </Form.Item>
              <Button
                icon={<CameraOutlined />}
                onClick={() => setScannerVisible(true)}
                size="large"
                block
                type="dashed"
              >
                Mở camera để quét
              </Button>
              <Alert
                message="Cần quyền truy cập camera"
                description="Nhấn nút bên trên để mở camera quét mã. Đặt mã vạch vào trong khung hình."
                type="info"
                showIcon
                style={{ marginTop: 12 }}
              />
            </div>
          )}

          {/* Phương thức 3: Tạo mã nội bộ */}
          {barcodeMethod === 'generate' && (
            <div>
              <Alert
                message="Tạo mã vạch nội bộ"
                description="Dành cho sản phẩm không có mã vạch nhà sản xuất (rau củ, bánh mì, v.v.). Mã vạch cố định sẽ được tạo cho tổ hợp sản phẩm và đơn vị này."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Button
                icon={<ThunderboltOutlined />}
                onClick={handleGenerateBarcode}
                size="large"
                block
                type="primary"
                style={{ marginBottom: 12 }}
              >
                Tạo mã vạch cố định
              </Button>

              <Form.Item label="Mã vạch đã tạo" name="barcode">
                <Input
                  placeholder="Chọn sản phẩm và đơn vị, sau đó nhấn tạo"
                  size="large"
                  readOnly
                />
              </Form.Item>
            </div>
          )}

          <Form.Item
            name="isBaseUnit"
            valuePropName="checked"
            extra={editingUnit?.isBaseUnit ? "Đơn vị cơ sở không thể thay đổi" : "Chỉ được phép một đơn vị cơ sở cho mỗi sản phẩm"}
          >
            <Checkbox disabled={editingUnit?.isBaseUnit}>
              Đặt làm đơn vị cơ sở
            </Checkbox>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Modal quét mã vạch */}
      <BarcodeScanner
        visible={scannerVisible}
        onScan={handleBarcodeScanned}
        onClose={() => setScannerVisible(false)}
      />

      {/* Quick Add Unit Modal */}
      <Drawer
        title="Thêm đơn vị mới"
        open={quickAddUnitVisible}
        onClose={() => {
          setQuickAddUnitVisible(false);
          setQuickUnitName('');
        }}
        width={400}
        extra={
          <Space>
            <Button onClick={() => {
              setQuickAddUnitVisible(false);
              setQuickUnitName('');
            }}>
              Hủy
            </Button>
            <Button type="primary" onClick={handleQuickAddUnit}>
              Thêm
            </Button>
          </Space>
        }
      >
        <Alert
          message="Thêm nhanh đơn vị"
          description="Thêm đơn vị mới (VD: Chai, Lon, Kg, Tá, Bịch) để sử dụng trong đơn vị sản phẩm."
          type="info"
          style={{ marginBottom: 16 }}
        />
        <Input
          placeholder="Nhập tên đơn vị (VD: Tá, Bịch)"
          value={quickUnitName}
          onChange={(e) => setQuickUnitName(e.target.value)}
          size="large"
          onPressEnter={handleQuickAddUnit}
          autoFocus
        />
      </Drawer>
    </div>
  );
};

export default ProductUnits;
