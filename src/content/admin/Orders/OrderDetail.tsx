import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Container,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useTheme,
  useMediaQuery,
  Stack
} from '@mui/material';
import ArrowBackTwoToneIcon from '@mui/icons-material/ArrowBackTwoTone';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import SaveTwoToneIcon from '@mui/icons-material/SaveTwoTone';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import Label from 'src/components/Label';
import { ordersService, productsService } from 'src/api';
import { Order, OrderStatus, OrderItem, OrderUpdate, DeliveryMethod, Product } from 'src/models';

const statusOptions: { value: OrderStatus; label: string; color: 'error' | 'success' | 'warning' | 'info' | 'primary' }[] = [
  { value: 'created', label: 'Создан', color: 'info' },
  { value: 'processing', label: 'В обработке', color: 'warning' },
  { value: 'paid', label: 'Оплачен', color: 'primary' },
  { value: 'fulfilled', label: 'Выполнен', color: 'success' },
  { value: 'cancelled', label: 'Отменён', color: 'error' }
];

const deliveryOptions: { value: DeliveryMethod; label: string }[] = [
  { value: 'pickup', label: 'Самовывоз' },
  { value: 'courier', label: 'Курьер' },
  { value: 'cdek', label: 'СДЭК' }
];

const deliveryLabels: Record<string, string> = {
  pickup: 'Самовывоз',
  courier: 'Курьер',
  cdek: 'СДЭК'
};

interface EditableItem extends OrderItem {
  isNew?: boolean;
}

