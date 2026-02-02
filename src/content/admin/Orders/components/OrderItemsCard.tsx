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
  Stack,
  useTheme,
  useMediaQuery,
  alpha,
  styled
} from '@mui/material';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import SaveTwoToneIcon from '@mui/icons-material/SaveTwoTone';
import ShoppingCartTwoToneIcon from '@mui/icons-material/ShoppingCartTwoTone';
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

const ItemRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1.5, 2),
  borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
  transition: 'background-color 0.15s ease-in-out',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.02),
  },
  '&:last-child': {
    borderBottom: 'none',
  },
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5),
  },
}));

const TotalRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2, 2),
  backgroundColor: alpha(theme.palette.primary.main, 0.04),
  borderTop: `2px solid ${theme.palette.divider}`,
}));

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

  // Add item dialog
  const openAddDialog = async () => {
    setAddDialogOpen(true);
    if (products.length === 0) {
      setLoadingProducts(true);
      try {
        const response = await productsService.list({ limit: 100, is_active: true });
        setProducts(response.items);
      } catch {
        // Error handling
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

  return (
    <>
      <Card sx={{ overflow: 'hidden' }}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <ShoppingCartTwoToneIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Товары
              </Typography>
              <Chip
                label={items.length}
                size="small"
                color="primary"
                sx={{ ml: 1, minWidth: 28, height: 24 }}
              />
            </Box>
          }
          action={
            !editing ? (
              <Button
                size="small"
                startIcon={<EditTwoToneIcon />}
                onClick={handleEdit}
                variant="outlined"
              >
                {isMobile ? '' : 'Редактировать'}
              </Button>
            ) : (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" justifyContent="flex-end">
                <IconButton size="small" onClick={openAddDialog} color="primary">
                  <AddTwoToneIcon fontSize="small" />
                </IconButton>
                <Button 
                  size="small" 
                  onClick={handleCancel}
                  sx={{ minWidth: 'auto', px: 1 }}
                >
                  {isMobile ? '✕' : 'Отмена'}
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ minWidth: 'auto', px: isMobile ? 1.5 : 2 }}
                >
                  {saving ? <CircularProgress size={16} /> : (isMobile ? <SaveTwoToneIcon fontSize="small" /> : 'Сохранить')}
                </Button>
              </Stack>
            )
          }
        />
        
        <Box sx={{ overflowX: 'hidden' }}>
          {items.map((item, index) => (
            <ItemRow key={index}>
              {/* Product info */}
              <Box display="flex" alignItems="center" gap={1.5} flex={1} minWidth={0} width="100%">
                <Avatar 
                  variant="rounded" 
                  src={item.image} 
                  sx={{ 
                    width: isMobile ? 36 : 44, 
                    height: isMobile ? 36 : 44,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    fontSize: isMobile ? '1rem' : '1.2rem',
                    flexShrink: 0,
                  }}
                >
                  🍃
                </Avatar>
                <Box flex={1} minWidth={0}>
                  <Typography 
                    variant="body2" 
                    fontWeight={600} 
                    sx={{ 
                      wordBreak: 'break-word',
                      fontSize: isMobile ? '0.8rem' : '0.875rem',
                    }}
                  >
                    {item.product_name}
                    {item.isNew && (
                      <Chip 
                        size="small" 
                        label="Новый" 
                        color="success" 
                        sx={{ height: 16, fontSize: '0.55rem', ml: 0.5 }} 
                      />
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.variant_weight}
                  </Typography>
                </Box>
              </Box>

              {/* Quantity, Price, Actions */}
              <Box 
                display="flex" 
                alignItems="center" 
                justifyContent={isMobile ? 'space-between' : 'flex-end'}
                gap={isMobile ? 1 : 1.5}
                width={isMobile ? '100%' : 'auto'}
                pl={isMobile ? 5.5 : 0}
              >
                {editing ? (
                  <TextField
                    type="number"
                    size="small"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                    inputProps={{ min: 1, style: { textAlign: 'center' } }}
                    sx={{ 
                      width: isMobile ? 55 : 70,
                      '& .MuiInputBase-input': { py: 0.5, fontSize: isMobile ? '0.8rem' : '1rem' },
                    }}
                  />
                ) : (
                  <Box 
                    sx={{ 
                      px: 0.75, 
                      py: 0.25, 
                      borderRadius: 1,
                      backgroundColor: alpha(theme.palette.divider, 0.3),
                    }}
                  >
                    <Typography variant="caption" fontWeight={500}>
                      ×{item.quantity}
                    </Typography>
                  </Box>
                )}
                
                <Box textAlign="right" sx={{ minWidth: isMobile ? 60 : 80 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}>
                    {formatPrice(item.price)}
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="primary.main" sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                    {formatPrice(item.total)}
                  </Typography>
                </Box>

                {editing && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemove(index)}
                    sx={{
                      width: isMobile ? 28 : 32,
                      height: isMobile ? 28 : 32,
                      backgroundColor: alpha(theme.palette.error.main, 0.1),
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.error.main, 0.2),
                      },
                    }}
                  >
                    <DeleteTwoToneIcon sx={{ fontSize: isMobile ? 16 : 20 }} />
                  </IconButton>
                )}
              </Box>
            </ItemRow>
          ))}
        </Box>

        <TotalRow>
          <Typography variant="h6" fontWeight={600}>
            Итого:
          </Typography>
          <Typography variant="h5" fontWeight={700} color="primary.main">
            {editing ? formatPrice(calculateTotal()) : formatPrice(orderTotal)}
          </Typography>
        </TotalRow>
      </Card>

      <Dialog 
        open={addDialogOpen} 
        onClose={() => setAddDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
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
