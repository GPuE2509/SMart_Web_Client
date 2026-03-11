import { useState, useEffect } from 'react';
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
  Tag,
  Typography,
  Row,
  Col,
  DatePicker,
  InputNumber,
  Divider,
  Popconfirm,
  Modal,
  Dropdown,
  Tooltip,
  Checkbox,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  DownOutlined,
  UpOutlined,
  StopOutlined,
  SwapOutlined,
  ExclamationCircleOutlined,
  BulbOutlined,
  PrinterOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import productBatchService from '../../services/productBatchService';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import productUnitService from '../../services/productUnitService';
import SmartSuggestions from '../../components/SmartSuggestions';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const ProductBatches = () => {
  const [batches, setBatches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [viewingBatch, setViewingBatch] = useState(null);
  const [smartSuggestionsVisible, setSmartSuggestionsVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expiryDateRange, setExpiryDateRange] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);
  // Store products and units for each item dynamically
  const [itemProducts, setItemProducts] = useState({});
  const [itemUnits, setItemUnits] = useState({});
  // Track collapsed state for each item
  const [collapsedItems, setCollapsedItems] = useState({});
  // Track collapsed state for detail view items
  const [detailCollapsedItems, setDetailCollapsedItems] = useState({});
  // Track edit mode for detail view
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  // Reject modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingBatchId, setRejectingBatchId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [form] = Form.useForm();
  const [detailForm] = Form.useForm();

  // Fetch batches on mount
  useEffect(() => {
    fetchBatches();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch categories for filter
  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAll({ limit: 1000 });
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch batches from API with pagination
  const fetchBatches = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: params.page || pagination.current,
        limit: params.limit || pagination.pageSize,
        ...params,
        // Use params.include_deleted if provided, otherwise use state
        include_deleted: params.include_deleted !== undefined ? params.include_deleted : showDeleted,
      };

      const response = await productBatchService.getAll(queryParams);
      const data = response.data || [];
      setBatches(data);
      setPagination((prev) => ({
        ...prev,
        current: response.pagination?.page || prev.current,
        pageSize: response.pagination?.limit || prev.pageSize,
        total: response.pagination?.total || data.length,
      }));
    } catch (error) {
      message.error(error.message || 'Không thể tải danh sách lô hàng');
    } finally {
      setLoading(false);
    }
  };

  // Search handler
  const handleSearch = (value) => {
    setSearchText(value);
    const params = { page: 1 };
    if (value) params.search = value;
    if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
    fetchBatches(params);
  };

  // Status filter handler
  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    const params = { page: 1 };
    if (searchText) params.search = searchText;
    if (value && value !== 'all') params.status = value;
    fetchBatches(params);
  };

  // Show deleted handler
  const handleShowDeletedChange = (checked) => {
    setShowDeleted(checked);
    const params = {
      page: 1,
      include_deleted: checked,  // Pass directly instead of relying on state
    };
    if (searchText) params.search = searchText;
    if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
    if (expiryDateRange) {
      if (expiryDateRange[0]) params.expiry_date_from = expiryDateRange[0].format('YYYY-MM-DD');
      if (expiryDateRange[1]) params.expiry_date_to = expiryDateRange[1].format('YYYY-MM-DD');
    }
    fetchBatches(params);
  };

  // Handle category change for an item - load products of this category
  const handleCategoryChange = async (categoryId, itemIndex) => {
    try {
      const response = await productService.getAll({
        category_id: categoryId,
        limit: 1000,
      });
      setItemProducts((prev) => ({
        ...prev,
        [itemIndex]: response.data || [],
      }));
      // Reset product and unit for this item
      const items = form.getFieldValue('items') || [];
      items[itemIndex] = {
        ...items[itemIndex],
        product_id: undefined,
        unit_id: undefined,
      };
      form.setFieldsValue({ items });
      // Clear units for this item
      setItemUnits((prev) => ({
        ...prev,
        [itemIndex]: [],
      }));
    } catch {
      message.error('Không thể tải sản phẩm');
    }
  };

  // Handle product change for an item - load units of this product
  const handleProductChange = async (productId, itemIndex) => {
    try {
      const response = await productUnitService.getByProductId(productId);
      setItemUnits((prev) => ({
        ...prev,
        [itemIndex]: response.data?.data || [],
      }));
      // Reset unit for this item
      const items = form.getFieldValue('items') || [];
      items[itemIndex] = {
        ...items[itemIndex],
        unit_id: undefined,
      };
      form.setFieldsValue({ items });
    } catch {
      message.error('Không thể tải đơn vị');
    }
  };

  // Toggle collapse state for an item
  const toggleCollapse = (index) => {
    setCollapsedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Get summary text for a collapsed item
  const getItemSummary = (index) => {
    const items = form.getFieldValue('items') || [];
    const item = items[index];
    if (!item) return 'Chưa có dữ liệu';

    const product = itemProducts[index]?.find((p) => p._id === item.product_id);
    const unit = itemUnits[index]?.find((u) => u.unit_id?._id === item.unit_id);

    const parts = [];
    if (product) parts.push(product.name);
    if (unit && item.initial_quantity) parts.push(`${item.initial_quantity} ${unit.unit_id?.name || 'đơn vị'}`);
    if (item.import_price) parts.push(`${item.import_price.toLocaleString()}đ`);
    if (item.expiry_date) parts.push(`HSD: ${item.expiry_date.format('DD/MM/YYYY')}`);

    return parts.length > 0 ? parts.join(' • ') : 'Chưa hoàn thành';
  };

  // Handle table pagination change
  const handleTableChange = (paginationConfig) => {
    const params = {
      page: paginationConfig.current,
      limit: paginationConfig.pageSize,
    };
    if (searchText) params.search = searchText;
    if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
    fetchBatches(params);
  };

  // Open drawer for import
  const handleOpenImportDrawer = () => {
    form.resetFields();
    // Initialize with one empty item
    form.setFieldsValue({
      items: [{}],
    });
    setItemProducts({});
    setItemUnits({});
    setDrawerVisible(true);
  };

  // View batch detail
  const handleViewDetail = async (batchId) => {
    try {
      setLoading(true);
      const response = await productBatchService.getById(batchId);

      // Set all items collapsed by default
      const collapsedState = {};
      response.data?.items?.forEach((_, index) => {
        collapsedState[index] = true;
      });
      setDetailCollapsedItems(collapsedState);

      setViewingBatch(response.data);
      setDetailDrawerVisible(true);
    } catch {
      message.error('Không thể tải chi tiết lô hàng');
    } finally {
      setLoading(false);
    }
  };

  // Close detail drawer
  const handleCloseDetailDrawer = () => {
    setDetailDrawerVisible(false);
    setViewingBatch(null);
    setDetailCollapsedItems({});
    setIsEditingDetail(false);
    detailForm.resetFields();
  };

  // Start editing detail
  const handleStartEditDetail = () => {
    // Populate form with current values
    detailForm.setFieldsValue({
      items: viewingBatch.items.map(item => ({
        initial_quantity: item.initial_quantity,
        current_quantity: item.current_quantity,
        import_price: item.import_price,
        manufacture_date: item.manufacture_date ? dayjs(item.manufacture_date) : null,
        expiry_date: item.expiry_date ? dayjs(item.expiry_date) : null,
        supplier_name: item.supplier_name || '',
      }))
    });
    setIsEditingDetail(true);
  };

  // Cancel editing detail
  const handleCancelEditDetail = () => {
    setIsEditingDetail(false);
    detailForm.resetFields();
  };

  // Save detail changes
  const handleSaveDetail = async () => {
    try {
      const values = await detailForm.validateFields();
      setLoading(true);

      // Prepare update data
      const updatedItems = viewingBatch.items.map((item, index) => ({
        product_id: item.product_id._id,
        unit_id: item.unit_id._id,
        initial_quantity: values.items[index].initial_quantity,
        current_quantity: values.items[index].current_quantity,
        import_price: values.items[index].import_price,
        manufacture_date: values.items[index].manufacture_date?.toISOString() || item.manufacture_date,
        expiry_date: values.items[index].expiry_date?.toISOString() || item.expiry_date,
        supplier_name: values.items[index].supplier_name || item.supplier_name,
      }));

      await productBatchService.update(viewingBatch._id, { items: updatedItems });
      message.success('Cập nhật lô hàng thành công!');

      // Refresh detail view
      const response = await productBatchService.getById(viewingBatch._id);
      setViewingBatch(response.data);
      setIsEditingDetail(false);
      detailForm.resetFields();

      // Refresh list
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
      };
      if (searchText) params.search = searchText;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      fetchBatches(params);
    } catch (error) {
      console.error('Error updating batch:', error);
      message.error(error.message || 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setLoading(false);
    }
  };

  // Toggle collapse for detail view item
  const toggleDetailCollapse = (index) => {
    setDetailCollapsedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Close drawer
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setItemProducts({});
    setItemUnits({});
    setCollapsedItems({});
    form.resetFields();
  };

  // Save batch
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Import new batch - prepare items array with dates
      // Filter out empty/incomplete items
      const validItems = (values.items || []).filter(
        item => item && item.product_id && item.unit_id && item.initial_quantity
      );

      if (validItems.length === 0) {
        message.error('Vui lòng thêm ít nhất 1 sản phẩm hợp lệ');
        setLoading(false);
        return;
      }

      const batchData = {
        items: validItems.map(item => ({
          product_id: item.product_id,
          unit_id: item.unit_id,
          initial_quantity: item.initial_quantity,
          current_quantity: item.current_quantity || item.initial_quantity,
          import_price: item.import_price || 0,
          manufacture_date: item.manufacture_date?.toISOString() || null,
          expiry_date: item.expiry_date?.toISOString() || null,
          supplier_name: item.supplier_name || '',
        })),
      };

      await productBatchService.importBatch(batchData);
      message.success('Nhập lô hàng thành công!');

      handleCloseDrawer();
      // Refresh the current page with current filters
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
      };
      if (searchText) params.search = searchText;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      fetchBatches(params);
    } catch (error) {
      console.error('Error details:', error);
      message.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colorMap = {
      active: 'green',
      near_expiry: 'orange',
      expired: 'red',
      instock: 'blue',
      outdate: 'red',
      onsale: 'cyan',
      sold: 'purple',
      rejected: 'gray',
    };
    return colorMap[status] || 'default';
  };

  // Get status label
  const getStatusLabel = (status) => {
    const labelMap = {
      active: 'Hoạt động',
      near_expiry: 'Sắp hết hạn',
      expired: 'Hết hạn',
      instock: 'Trong kho',
      outdate: 'Quá hạn',
      onsale: 'Đang bán',
      sold: 'Đã bán hết',
      rejected: 'Đã từ chối',
    };
    return labelMap[status] || status;
  };

  // Get item status based on expiry date
  const getItemStatus = (expiryDate) => {
    if (!expiryDate) return 'active';

    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return 'expired';
    } else if (daysUntilExpiry <= 30) {
      return 'near_expiry';
    } else {
      return 'active';
    }
  };

  // Get current filter params
  const getCurrentFilterParams = () => {
    const params = {
      page: pagination.current,
      limit: pagination.pageSize,
      include_deleted: showDeleted,
    };
    if (searchText) params.search = searchText;
    if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
    if (expiryDateRange && expiryDateRange[0]) {
      params.expiry_date_from = expiryDateRange[0].format('YYYY-MM-DD');
    }
    if (expiryDateRange && expiryDateRange[1]) {
      params.expiry_date_to = expiryDateRange[1].format('YYYY-MM-DD');
    }
    return params;
  };

  // Handle expiry date range filter
  const handleExpiryDateFilter = (dates) => {
    setExpiryDateRange(dates);
    const params = { page: 1 };
    if (searchText) params.search = searchText;
    if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
    if (dates && dates[0]) params.expiry_date_from = dates[0].format('YYYY-MM-DD');
    if (dates && dates[1]) params.expiry_date_to = dates[1].format('YYYY-MM-DD');
    fetchBatches(params);
  };

  // Open reject modal
  const handleOpenRejectModal = (batchId) => {
    setRejectingBatchId(batchId);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  // Close reject modal
  const handleCloseRejectModal = () => {
    setRejectModalVisible(false);
    setRejectingBatchId(null);
    setRejectReason('');
  };

  // Confirm reject batch
  const handleConfirmReject = async () => {
    try {
      setLoading(true);
      await productBatchService.reject(rejectingBatchId, rejectReason);
      message.success('Từ chối lô hàng thành công');
      handleCloseRejectModal();
      fetchBatches(getCurrentFilterParams());
    } catch (error) {
      message.error(error.message || 'Không thể từ chối lô hàng');
    } finally {
      setLoading(false);
    }
  };

  // Handle change status
  const handleChangeStatus = async (batchId, newStatus) => {
    try {
      setLoading(true);
      await productBatchService.changeStatus(batchId, newStatus);
      message.success('Thay đổi trạng thái thành công');
      fetchBatches(getCurrentFilterParams());
    } catch (error) {
      message.error(error.message || 'Không thể thay đổi trạng thái');
    } finally {
      setLoading(false);
    }
  };

  // Toggle rescue pricing for an item
  const handleToggleRescuePricing = async (batchId, itemId, enabled) => {
    try {
      setLoading(true);
      const response = await productBatchService.toggleRescuePricing(batchId, itemId, enabled);

      // Show detailed message based on response
      if (enabled) {
        const item = response.data;
        if (item.rescue_pricing_active && item.rescue_discount_percentage > 0) {
          message.success(`Đã bật giảm giá tự động: ${item.rescue_discount_percentage}%`, 3);
        } else {
          message.info('Đã bật giảm giá tự động (sản phẩm chưa trong thời gian giảm giá)', 3);
        }
      } else {
        message.success('Đã tắt giảm giá tự động');
      }

      // Refresh detail view if open
      if (viewingBatch && viewingBatch._id === batchId) {
        const refreshResponse = await productBatchService.getById(batchId);
        setViewingBatch(refreshResponse.data);
      }

      // Refresh list
      fetchBatches(getCurrentFilterParams());
    } catch (error) {
      message.error(error.message || 'Không thể thay đổi cài đặt giảm giá');
    } finally {
      setLoading(false);
    }
  };

  // Print label for item
  const handlePrintLabel = async (batchId, itemId, itemName) => {
    try {
      setLoading(true);
      const response = await productBatchService.getPrintLabel(batchId, itemId);
      const labelData = response.data;

      // Create label content
      const labelContent = `
        <div class="label">
          ${labelData.rescuePricing ? `
            <div class="discount-badge">💰 KHUYẾN MÃI</div>
          ` : ''}
          
          <div class="product-info">
            <div class="product-name">${labelData.productName}</div>
            <div class="product-unit">${labelData.unitName}</div>
          </div>
          
          <div class="price-container">
            ${labelData.rescuePricing ? `
              <div class="price-row">
                <span class="original-price">${Math.round(labelData.originalPrice || 0).toLocaleString()}</span>
                <span class="original-price">đ</span>
                <span class="discount-percent">-${labelData.discountPercentage}%</span>
              </div>
            ` : ''}
            <div class="final-price-row">
              <span class="final-price">${Math.round(labelData.finalPrice || 0).toLocaleString()}</span>
              <span class="currency">đ</span>
            </div>
          </div>
        </div>
      `;

      // Duplicate label 8 times (2x4 grid on A4 - landscape labels)
      const labelsGrid = Array(8).fill(labelContent).join('');

      // Create a simple print window
      const printWindow = window.open('', '_blank');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Nhãn Giá - ${itemName}</title>
          <style>
            @page {
              size: A4;
              margin: 5mm;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              width: 210mm;
              background: white;
              margin: 0 auto;
            }
            .page {
              width: 210mm;
              min-height: 297mm;
              display: grid;
              grid-template-columns: repeat(2, 90mm);
              grid-template-rows: repeat(4, 60mm);
              gap: 5mm;
              padding: 10mm;
              page-break-after: always;
            }
            .label {
              position: relative;
              width: 90mm;
              height: 60mm;
              display: flex;
              flex-direction: row;
              padding: 4mm;
              background: #FFF4E6;
              border: 1px solid #ff4d4f;
            }
            
            /* Discount badge - top right corner */
            .discount-badge {
              position: absolute;
              top: 0;
              right: 0;
              background: #ff4d4f;
              color: white;
              padding: 2mm 4mm;
              font-weight: bold;
              font-size: 12px;
              border-bottom-left-radius: 3mm;
            }
            
            /* Product info section - left side */
            .product-info {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              padding-right: 4mm;
              margin-top: 8mm;
            }
            
            .product-name {
              font-size: 25px;
              font-weight: bold;
              line-height: 1.3;
              margin-bottom: 2mm;
              color: #000;
              text-transform: uppercase;
            }
            
            .product-unit {
              font-size: 20px;
              color: #666;
            }
            
            /* Price container - right side */
            .price-container {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              border-left: 2px solid #ff4d4f;
              padding-left: 4mm;
            }
            
            .price-row {
              display: flex;
              align-items: center;
              gap: 2mm;
              margin-bottom: 2mm;
            }
            
            .original-price {
              text-decoration: line-through;
              color: #999;
              font-size: 13px;
            }
            
            .discount-percent {
              background: #ff4d4f;
              color: white;
              padding: 1mm 2mm;
              border-radius: 2mm;
              font-size: 12px;
              font-weight: bold;
            }
            
            /* Final price - the main attraction */
            .final-price-row {
              display: flex;
              align-items: baseline;
              gap: 1mm;
              margin-top: 2mm;
            }
            
            .currency {
              font-size: 18px;
              font-weight: bold;
              color: #ff4d4f;
            }
            
            .final-price {
              font-size: 36px;
              font-weight: bold;
              color: #ff4d4f;
              line-height: 1;
            }
            
            @media print {
              body { 
                margin: 0; 
                padding: 0;
              }
              .label {
                background: #FFF4E6;
                border: 1px solid #ff4d4f;
                page-break-inside: avoid;
              }
              .page {
                page-break-after: always;
              }
            }
          </style>
        </head>
        <body>
          <div class="page">
            ${labelsGrid}
          </div>
        </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };

      message.success('Đã mở cửa sổ in nhãn');
    } catch (error) {
      message.error(error.message || 'Không thể tạo nhãn in');
    } finally {
      setLoading(false);
    }
  };

  // Set manual discount for item
  const handleSetManualDiscount = async (batchId, itemId, discountPercentage) => {
    try {
      setLoading(true);
      await productBatchService.setManualDiscount(batchId, itemId, discountPercentage);

      message.success(`Đã đặt giảm giá thủ công: ${discountPercentage}%`);

      // Refresh detail view if open
      if (viewingBatch && viewingBatch._id === batchId) {
        const refreshResponse = await productBatchService.getById(batchId);
        setViewingBatch(refreshResponse.data);
      }

      // Refresh list
      fetchBatches(getCurrentFilterParams());
    } catch (error) {
      message.error(error.message || 'Không thể đặt giảm giá thủ công');
    } finally {
      setLoading(false);
    }
  };

  // Calculate days until expiry
  const calculateDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Format status display with item counts
  const formatStatusDisplay = (record) => {
    if (!record.status_summary) {
      return getStatusLabel(record.status);
    }

    const counts = record.status_summary;
    const primary = record.status;

    // If all sold, just show "Đã bán hết"
    if (primary === 'sold') {
      return 'Đã bán hết';
    }

    // If rejected, just show "Đã từ chối"
    if (primary === 'rejected') {
      return 'Đã từ chối';
    }

    // Build display string with primary status and additional info
    let display = getStatusLabel(primary);
    const extras = [];

    // Add outdate count if any
    if (counts.outdate > 0) {
      extras.push(`${counts.outdate} quá hạn`);
    }

    // Add sold count if any (but not all)
    if (counts.sold > 0) {
      extras.push(`${counts.sold} đã bán hết`);
    }

    if (extras.length > 0) {
      display += ` (${extras.join(', ')})`;
    }

    return display;
  };

  // Status menu items for dropdown - only allow instock and onsale
  const getStatusMenuItems = (currentStatus, canChange) => {
    // Cannot change status if rejected or all sold
    if (!canChange) {
      return [];
    }

    const allowedStatuses = ['instock', 'onsale'];
    return allowedStatuses
      .filter((s) => s !== currentStatus)
      .map((status) => ({
        key: status,
        label: getStatusLabel(status),
      }));
  };

  // Table columns
  const columns = [
    {
      title: 'Mã lô',
      dataIndex: 'batch_code',
      key: 'batch_code',
      width: 150,
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => handleViewDetail(record._id)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: 'Số sản phẩm',
      dataIndex: 'items',
      key: 'items',
      width: 110,
      align: 'center',
      render: (items) => (
        <Tag color="blue">{items?.length || 0} sản phẩm</Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 200,
      render: (status, record) => (
        <Tag color={getStatusColor(status)}>{formatStatusDisplay(record)}</Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => {
        // Cannot perform actions if deleted or rejected
        if (record.is_deleted || record.status === 'rejected') {
          return <Tag color="gray">Đã từ chối</Tag>;
        }

        // Cannot change status if all sold
        if (record.status === 'sold') {
          return <Tag color="purple">Đã bán hết</Tag>;
        }

        const canChange = record.can_change_status !== false;
        const menuItems = getStatusMenuItems(record.status, canChange);

        return (
          <Space size="small">
            {canChange && menuItems.length > 0 && (
              <Dropdown
                menu={{
                  items: menuItems,
                  onClick: ({ key }) => handleChangeStatus(record._id, key),
                }}
                trigger={['click']}
              >
                <Tooltip title="Đổi trạng thái">
                  <Button type="text" size="small" icon={<SwapOutlined />}>
                    <DownOutlined style={{ fontSize: 10 }} />
                  </Button>
                </Tooltip>
              </Dropdown>
            )}
            <Tooltip title="Từ chối lô hàng">
              <Button
                type="text"
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => handleOpenRejectModal(record._id)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Card>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Title level={3} style={{ margin: 0 }}>
              Quản lý lô hàng
            </Title>
            <Space>
              <Button
                icon={<BulbOutlined />}
                onClick={() => setSmartSuggestionsVisible(true)}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                }}
              >
                Gợi ý thông minh
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleOpenImportDrawer}
              >
                Nhập lô hàng
              </Button>
            </Space>
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Tìm kiếm theo mã lô, sản phẩm..."
                prefix={<SearchOutlined />}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Trạng thái"
                style={{ width: '100%' }}
                value={statusFilter}
                onChange={handleStatusFilter}
                options={[
                  { label: 'Tất cả trạng thái', value: 'all' },
                  { label: 'Trong kho', value: 'instock' },
                  { label: 'Đang bán', value: 'onsale' },
                  { label: 'Sắp hết hạn', value: 'near_expiry' },
                  { label: 'Hết hạn', value: 'expired' },
                  { label: 'Đã bán hết', value: 'sold' },
                  { label: 'Đã từ chối', value: 'rejected' },
                ]}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <RangePicker
                style={{ width: '100%' }}
                placeholder={['Từ ngày HSD', 'Đến ngày HSD']}
                format="DD/MM/YYYY"
                value={expiryDateRange}
                onChange={handleExpiryDateFilter}
              />
            </Col>
            <Col xs={24} sm={12} md={2}>
              <Checkbox
                checked={showDeleted}
                onChange={(e) => handleShowDeletedChange(e.target.checked)}
              >
                Hiển thị lô đã từ chối
              </Checkbox>
            </Col>
          </Row>

          <Table
            columns={columns}
            dataSource={batches}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => `Tổng ${total} lô hàng`,
            }}
            onChange={handleTableChange}
          />
        </Space>
      </Card>

      {/* Import Drawer */}
      <Drawer
        title="Nhập lô hàng mới"
        open={drawerVisible}
        onClose={handleCloseDrawer}
        width={600}
        extra={
          <Space>
            <Button onClick={handleCloseDrawer}>Hủy</Button>
            <Button type="primary" onClick={handleSave} loading={loading}>
              Nhập hàng
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Divider>Danh sách sản phẩm</Divider>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Card
                    key={key}
                    size="small"
                    style={{ marginBottom: 16 }}
                    title={
                      <Space>
                        <span>Sản phẩm {index + 1}</span>
                        {collapsedItems[index] && (
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {getItemSummary(index)}
                          </Typography.Text>
                        )}
                      </Space>
                    }
                    extra={
                      <Space>
                        <Button
                          type="text"
                          size="small"
                          icon={collapsedItems[index] ? <DownOutlined /> : <UpOutlined />}
                          onClick={() => toggleCollapse(index)}
                        />
                        {fields.length > 1 && (
                          <MinusCircleOutlined
                            onClick={() => {
                              remove(name);
                              // Clean up state for this item
                              setItemProducts((prev) => {
                                const newState = { ...prev };
                                delete newState[index];
                                return newState;
                              });
                              setItemUnits((prev) => {
                                const newState = { ...prev };
                                delete newState[index];
                                return newState;
                              });
                              setCollapsedItems((prev) => {
                                const newState = { ...prev };
                                delete newState[index];
                                return newState;
                              });
                            }}
                            style={{ color: 'red', fontSize: 18 }}
                          />
                        )}
                      </Space>
                    }
                  >
                    <div style={{ display: collapsedItems[index] ? 'none' : 'block' }}>
                      <Form.Item
                        {...restField}
                        name={[name, 'category_id']}
                        label="Danh mục"
                        rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                      >
                        <Select
                          placeholder="Chọn danh mục"
                          showSearch
                          optionFilterProp="children"
                          onChange={(value) => handleCategoryChange(value, index)}
                        >
                          {categories.map((cat) => (
                            <Select.Option key={cat._id} value={cat._id}>
                              {cat.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'product_id']}
                        label="Sản phẩm"
                        rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
                      >
                        <Select
                          placeholder="Chọn sản phẩm"
                          showSearch
                          optionFilterProp="children"
                          onChange={(value) => handleProductChange(value, index)}
                          disabled={!itemProducts[index]?.length}
                        >
                          {(itemProducts[index] || []).map((product) => (
                            <Select.Option key={product._id} value={product._id}>
                              {product.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'unit_id']}
                        label="Đơn vị"
                        rules={[{ required: true, message: 'Vui lòng chọn đơn vị' }]}
                      >
                        <Select
                          placeholder="Chọn đơn vị"
                          disabled={!itemUnits[index]?.length}
                        >
                          {(itemUnits[index] || []).map((unit) => (
                            <Select.Option key={unit._id} value={unit.unit_id._id}>
                              {unit.unit_id.name} (x{unit.exchange_value})
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            name={[name, 'initial_quantity']}
                            label="Số lượng"
                            rules={[
                              { required: true, message: 'Vui lòng nhập số lượng' },
                              {
                                validator: (_, value) => {
                                  if (!value || value < 1) {
                                    return Promise.reject('Số lượng phải lớn hơn 0');
                                  }
                                  return Promise.resolve();
                                },
                              },
                            ]}
                          >
                            <InputNumber
                              placeholder="Số lượng"
                              min={1}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            name={[name, 'import_price']}
                            label="Giá nhập"
                            rules={[
                              { required: true, message: 'Vui lòng nhập giá' },
                            ]}
                          >
                            <InputNumber
                              placeholder="Giá nhập"
                              min={0}
                              style={{ width: '100%' }}
                              formatter={(value) =>
                                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                              }
                              parser={(value) => value?.replace(/\$\s?|(,*)/g, '')}
                              addonAfter="đ"
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            name={[name, 'manufacture_date']}
                            label="Ngày sản xuất"
                            rules={[
                              {
                                required: true,
                                message: 'Vui lòng chọn ngày sản xuất',
                              },
                              () => ({
                                validator(_, value) {
                                  if (!value) {
                                    return Promise.resolve();
                                  }
                                  const today = dayjs().startOf('day');
                                  if (value.isAfter(today, 'day')) {
                                    return Promise.reject(
                                      new Error('NSX không được ở tương lai')
                                    );
                                  }
                                  return Promise.resolve();
                                },
                              }),
                            ]}
                          >
                            <DatePicker
                              placeholder="Chọn ngày"
                              format="DD/MM/YYYY"
                              style={{ width: '100%' }}
                              disabledDate={(current) => {
                                return current && current > dayjs().endOf('day');
                              }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            name={[name, 'expiry_date']}
                            label="Hạn sử dụng"
                            rules={[
                              {
                                required: true,
                                message: 'Vui lòng chọn hạn sử dụng',
                              },
                              () => ({
                                validator(_, value) {
                                  if (!value) {
                                    return Promise.resolve();
                                  }
                                  const today = dayjs().startOf('day');
                                  if (value.isBefore(today, 'day')) {
                                    return Promise.reject(
                                      new Error('Hạn SD không được ở quá khứ')
                                    );
                                  }
                                  return Promise.resolve();
                                },
                              }),
                              ({ getFieldValue }) => ({
                                validator(_, value) {
                                  const items = getFieldValue('items');
                                  const manufactureDate = items?.[index]?.manufacture_date;
                                  if (!value || !manufactureDate) {
                                    return Promise.resolve();
                                  }
                                  const diffInDays = value.diff(manufactureDate, 'days');
                                  if (diffInDays < 1) {
                                    return Promise.reject(
                                      new Error('Hạn SD phải sau NSX ít nhất 1 ngày')
                                    );
                                  }
                                  return Promise.resolve();
                                },
                              }),
                            ]}
                          >
                            <DatePicker
                              placeholder="Chọn ngày"
                              format="DD/MM/YYYY"
                              style={{ width: '100%' }}
                              disabledDate={(current) => {
                                return current && current < dayjs().startOf('day');
                              }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        {...restField}
                        name={[name, 'supplier_name']}
                        label="Nhà cung cấp"
                      >
                        <Input placeholder="Nhập tên nhà cung cấp" />
                      </Form.Item>
                    </div>
                  </Card>
                ))}

                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusCircleOutlined />}
                  style={{ marginBottom: 16 }}
                >
                  Thêm sản phẩm
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Drawer>

      {/* Detail View Drawer */}
      <Drawer
        title="Chi tiết lô hàng"
        open={detailDrawerVisible}
        onClose={handleCloseDetailDrawer}
        width={700}
        extra={
          <Space>
            {!isEditingDetail ? (
              !viewingBatch?.is_deleted && (
                <Button type="primary" onClick={handleStartEditDetail}>
                  Chỉnh sửa
                </Button>
              )
            ) : (
              <>
                <Button onClick={handleCancelEditDetail}>Hủy</Button>
                <Button type="primary" onClick={handleSaveDetail} loading={loading}>
                  Lưu
                </Button>
              </>
            )}
          </Space>
        }
      >
        {viewingBatch && (
          <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            {/* Batch Info */}
            <Card title="Thông tin lô hàng" size="small">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Typography.Text strong>Mã lô:</Typography.Text>
                  <br />
                  <Typography.Text>{viewingBatch.batch_code}</Typography.Text>
                </Col>
                <Col span={12}>
                  <Typography.Text strong>Số lượng sản phẩm:</Typography.Text>
                  <br />
                  <Typography.Text>{viewingBatch.items?.length || 0} sản phẩm</Typography.Text>
                </Col>
              </Row>
            </Card>

            {/* Rejection Info - Only show if batch is rejected */}
            {viewingBatch.is_deleted && viewingBatch.rejection_note && (
              <Card
                title={
                  <Space>
                    <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                    <span>Thông tin từ chối</span>
                  </Space>
                }
                size="small"
                style={{
                  borderColor: '#ff4d4f',
                  backgroundColor: '#fff2f0'
                }}
              >
                <Row gutter={[16, 8]}>
                  <Col span={24}>
                    <Typography.Text strong>Lý do từ chối:</Typography.Text>
                    <br />
                    <Typography.Text>{viewingBatch.rejection_note}</Typography.Text>
                  </Col>
                  {viewingBatch.rejection_date && (
                    <Col span={12}>
                      <Typography.Text strong>Ngày từ chối:</Typography.Text>
                      <br />
                      <Typography.Text>
                        {dayjs(viewingBatch.rejection_date).format('DD/MM/YYYY HH:mm')}
                      </Typography.Text>
                    </Col>
                  )}
                  {viewingBatch.rejection_by && (
                    <Col span={12}>
                      <Typography.Text strong>Người từ chối:</Typography.Text>
                      <br />
                      <Typography.Text>
                        {viewingBatch.rejection_by.name || viewingBatch.rejection_by.email}
                      </Typography.Text>
                    </Col>
                  )}
                </Row>
              </Card>
            )}

            {/* Items List */}
            <Card title="Danh sách sản phẩm" size="small">
              <Form form={detailForm} layout="vertical">
                <Form.List name="items">
                  {() => (
                    <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                      {viewingBatch.items?.map((item, index) => (
                        <Card
                          key={index}
                          size="small"
                          style={{ backgroundColor: '#fafafa' }}
                          title={
                            <Space>
                              <span>Sản phẩm {index + 1}</span>
                              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                                - {item.product_id?.name || 'N/A'}
                              </Typography.Text>
                              <Tag color={getStatusColor(item.status || 'instock')} style={{ fontSize: 11 }}>
                                {getStatusLabel(item.status || 'instock')}
                              </Tag>
                            </Space>
                          }
                          extra={
                            <Button
                              type="text"
                              size="small"
                              icon={detailCollapsedItems[index] ? <DownOutlined /> : <UpOutlined />}
                              onClick={() => toggleDetailCollapse(index)}
                            />
                          }
                        >
                          <div style={{ display: detailCollapsedItems[index] ? 'none' : 'block' }}>
                            <Row gutter={[16, 8]}>
                              <Col span={12}>
                                <Typography.Text strong>Đơn vị:</Typography.Text>
                                <br />
                                <Typography.Text>
                                  {item.unit_id?.name || 'N/A'}
                                  {item.exchange_value && ` (x${item.exchange_value})`}
                                </Typography.Text>
                              </Col>
                              <Col span={12}>
                                <Typography.Text strong>Trạng thái:</Typography.Text>
                                <br />
                                <Space>
                                  <Tag color={getStatusColor(item.status || 'instock')}>
                                    {getStatusLabel(item.status || 'instock')}
                                  </Tag>
                                  <Tag color={getStatusColor(getItemStatus(item.expiry_date))}>
                                    {getStatusLabel(getItemStatus(item.expiry_date))}
                                  </Tag>
                                </Space>
                              </Col>
                              <Col span={12}>
                                <Typography.Text strong>Số lượng ban đầu:</Typography.Text>
                                <br />
                                {isEditingDetail ? (
                                  <Form.Item
                                    name={[index, 'initial_quantity']}
                                    rules={[
                                      { required: true, message: 'Vui lòng nhập số lượng' },
                                      {
                                        validator: (_, value) => {
                                          if (!value || value < 1) {
                                            return Promise.reject('Số lượng phải lớn hơn 0');
                                          }
                                          return Promise.resolve();
                                        },
                                      },
                                    ]}
                                    style={{ marginBottom: 0 }}
                                  >
                                    <InputNumber
                                      placeholder="Số lượng ban đầu"
                                      min={1}
                                      style={{ width: '100%' }}
                                    />
                                  </Form.Item>
                                ) : (
                                  <Typography.Text>
                                    {item.initial_quantity?.toLocaleString() || 0}
                                  </Typography.Text>
                                )}
                              </Col>
                              <Col span={12}>
                                <Typography.Text strong>Số lượng hiện tại:</Typography.Text>
                                <br />
                                {isEditingDetail ? (
                                  <Form.Item
                                    name={[index, 'current_quantity']}
                                    rules={[
                                      { required: true, message: 'Vui lòng nhập số lượng' },
                                      {
                                        validator: (_, value) => {
                                          if (value < 0) {
                                            return Promise.reject('Số lượng phải lớn hơn hoặc bằng 0');
                                          }
                                          return Promise.resolve();
                                        },
                                      },
                                    ]}
                                    style={{ marginBottom: 0 }}
                                  >
                                    <InputNumber
                                      placeholder="Số lượng hiện tại"
                                      min={0}
                                      style={{ width: '100%' }}
                                    />
                                  </Form.Item>
                                ) : (
                                  <Typography.Text>
                                    {item.current_quantity?.toLocaleString() || 0}
                                  </Typography.Text>
                                )}
                              </Col>
                              <Col span={12}>
                                <Typography.Text strong>Giá nhập:</Typography.Text>
                                <br />
                                {isEditingDetail ? (
                                  <Form.Item
                                    name={[index, 'import_price']}
                                    rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
                                    style={{ marginBottom: 0 }}
                                  >
                                    <InputNumber
                                      placeholder="Giá nhập"
                                      min={0}
                                      style={{ width: '100%' }}
                                      formatter={(value) =>
                                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                      }
                                      parser={(value) => value?.replace(/\$\s?|(,*)/g, '')}
                                      addonAfter="đ"
                                    />
                                  </Form.Item>
                                ) : (
                                  <Typography.Text>
                                    {(item.import_price || 0).toLocaleString()}đ
                                  </Typography.Text>
                                )}
                              </Col>
                              <Col span={12}>
                                <Typography.Text strong>Thành tiền:</Typography.Text>
                                <br />
                                <Typography.Text strong style={{ color: '#1890ff' }}>
                                  {((item.current_quantity || 0) * (item.import_price || 0)).toLocaleString()}đ
                                </Typography.Text>
                              </Col>
                              <Col span={12}>
                                <Typography.Text strong>Ngày sản xuất:</Typography.Text>
                                <br />
                                {isEditingDetail ? (
                                  <Form.Item
                                    name={[index, 'manufacture_date']}
                                    rules={[
                                      {
                                        required: true,
                                        message: 'Vui lòng chọn ngày sản xuất',
                                      },
                                      () => ({
                                        validator(_, value) {
                                          if (!value) {
                                            return Promise.resolve();
                                          }
                                          const today = dayjs().startOf('day');
                                          if (value.isAfter(today, 'day')) {
                                            return Promise.reject(
                                              new Error('NSX không được ở tương lai')
                                            );
                                          }
                                          return Promise.resolve();
                                        },
                                      }),
                                    ]}
                                    style={{ marginBottom: 0 }}
                                  >
                                    <DatePicker
                                      placeholder="Chọn ngày"
                                      format="DD/MM/YYYY"
                                      style={{ width: '100%' }}
                                      disabledDate={(current) => {
                                        return current && current > dayjs().endOf('day');
                                      }}
                                    />
                                  </Form.Item>
                                ) : (
                                  <Typography.Text>
                                    {item.manufacture_date
                                      ? dayjs(item.manufacture_date).format('DD/MM/YYYY')
                                      : '-'}
                                  </Typography.Text>
                                )}
                              </Col>
                              <Col span={12}>
                                <Typography.Text strong>Hạn sử dụng:</Typography.Text>
                                <br />
                                {isEditingDetail ? (
                                  <Form.Item
                                    name={[index, 'expiry_date']}
                                    rules={[
                                      {
                                        required: true,
                                        message: 'Vui lòng chọn hạn sử dụng',
                                      },
                                      () => ({
                                        validator(_, value) {
                                          if (!value) {
                                            return Promise.resolve();
                                          }
                                          const today = dayjs().startOf('day');
                                          if (value.isBefore(today, 'day')) {
                                            return Promise.reject(
                                              new Error('Hạn SD không được ở quá khứ')
                                            );
                                          }
                                          return Promise.resolve();
                                        },
                                      }),
                                      ({ getFieldValue }) => ({
                                        validator(_, value) {
                                          const items = getFieldValue('items');
                                          const manufactureDate = items?.[index]?.manufacture_date;
                                          if (!value || !manufactureDate) {
                                            return Promise.resolve();
                                          }
                                          const diffInDays = value.diff(manufactureDate, 'days');
                                          if (diffInDays < 1) {
                                            return Promise.reject(
                                              new Error('Hạn SD phải sau NSX ít nhất 1 ngày')
                                            );
                                          }
                                          return Promise.resolve();
                                        },
                                      }),
                                    ]}
                                    style={{ marginBottom: 0 }}
                                  >
                                    <DatePicker
                                      placeholder="Chọn ngày"
                                      format="DD/MM/YYYY"
                                      style={{ width: '100%' }}
                                      disabledDate={(current) => {
                                        return current && current < dayjs().startOf('day');
                                      }}
                                    />
                                  </Form.Item>
                                ) : (
                                  <Typography.Text>
                                    {item.expiry_date
                                      ? dayjs(item.expiry_date).format('DD/MM/YYYY')
                                      : '-'}
                                  </Typography.Text>
                                )}
                              </Col>
                              <Col span={24}>
                                <Typography.Text strong>Nhà cung cấp:</Typography.Text>
                                <br />
                                {isEditingDetail ? (
                                  <Form.Item
                                    name={[index, 'supplier_name']}
                                    style={{ marginBottom: 0 }}
                                  >
                                    <Input placeholder="Nhập tên nhà cung cấp" />
                                  </Form.Item>
                                ) : (
                                  <Typography.Text>
                                    {item.supplier_name || '-'}
                                  </Typography.Text>
                                )}
                              </Col>

                              {/* Rescue Pricing Section */}
                              <Col span={24}>
                                <Divider style={{ margin: '12px 0' }}>
                                  <ThunderboltOutlined /> giảm giá tự động
                                </Divider>
                              </Col>

                              <Col span={12}>
                                <Typography.Text strong>Trạng thái giảm giá:</Typography.Text>
                                <br />
                                <Space>
                                  <Switch
                                    checked={item.rescue_pricing_enabled !== false}
                                    onChange={(checked) =>
                                      handleToggleRescuePricing(viewingBatch._id, item._id, checked)
                                    }
                                    checkedChildren="BẬT"
                                    unCheckedChildren="TẮT"
                                    disabled={item.status === 'sold' || item.status === 'rejected'}
                                  />
                                  <Typography.Text type="secondary">
                                    {item.rescue_pricing_enabled === false ?
                                      'Đã tắt (tránh xung đột)' :
                                      'Đang bật'
                                    }
                                  </Typography.Text>
                                </Space>
                              </Col>

                              <Col span={12}>
                                <Typography.Text strong>Giảm giá hiện tại:</Typography.Text>
                                <br />
                                {item.rescue_pricing_active && item.rescue_discount_percentage > 0 ? (
                                  <Tag color="red" style={{ fontSize: 16 }}>
                                    -{item.rescue_discount_percentage}% (Tự động)
                                  </Tag>
                                ) : item.manual_discount_percentage > 0 ? (
                                  <Tag color="orange" style={{ fontSize: 16 }}>
                                    -{item.manual_discount_percentage}% (Thủ công)
                                  </Tag>
                                ) : (
                                  <Typography.Text type="secondary">Chưa áp dụng</Typography.Text>
                                )}
                              </Col>

                              {/* Manual Discount Input - Only shown when auto-pricing is disabled */}
                              {item.rescue_pricing_enabled === false && (
                                <Col span={12}>
                                  <Typography.Text strong>Giảm giá thủ công:</Typography.Text>
                                  <br />
                                  <Space>
                                    <InputNumber
                                      min={0}
                                      max={100}
                                      step={5}
                                      value={item.manual_discount_percentage || 0}
                                      onChange={(value) =>
                                        handleSetManualDiscount(viewingBatch._id, item._id, value || 0)
                                      }
                                      disabled={item.status === 'sold' || item.status === 'rejected'}
                                      addonAfter="%"
                                      style={{ width: 120 }}
                                    />
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                      (0-100%)
                                    </Typography.Text>
                                  </Space>
                                </Col>
                              )}

                              <Col span={12}>
                                <Typography.Text strong>Thời gian còn lại:</Typography.Text>
                                <br />
                                {(() => {
                                  const days = calculateDaysUntilExpiry(item.expiry_date);
                                  if (days === null) return <Typography.Text>-</Typography.Text>;
                                  if (days < 0) return <Tag color="red">Đã hết hạn</Tag>;
                                  if (days <= 3) return <Tag color="red">{days} ngày</Tag>;
                                  if (days <= 7) return <Tag color="orange">{days} ngày</Tag>;
                                  if (days <= 30) return <Tag color="gold">{days} ngày</Tag>;
                                  return <Tag color="green">{days} ngày</Tag>;
                                })()}
                              </Col>

                              <Col span={12}>
                                <Typography.Text strong>Thao tác:</Typography.Text>
                                <br />
                                <Button
                                  type="primary"
                                  icon={<PrinterOutlined />}
                                  size="small"
                                  onClick={() =>
                                    handlePrintLabel(viewingBatch._id, item._id, item.product_id?.name)
                                  }
                                  disabled={item.status === 'sold' || item.status === 'rejected'}
                                >
                                  In nhãn giá
                                </Button>
                              </Col>

                              {item.rescue_pricing_active && item.rescue_notification_date && (
                                <Col span={24}>
                                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                    <ThunderboltOutlined /> Thông báo đã gửi: {dayjs(item.rescue_notification_date).format('DD/MM/YYYY HH:mm')}
                                  </Typography.Text>
                                </Col>
                              )}
                            </Row>
                          </div>
                        </Card>
                      ))}
                    </Space>
                  )}
                </Form.List>
              </Form>
            </Card>

            {/* Summary */}
            <Card title="Tổng kết" size="small">
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Typography.Text strong>Tổng số loại sản phẩm:</Typography.Text>
                  <br />
                  <Typography.Text style={{ fontSize: 16 }}>
                    {viewingBatch.items?.length || 0}
                  </Typography.Text>
                </Col>
                <Col span={12}>
                  <Typography.Text strong>Tổng giá trị nhập:</Typography.Text>
                  <br />
                  <Typography.Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                    {viewingBatch.items
                      ?.reduce(
                        (sum, item) =>
                          sum + (item.current_quantity || 0) * (item.import_price || 0),
                        0
                      )
                      .toLocaleString()}đ
                  </Typography.Text>
                </Col>
              </Row>
            </Card>
          </Space>
        )}
      </Drawer>

      {/* Reject Batch Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            <span>Từ chối lô hàng</span>
          </Space>
        }
        open={rejectModalVisible}
        onOk={handleConfirmReject}
        onCancel={handleCloseRejectModal}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true, loading: loading }}
      >
        <p>Bạn có chắc chắn muốn từ chối lô hàng này? Hành động này sẽ:</p>
        <ul>
          <li>Đánh dấu lô hàng là đã từ chối</li>
          <li>Trừ số lượng tồn kho của các sản phẩm trong lô</li>
          <li>Ghi nhận vào nhật ký kho</li>
        </ul>
        <Input.TextArea
          placeholder="Nhập lý do từ chối (bắt buộc)"
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          style={{ marginTop: 16 }}
        />
      </Modal>

      {/* Smart Replenishment Suggestions Modal */}
      <SmartSuggestions
        visible={smartSuggestionsVisible}
        onClose={() => setSmartSuggestionsVisible(false)}
      />
    </div>
  );
};

export default ProductBatches;