function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<OrderUpdate>({});

  // Items editing
  const [editingItems, setEditingItems] = useState(false);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [savingItems, setSavingItems] = useState(false);

  // Add item dialog
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [newItem, setNewItem] = useState({
    product_id: '',
    variant_id: '',
    quantity: 1
  });

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        const data = await ordersService.get(orderId);
        setOrder(data);
        setFormData({
          customer_name: data.customer_name,
          phone: data.phone,
          delivery: data.delivery,
          address: data.address || '',
          comment: data.comment || ''
        });
        setItems(data.items.map(item => ({ ...item, isNew: false })));
      } catch (err) {
        setError('Ошибка загрузки заказа');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!orderId || !order) return;
    setUpdatingStatus(true);
    setError('');
    try {
      const updatedOrder = await ordersService.updateStatus(orderId, { status: newStatus });
      setOrder(updatedOrder);
      setSuccess('Статус обновлён');
    } catch (err) {
      setError('Ошибка обновления статуса');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveOrder = async () => {
    if (!orderId) return;
    setSaving(true);
    setError('');
    try {
      const updatedOrder = await ordersService.update(orderId, formData);
      setOrder(updatedOrder);
      setEditing(false);
      setSuccess('Заказ сохранён');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  // Items operations
  const handleEditItems = () => {
    setEditingItems(true);
  };

  const handleCancelEditItems = () => {
    if (order) {
      setItems(order.items.map(item => ({ ...item, isNew: false })));
    }
    setEditingItems(false);
  };

  const handleItemQuantityChange = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], quantity: Math.max(1, quantity) };
    // Recalculate total
    const price = parseFloat(newItems[index].price);
    newItems[index].total = (price * newItems[index].quantity).toFixed(2);
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveItems = async () => {
    if (!orderId) return;
    setSavingItems(true);
    setError('');
    try {
      const itemsToSave = items.map(item => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: item.price
      }));
      const updatedOrder = await ordersService.updateItems(orderId, itemsToSave);
      setOrder(updatedOrder);
      setItems(updatedOrder.items.map(item => ({ ...item, isNew: false })));
      setEditingItems(false);
      setSuccess('Состав заказа обновлён');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения состава заказа');
    } finally {
      setSavingItems(false);
    }
  };

  // Add item dialog
  const openAddItemDialog = async () => {
    setAddItemDialogOpen(true);
    if (products.length === 0) {
      setLoadingProducts(true);
      try {
        const response = await productsService.list({ limit: 100, is_active: true });
        setProducts(response.items);
      } catch {
        setError('Ошибка загрузки продуктов');
      } finally {
        setLoadingProducts(false);
      }
    }
  };

  const handleAddItem = () => {
    const product = products.find(p => p.id === newItem.product_id);
    const variant = product?.variants.find(v => v.id === newItem.variant_id);

    if (!product || !variant) {
      setError('Выберите продукт и вариант');
      return;
    }

    const price = parseFloat(variant.price);
    const newOrderItem: EditableItem = {
      product_id: product.id,
      variant_id: variant.id,
      quantity: newItem.quantity,
      price: variant.price,
      total: (price * newItem.quantity).toFixed(2),
      product_name: product.name,
      variant_weight: variant.weight,
      image: product.image || '',
      isNew: true
    };

    setItems([...items, newOrderItem]);
    setAddItemDialogOpen(false);
    setNewItem({ product_id: '', variant_id: '', quantity: 1 });
  };

  const selectedProduct = products.find(p => p.id === newItem.product_id);

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + parseFloat(item.total), 0).toFixed(2);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !order) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Заказ не найден'}</Alert>
      </Container>
    );
  }

  if (!order) {
    return null;
  }

  const currentStatus = statusOptions.find(s => s.value === order.status);

  return (
    <>
      <Helmet>
        <title>{`Заказ #${order.id.slice(-8).toUpperCase()} - Leaf Flow Admin`}</title>
      </Helmet>
      <PageTitleWrapper>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackTwoToneIcon />}
            onClick={() => navigate('/admin/orders')}
          >
            Назад
          </Button>
          <Box>
            <Typography variant="h3" component="h3">
              Заказ #{order.id.slice(-8).toUpperCase()}
            </Typography>
            <Typography variant="subtitle2">
              {order.created_at && format(new Date(order.created_at), "dd MMMM yyyy 'в' HH:mm", { locale: ru })}
            </Typography>
          </Box>
        </Box>
      </PageTitleWrapper>
      <Container maxWidth="lg">
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3} direction={isMobile ? 'column-reverse' : 'row'}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader
                title="Товары"
                action={
                  !editingItems ? (
                    <Button
                      size="small"
                      startIcon={<EditTwoToneIcon />}
                      onClick={handleEditItems}
                    >
                      Редактировать
                    </Button>
                  ) : (
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        startIcon={<AddTwoToneIcon />}
                        onClick={openAddItemDialog}
                      >
                        Добавить
                      </Button>
                      <Button size="small" onClick={handleCancelEditItems}>
                        Отмена
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={savingItems ? <CircularProgress size={16} /> : <SaveTwoToneIcon />}
                        onClick={handleSaveItems}
                        disabled={savingItems}
                      >
                        Сохранить
                      </Button>
                    </Box>
                  )
                }
              />
              <Divider />
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Товар</TableCell>
                    <TableCell align="center">Кол-во</TableCell>
                    <TableCell align="right">Цена</TableCell>
                    <TableCell align="right">Сумма</TableCell>
                    {editingItems && <TableCell align="right"></TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar variant="rounded" src={item.image} sx={{ width: 48, height: 48 }}>
                            🍃
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              {item.product_name}
                              {item.isNew && (
                                <Chip size="small" label="Новый" color="success" sx={{ ml: 1 }} />
                              )}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.variant_weight}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        {editingItems ? (
                          <TextField
                            type="number"
                            size="small"
                            value={item.quantity}
                            onChange={(e) => handleItemQuantityChange(index, parseInt(e.target.value) || 1)}
                            inputProps={{ min: 1, style: { textAlign: 'center', width: 60 } }}
                          />
                        ) : (
                          item.quantity
                        )}
                      </TableCell>
                      <TableCell align="right">{item.price} ₽</TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">{item.total} ₽</Typography>
                      </TableCell>
                      {editingItems && (
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <DeleteTwoToneIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={editingItems ? 4 : 3} align="right">
                      <Typography variant="h6">Итого:</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" color="primary">
                        {editingItems ? calculateTotal() : order.total} ₽
                      </Typography>
                    </TableCell>
                    {editingItems && <TableCell />}
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardHeader title="Статус заказа" />
              <Divider />
              <CardContent>
                <Box mb={2}>
                  <Label color={currentStatus?.color || 'info'}>
                    {currentStatus?.label || order.status}
                  </Label>
                </Box>
                <FormControl fullWidth size="small">
                  <InputLabel>Изменить статус</InputLabel>
                  <Select
                    value={order.status}
                    label="Изменить статус"
                    onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                    disabled={updatingStatus}
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardHeader
                title="Клиент"
                action={
                  !editing ? (
                    <IconButton size="small" onClick={() => setEditing(true)}>
                      <EditTwoToneIcon fontSize="small" />
                    </IconButton>
                  ) : null
                }
              />
              <Divider />
              <CardContent>
                {editing ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Имя клиента"
                        value={formData.customer_name || ''}
                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Телефон"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                ) : (
                  <>
                    <Typography variant="body1" fontWeight="bold" gutterBottom>
                      {order.customer_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {order.phone}
                    </Typography>
                    {order.user_id && (
                      <Chip
                        size="small"
                        label={`ID: ${order.user_id}`}
                        onClick={() => navigate(`/admin/users/${order.user_id}`)}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardHeader title="Доставка" />
              <Divider />
              <CardContent>
                {editing ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Способ доставки</InputLabel>
                        <Select
                          value={formData.delivery || order.delivery}
                          label="Способ доставки"
                          onChange={(e) => setFormData({ ...formData, delivery: e.target.value as DeliveryMethod })}
                        >
                          {deliveryOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Адрес"
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Комментарий"
                        value={formData.comment || ''}
                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box display="flex" gap={1} justifyContent="flex-end">
                        <Button size="small" onClick={() => setEditing(false)}>
                          Отмена
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={handleSaveOrder}
                          disabled={saving}
                          startIcon={saving ? <CircularProgress size={16} /> : <SaveTwoToneIcon />}
                        >
                          Сохранить
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                ) : (
                  <>
                    <Typography variant="body1" fontWeight="bold" gutterBottom>
                      {deliveryLabels[order.delivery] || order.delivery}
                    </Typography>
                    {order.address && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {order.address}
                      </Typography>
                    )}
                    {order.comment && (
                      <Box mt={2}>
                        <Typography variant="body2" color="text.secondary">
                          Комментарий:
                        </Typography>
                        <Typography variant="body2">{order.comment}</Typography>
                      </Box>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Add Item Dialog */}
        <Dialog open={addItemDialogOpen} onClose={() => setAddItemDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Добавить товар</DialogTitle>
          <DialogContent>
            {loadingProducts ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Продукт</InputLabel>
                    <Select
                      value={newItem.product_id}
                      label="Продукт"
                      onChange={(e) => setNewItem({ ...newItem, product_id: e.target.value, variant_id: '' })}
                    >
                      {products.map((product) => (
                        <MenuItem key={product.id} value={product.id}>
                          {product.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {selectedProduct && (
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Вариант</InputLabel>
                      <Select
                        value={newItem.variant_id}
                        label="Вариант"
                        onChange={(e) => setNewItem({ ...newItem, variant_id: e.target.value })}
                      >
                        {selectedProduct.variants
                          .filter(v => v.is_active)
                          .map((variant) => (
                            <MenuItem key={variant.id} value={variant.id}>
                              {variant.weight} - {variant.price} ₽
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Количество"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddItemDialogOpen(false)}>Отмена</Button>
            <Button
              onClick={handleAddItem}
              variant="contained"
              disabled={!newItem.product_id || !newItem.variant_id}
            >
              Добавить
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}

export default OrderDetail;
