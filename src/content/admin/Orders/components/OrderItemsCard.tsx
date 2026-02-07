import { useState } from 'react';
import {
  Card,
  CardHeader,
  Typography,
  Box,
  Avatar,
  IconButton,
  Button,
  TextField,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Stack,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import { StyledTableContainer, MobileCard } from 'src/components/StyledTable';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import SaveTwoToneIcon from '@mui/icons-material/SaveTwoTone';
import { OrderItem, Product } from 'src/models';
import { formatPrice } from 'src/utils';
import { productsService } from 'src/api';

export interface EditableItem extends OrderItem {
  isNew?: boolean;
}

interface OrderItemsCardProps {
  items: EditableItem[];
  orderTotal: string;
  onSave: (items: EditableItem[]) => Promise<void>;
}

function OrderItemsCard({ items: initialItems, orderTotal, onSave }: OrderItemsCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<EditableItem[]>(initialItems);

  // Add item dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [newItem, setNewItem] = useState({
    product_id: '',
    variant_id: '',
    quantity: 1
  });

  const handleEdit = () => {
    setItems([...initialItems]);
    setEditing(true);
  };

  const handleCancel = () => {
    setItems([...initialItems]);
    setEditing(false);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...items];
    const qty = Math.max(1, quantity);
    const price = parseFloat(newItems[index].price);
    newItems[index] = {
      ...newItems[index],
      quantity: qty,
      total: (price * qty).toFixed(2)
    };
    setItems(newItems);
  };

  const handleRemove = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(items);
    setSaving(false);
    setEditing(false);
  };

  const openAddDialog = async () => {
    setAddDialogOpen(true);
    if (products.length === 0) {
      setLoadingProducts(true);
      try {
        const response = await productsService.list({ limit: 100, is_active: true });
        setProducts(response.items);
      } catch {
        // silent
      } finally {
        setLoadingProducts(false);
      }
    }
  };

  const handleAddItem = () => {
    const product = products.find(p => p.id === newItem.product_id);
    const variant = product?.variants.find(v => v.id === newItem.variant_id);
    if (!product || !variant) return;

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
    setAddDialogOpen(false);
    setNewItem({ product_id: '', variant_id: '', quantity: 1 });
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + parseFloat(item.total), 0).toFixed(2);
  };

  const selectedProduct = products.find(p => p.id === newItem.product_id);
  const displayTotal = editing ? calculateTotal() : orderTotal;

  return (
    <>
      <Card>
        <CardHeader
          title="Товары"
          subheader={`${items.length} позиций`}
          action={
            !editing ? (
              <IconButton size="small" onClick={handleEdit}>
                <EditTwoToneIcon fontSize="small" />
              </IconButton>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button size="small" startIcon={<AddTwoToneIcon />} onClick={openAddDialog}>
                  {!isMobile && 'Добавить'}
                </Button>
                <Button size="small" onClick={handleCancel}>
                  {isMobile ? '✕' : 'Отмена'}
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                  startIcon={!isMobile ? (saving ? <CircularProgress size={16} /> : <SaveTwoToneIcon />) : undefined}
                  sx={isMobile ? { minWidth: 'auto', px: 1 } : undefined}
                >
                  {isMobile
                    ? (saving ? <CircularProgress size={18} /> : <SaveTwoToneIcon fontSize="small" />)
                    : 'Сохранить'
                  }
                </Button>
              </Stack>
            )
          }
        />

        {isMobile ? (
          /* Mobile: card-based list */
          <Box>
            {items.map((item, index) => (
              <MobileCard key={index} sx={{ cursor: 'default' }}>
                <Box display="flex" gap={1.5}>
                  <Avatar
                    variant="rounded"
                    src={item.image}
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      fontSize: '0.9rem',
                      mt: 0.25,
                      flexShrink: 0,
                    }}
                  >
                    🍃
                  </Avatar>
                  <Box flex={1} minWidth={0}>
                    {/* Row 1: name + total or delete */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1, minWidth: 0 }}>
                        {item.product_name}
                        {item.isNew && (
                          <Chip
                            size="small"
                            label="Новый"
                            color="success"
                            sx={{ height: 18, fontSize: '0.65rem', ml: 0.5, verticalAlign: 'middle' }}
                          />
                        )}
                      </Typography>
                      {editing ? (
                        <IconButton
                          size="small"
                          onClick={() => handleRemove(index)}
                          sx={{
                            width: 28,
                            height: 28,
                            flexShrink: 0,
                            backgroundColor: alpha(theme.palette.error.main, 0.1),
                            '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.2) },
                          }}
                        >
                          <DeleteTwoToneIcon sx={{ fontSize: 16 }} color="error" />
                        </IconButton>
                      ) : (
                        <Typography variant="body2" fontWeight={600} sx={{ flexShrink: 0 }}>
                          {formatPrice(item.total)}
                        </Typography>
                      )}
                    </Box>

                    {/* Row 2: details */}
                    <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.25 }}>
                      {item.variant_weight} · {formatPrice(item.price)}
                    </Typography>

                    {/* Row 3 (editing): quantity + total */}
                    {editing && (
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.75}>
                        <TextField
                          type="number"
                          size="small"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                          inputProps={{ min: 1, style: { textAlign: 'center' } }}
                          sx={{ width: 64, '& .MuiInputBase-input': { py: 0.5, px: 0.5 } }}
                        />
                        <Typography variant="body2" fontWeight={600}>
                          {formatPrice(item.total)}
                        </Typography>
                      </Box>
                    )}

                    {/* Non-editing: show quantity inline */}
                    {!editing && (
                      <Typography variant="caption" color="text.secondary" component="div">
                        Кол-во: {item.quantity}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </MobileCard>
            ))}

            {/* Total */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              sx={{ px: 2, py: 1.5 }}
            >
              <Typography variant="body1" fontWeight={600}>
                Итого
              </Typography>
              <Typography variant="body1" fontWeight={700} color="primary.main">
                {formatPrice(displayTotal)}
              </Typography>
            </Box>
          </Box>
        ) : (
          /* Desktop: table layout */
          <StyledTableContainer>
            <Table size="medium">
              <TableHead>
                <TableRow>
                  <TableCell>Товар</TableCell>
                  <TableCell>Вес</TableCell>
                  <TableCell align="center">Кол-во</TableCell>
                  <TableCell align="right">Цена</TableCell>
                  <TableCell align="right">Сумма</TableCell>
                  {editing && <TableCell align="right" />}
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index} sx={{ cursor: 'default' }}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar
                          variant="rounded"
                          src={item.image}
                          sx={{
                            width: 40,
                            height: 40,
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                          }}
                        >
                          🍃
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>
                          {item.product_name}
                          {item.isNew && (
                            <Chip
                              size="small"
                              label="Новый"
                              color="success"
                              sx={{ height: 18, fontSize: '0.65rem', ml: 0.5 }}
                            />
                          )}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {item.variant_weight}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {editing ? (
                        <TextField
                          type="number"
                          size="small"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                          inputProps={{ min: 1, style: { textAlign: 'center' } }}
                          sx={{ width: 64, '& .MuiInputBase-input': { py: 0.5, px: 0.5 } }}
                        />
                      ) : (
                        <Typography variant="body2">{item.quantity}</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        {formatPrice(item.price)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {formatPrice(item.total)}
                      </Typography>
                    </TableCell>
                    {editing && (
                      <TableCell align="right" sx={{ width: 48 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleRemove(index)}
                          sx={{
                            backgroundColor: alpha(theme.palette.error.main, 0.1),
                            '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.2) },
                          }}
                        >
                          <DeleteTwoToneIcon fontSize="small" color="error" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}

                {/* Total row */}
                <TableRow sx={{ '& .MuiTableCell-root': { borderBottom: 'none' } }}>
                  <TableCell colSpan={3}>
                    <Typography variant="body1" fontWeight={600}>
                      Итого
                    </Typography>
                  </TableCell>
                  <TableCell />
                  <TableCell align="right">
                    <Typography variant="body1" fontWeight={700} color="primary.main">
                      {formatPrice(displayTotal)}
                    </Typography>
                  </TableCell>
                  {editing && <TableCell />}
                </TableRow>
              </TableBody>
            </Table>
          </StyledTableContainer>
        )}
      </Card>

      {/* Add item dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            Добавить товар
          </Typography>
        </DialogTitle>
        <DialogContent>
          {loadingProducts ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
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
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar src={product.image} sx={{ width: 24, height: 24 }}>🍃</Avatar>
                          {product.name}
                        </Box>
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
                            {variant.weight} — {formatPrice(variant.price)}
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddDialogOpen(false)}>
            Отмена
          </Button>
          <Button
            onClick={handleAddItem}
            variant="contained"
            disabled={!newItem.product_id || !newItem.variant_id}
          >
            Добавить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default OrderItemsCard;
