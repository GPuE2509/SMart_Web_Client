import { useState, useEffect, useRef } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Input,
  Drawer,
  Modal,
  Form,
  Select,
  message,
  Popconfirm,
  Tag,
  Typography,
  InputNumber,
  Upload,
  Row,
  Col,
  Tooltip,
  Divider,
  Avatar,
  Empty,
  Spin,
  List,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  SearchOutlined,
  StopOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  BookOutlined,
  EyeOutlined,
  UnorderedListOutlined,
  ReadOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  toggleRecipeStatus,
} from '../../services/recipeService';
import productService from '../../services/productService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Parse instruction string into step array
const parseSteps = (instruction) => {
  if (!instruction) return [];
  return instruction
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
};

const Recipes = () => {
  // Data
  const [recipes, setRecipes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const searchDebounce = useRef(null);

  // Pagination
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // View modal
  const [viewModal, setViewModal] = useState(false);
  const [viewingRecipe, setViewingRecipe] = useState(null);
  const [loadingView, setLoadingView] = useState(false);

  // Add / Edit drawer
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [imageFileList, setImageFileList] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // ── Initial load ──────────────────────────────────────────────
  useEffect(() => {
    fetchProducts();
    fetchRecipes();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProducts = async () => {
    try {
      const res = await productService.getAll({ limit: 1000, is_active: true });
      setProducts(res.data || []);
    } catch {
      // silent
    }
  };

  const fetchRecipes = async (params = {}) => {
    setLoading(true);
    try {
      const query = {
        page: params.page ?? pagination.current,
        limit: params.limit ?? pagination.pageSize,
        sort_by: params.sort_by ?? sortBy,
      };
      if (params.search !== undefined ? params.search : searchText)
        query.search = params.search !== undefined ? params.search : searchText;

      const res = await getAllRecipes(query);
      if (res.success) {
        setRecipes(res.data || []);
        setPagination((prev) => ({
          ...prev,
          current: res.pagination?.page ?? prev.current,
          pageSize: res.pagination?.limit ?? prev.pageSize,
          total: res.pagination?.total ?? 0,
        }));
      }
    } catch {
      message.error('Không thể tải danh sách công thức');
    } finally {
      setLoading(false);
    }
  };

  // ── Filter helpers ────────────────────────────────────────────
  const displayedRecipes =
    statusFilter === 'all'
      ? recipes
      : recipes.filter((r) =>
          statusFilter === 'active' ? r.is_active : !r.is_active
        );

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchText(val);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      fetchRecipes({ page: 1, search: val, sort_by: sortBy });
    }, 350);
  };

  const handleSortChange = (val) => {
    setSortBy(val);
    fetchRecipes({ page: 1, sort_by: val });
  };

  const handleTableChange = (pg) => {
    fetchRecipes({ page: pg.current, limit: pg.pageSize });
  };

  // ── View recipe ───────────────────────────────────────────────
  const handleView = async (record) => {
    setViewModal(true);
    setLoadingView(true);
    try {
      const res = await getRecipeById(record._id);
      if (res.success) setViewingRecipe(res.data);
    } catch {
      message.error('Không thể tải chi tiết công thức');
      setViewModal(false);
    } finally {
      setLoadingView(false);
    }
  };

  // ── Add / Edit drawer ─────────────────────────────────────────
  const handleOpenDrawer = async (recipe = null) => {
    setEditingRecipe(recipe);
    setIngredients([]);
    setImageFileList([]);

    if (recipe) {
      try {
        setLoading(true);
        const res = await getRecipeById(recipe._id);
        if (res.success) {
          const r = res.data;
          if (r.image_url)
            setImageFileList([{ uid: '-1', name: 'image', status: 'done', url: r.image_url }]);
          setIngredients(
            r.ingredients?.map((ing) => ({
              product_id: ing.product?._id,
              quantity_needed: ing.quantity_needed,
              unit_note: ing.unit_note || '',
            })) || []
          );
          form.setFieldsValue({
            title: r.title,
            description: r.description,
            instruction: r.instruction,
            image_url: r.image_url,
          });
        }
      } catch {
        message.error('Không thể tải thông tin công thức');
        return;
      } finally {
        setLoading(false);
      }
    } else {
      form.resetFields();
    }
    setDrawerVisible(true);
  };

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setEditingRecipe(null);
    setImageFileList([]);
    setIngredients([]);
    form.resetFields();
  };

  // Image helpers
  const getBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  const beforeUpload = (file) => {
    if (!file.type.startsWith('image/')) {
      message.error('Chỉ được upload file hình ảnh!');
      return Upload.LIST_IGNORE;
    }
    if (file.size / 1024 / 1024 > 10) {
      message.error('Ảnh phải nhỏ hơn 10MB!');
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const handleImageChange = async ({ fileList }) => {
    setImageFileList(fileList);
    if (fileList.length > 0 && fileList[0].originFileObj) {
      const b64 = await getBase64(fileList[0].originFileObj);
      form.setFieldsValue({ image_url: b64 });
    } else if (fileList.length === 0) {
      form.setFieldsValue({ image_url: '' });
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      let imageUrl = values.image_url;
      if (imageFileList[0]?.originFileObj) imageUrl = await getBase64(imageFileList[0].originFileObj);
      else if (imageFileList[0]?.url) imageUrl = imageFileList[0].url;

      const payload = {
        title: values.title,
        description: values.description || '',
        instruction: values.instruction || '',
        image_url: imageUrl || '',
        ingredients: ingredients
          .filter((i) => i.product_id)
          .map((i) => ({
            product_id: i.product_id,
            quantity_needed: i.quantity_needed || 1,
            unit_note: i.unit_note || '',
          })),
      };

      if (editingRecipe) {
        await updateRecipe(editingRecipe._id, payload);
        message.success('Cập nhật công thức thành công!');
      } else {
        await createRecipe(payload);
        message.success('Tạo công thức thành công!');
      }
      handleCloseDrawer();
      fetchRecipes({ page: 1 });
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  // Toggle status
  const handleToggle = async (id, current) => {
    setLoading(true);
    try {
      await toggleRecipeStatus(id);
      message.success(`Đã ${current ? 'tắt' : 'bật'} công thức`);
      fetchRecipes();
    } catch {
      message.error('Không thể cập nhật trạng thái');
    } finally {
      setLoading(false);
    }
  };

  // Ingredient handlers
  const addIngredient = () =>
    setIngredients([...ingredients, { product_id: '', quantity_needed: 1, unit_note: '' }]);
  const updateIngredient = (idx, field, val) => {
    const list = [...ingredients];
    list[idx][field] = val;
    setIngredients(list);
  };
  const removeIngredient = (idx) => setIngredients(ingredients.filter((_, i) => i !== idx));

  // ── Table columns ─────────────────────────────────────────────
  const columns = [
    {
      title: '#',
      key: 'index',
      width: 48,
      render: (_, __, i) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {(pagination.current - 1) * pagination.pageSize + i + 1}
        </Text>
      ),
    },
    {
      title: 'Công thức',
      key: 'recipe',
      render: (_, r) => (
        <Space size={12}>
          <Avatar
            shape="square"
            size={58}
            src={r.image_url}
            icon={!r.image_url && <BookOutlined />}
            style={{ borderRadius: 8, background: '#e6f4ff', color: '#1677ff', flexShrink: 0 }}
          />
          <div>
            <Text
              strong
              style={{ fontSize: 14, display: 'block', cursor: 'pointer', color: '#1677ff' }}
              onClick={() => handleView(r)}
            >
              {r.title}
            </Text>
            {r.description && (
              <Text
                type="secondary"
                style={{ fontSize: 12, display: 'block' }}
                ellipsis={{ tooltip: r.description }}
              >
                {r.description.length > 60 ? r.description.slice(0, 60) + '...' : r.description}
              </Text>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Nguyên liệu',
      dataIndex: 'ingredient_count',
      key: 'ingredient_count',
      width: 120,
      align: 'center',
      render: (c) => (
        <Tag color="blue" style={{ borderRadius: 10 }}>
          {c || 0} món
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 130,
      align: 'center',
      filters: [
        { text: 'Hoạt động', value: true },
        { text: 'Ngừng', value: false },
      ],
      onFilter: (val, record) => record.is_active === val,
      render: (active) => (
        <Tag
          color={active ? 'success' : 'error'}
          icon={active ? <CheckCircleOutlined /> : <StopOutlined />}
          style={{ borderRadius: 10 }}
        >
          {active ? 'Hoạt động' : 'Ngừng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 110,
      align: 'center',
      render: (_, r) => (
        <Space size={2}>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              style={{ color: '#1677ff' }}
              onClick={() => handleView(r)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              style={{ color: '#fa8c16' }}
              onClick={() => handleOpenDrawer(r)}
            />
          </Tooltip>
          <Popconfirm
            title={r.is_active ? 'Tắt công thức?' : 'Bật công thức?'}
            description={
              r.is_active ? 'Công thức sẽ bị ẩn khỏi hiển thị.' : 'Công thức sẽ được hiển thị lại.'
            }
            onConfirm={() => handleToggle(r._id, r.is_active)}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Tooltip title={r.is_active ? 'Tắt' : 'Bật'}>
              <Button
                type="text"
                size="small"
                icon={r.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
                danger={r.is_active}
                style={!r.is_active ? { color: '#52c41a' } : undefined}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ── View Modal ─────────────────────────────────────────────────
  const steps = parseSteps(viewingRecipe?.instruction);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3} style={{ margin: 0 }}>
              Quản lý công thức
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenDrawer()}
            >
              Thêm công thức
            </Button>
          </div>

          <Space size="middle" style={{ width: '100%', flexWrap: 'wrap' }}>
            <Input
              placeholder="Tìm theo tên hoặc mô tả..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={handleSearchChange}
              allowClear
              onClear={() => fetchRecipes({ page: 1, search: '' })}
              style={{ width: 320 }}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              options={[
                { label: 'Tất cả trạng thái', value: 'all' },
                { label: 'Hoạt động', value: 'active' },
                { label: 'Ngừng', value: 'inactive' },
              ]}
            />
            <Select
              value={sortBy}
              onChange={handleSortChange}
              style={{ width: 145 }}
              options={[
                { label: 'Mới nhất', value: 'newest' },
                { label: 'Cũ nhất', value: 'oldest' },
                { label: 'Theo tên A–Z', value: 'title' },
              ]}
            />
          </Space>

          <Table
          columns={columns}
          dataSource={displayedRecipes}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: statusFilter === 'all' ? pagination.total : displayedRecipes.length,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Tổng ${total} công thức`,
          }}
          onChange={handleTableChange}
          rowClassName={(r) => (!r.is_active ? 'recipe-row-disabled' : '')}
        />
        </Space>
      </Card>

      {/* ── View Recipe Modal ── */}
      <Modal
        open={viewModal}
        onCancel={() => { setViewModal(false); setViewingRecipe(null); }}
        footer={
          viewingRecipe && (
            <Space>
              <Button onClick={() => { setViewModal(false); handleOpenDrawer(viewingRecipe); }}>
                <EditOutlined /> Chỉnh sửa
              </Button>
              <Button type="primary" onClick={() => { setViewModal(false); setViewingRecipe(null); }}>
                Đóng
              </Button>
            </Space>
          )
        }
        width={780}
        title={null}
        styles={{ body: { padding: 0 } }}
        destroyOnHidden
      >
        <Spin spinning={loadingView}>
          {viewingRecipe ? (
            <div>
              {/* Hero image */}
              <div
                style={{
                  width: '100%',
                  height: 260,
                  background: '#f5f5f5',
                  borderRadius: '8px 8px 0 0',
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {viewingRecipe.image_url ? (
                  <img
                    src={viewingRecipe.image_url}
                    alt={viewingRecipe.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: '#bfbfbf' }}>
                    <PictureOutlined style={{ fontSize: 64 }} />
                    <div style={{ marginTop: 8 }}>Chưa có hình ảnh</div>
                  </div>
                )}
                {/* Status badge overlay */}
                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                  <Tag
                    color={viewingRecipe.is_active ? 'success' : 'error'}
                    style={{ fontSize: 13, padding: '2px 10px', borderRadius: 20 }}
                  >
                    {viewingRecipe.is_active ? 'Hoạt động' : 'Ngừng'}
                  </Tag>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '24px 28px 20px' }}>
                {/* Title + meta */}
                <div style={{ marginBottom: 16 }}>
                  <Title level={3} style={{ margin: '0 0 8px' }}>
                    {viewingRecipe.title}
                  </Title>
                  <Space size={8}>
                    <Tag color="blue" icon={<UnorderedListOutlined />} style={{ borderRadius: 10 }}>
                      {viewingRecipe.ingredients?.length || 0} nguyên liệu
                    </Tag>
                  </Space>
                </div>

                {/* Description */}
                {viewingRecipe.description && (
                  <>
                    <Divider style={{ margin: '14px 0' }} />
                    <Paragraph
                      italic
                      type="secondary"
                      style={{ fontSize: 14, lineHeight: '22px', margin: 0 }}
                    >
                      {viewingRecipe.description}
                    </Paragraph>
                  </>
                )}

                {/* Ingredients */}
                {viewingRecipe.ingredients?.length > 0 && (
                  <>
                    <Divider orientation="left" style={{ margin: '16px 0 12px' }}>
                      <Space size={6}>
                        <UnorderedListOutlined style={{ color: '#1677ff' }} />
                        <Text strong>Nguyên liệu</Text>
                      </Space>
                    </Divider>
                    <Row gutter={[8, 8]}>
                      {viewingRecipe.ingredients.map((ing, i) => (
                        <Col span={12} key={i}>
                          <div
                            style={{
                              background: '#f8f9ff',
                              border: '1px solid #e8eeff',
                              borderRadius: 8,
                              padding: '8px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                            }}
                          >
                            <Avatar
                              size={32}
                              src={ing.product?.image_url}
                              icon={!ing.product?.image_url && <BookOutlined />}
                              style={{ background: '#e6f4ff', color: '#1677ff', flexShrink: 0 }}
                            />
                            <div style={{ minWidth: 0 }}>
                              <Text strong style={{ fontSize: 13, display: 'block' }} ellipsis>
                                {ing.product?.name || 'Sản phẩm'}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {ing.quantity_needed}
                                {ing.unit_note ? ` ${ing.unit_note}` : ''}
                              </Text>
                            </div>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </>
                )}

                {/* Instructions */}
                {steps.length > 0 && (
                  <>
                    <Divider orientation="left" style={{ margin: '16px 0 12px' }}>
                      <Space size={6}>
                        <ReadOutlined style={{ color: '#52c41a' }} />
                        <Text strong>Hướng dẫn nấu</Text>
                      </Space>
                    </Divider>
                    <List
                      dataSource={steps}
                      renderItem={(step, i) => (
                        <List.Item style={{ padding: '6px 0', border: 'none' }}>
                          <Text style={{ fontSize: 14, lineHeight: '24px' }}>{step}</Text>
                        </List.Item>
                      )}
                    />
                  </>
                )}

                {!viewingRecipe.description && !viewingRecipe.instruction && (
                  <Empty description="Chưa có thông tin chi tiết" style={{ margin: '24px 0' }} />
                )}
              </div>
            </div>
          ) : (
            !loadingView && <Empty description="Không tìm thấy công thức" style={{ padding: 60 }} />
          )}
        </Spin>
      </Modal>

      {/* ── Add / Edit Drawer ── */}
      <Drawer
        title={editingRecipe ? 'Sửa công thức' : 'Thêm công thức mới'}
        open={drawerVisible}
        onClose={handleCloseDrawer}
        width={780}
        destroyOnHidden
        extra={
          <Space>
            <Button onClick={handleCloseDrawer}>Hủy</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>
              {editingRecipe ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          {/* Row 1: Title + Image */}
          <Row gutter={20}>
            <Col span={14}>
              <Form.Item
                name="title"
                label={<Text strong>Tên công thức</Text>}
                rules={[{ required: true, message: 'Vui lòng nhập tên công thức' }]}
              >
                <Input placeholder="VD: Canh chua cá lóc" maxLength={255} size="large" />
              </Form.Item>
              <Form.Item name="description" label={<Text strong>Mô tả ngắn</Text>}>
                <TextArea
                  rows={3}
                  placeholder="Mô tả ngắn gọn về món ăn..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="image_url"
                label={<Text strong>Hình ảnh</Text>}
                extra={<Text type="secondary" style={{ fontSize: 12 }}>JPG/PNG, tối đa 10MB</Text>}
              >
                <Upload
                  listType="picture-card"
                  fileList={imageFileList}
                  onChange={handleImageChange}
                  beforeUpload={beforeUpload}
                  maxCount={1}
                  accept="image/*"
                >
                  {imageFileList.length === 0 && (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8, fontSize: 12 }}>Tải ảnh lên</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          {/* Instructions */}
          <Form.Item name="instruction" label={<Text strong>Hướng dẫn từng bước</Text>}>
            <TextArea
              rows={7}
              placeholder={'Bước 1: Sơ chế nguyên liệu...\nBước 2: ...\nBước 3: ...'}
            />
          </Form.Item>

          {/* Ingredients */}
          <Divider orientation="left" orientationMargin={0}>
            <Space size={6}>
              <UnorderedListOutlined style={{ color: '#1677ff' }} />
              <Text strong>Nguyên liệu</Text>
              <Tag color="blue" style={{ borderRadius: 10, marginLeft: 2 }}>
                {ingredients.length} món
              </Tag>
            </Space>
          </Divider>

          {ingredients.length > 0 && (
            <Row gutter={8} style={{ marginBottom: 6, padding: '0 4px' }}>
              <Col span={10}><Text type="secondary" style={{ fontSize: 12 }}>Sản phẩm</Text></Col>
              <Col span={5}><Text type="secondary" style={{ fontSize: 12 }}>Số lượng</Text></Col>
              <Col span={7}><Text type="secondary" style={{ fontSize: 12 }}>Đơn vị / Ghi chú</Text></Col>
              <Col span={2} />
            </Row>
          )}

          <Space direction="vertical" style={{ width: '100%' }} size={6}>
            {ingredients.map((ing, idx) => (
              <Row
                key={idx}
                gutter={8}
                align="middle"
                style={{
                  background: '#fafcff',
                  border: '1px solid #e8eeff',
                  borderRadius: 8,
                  padding: '8px 4px',
                }}
              >
                <Col span={10}>
                  <Select
                    placeholder="Chọn sản phẩm"
                    value={ing.product_id || undefined}
                    onChange={(v) => updateIngredient(idx, 'product_id', v)}
                    showSearch
                    optionFilterProp="label"
                    style={{ width: '100%' }}
                    options={products.map((p) => ({ value: p._id, label: p.name }))}
                  />
                </Col>
                <Col span={5}>
                  <InputNumber
                    placeholder="Số lượng"
                    value={ing.quantity_needed}
                    onChange={(v) => updateIngredient(idx, 'quantity_needed', v)}
                    min={0}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={7}>
                  <Input
                    placeholder="VD: 100g, 2 muỗng..."
                    value={ing.unit_note}
                    onChange={(e) => updateIngredient(idx, 'unit_note', e.target.value)}
                  />
                </Col>
                <Col span={2} style={{ textAlign: 'center' }}>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeIngredient(idx)}
                  />
                </Col>
              </Row>
            ))}
          </Space>

          <Button
            type="dashed"
            onClick={addIngredient}
            icon={<PlusOutlined />}
            style={{ width: '100%', marginTop: 10, borderRadius: 8 }}
          >
            Thêm nguyên liệu
          </Button>
        </Form>
      </Drawer>
    </div>
  );
};

export default Recipes;
