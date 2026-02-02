import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControlLabel,
  Switch,
  Box,
  Stack,
  useTheme,
  useMediaQuery,
  alpha,
  styled
} from '@mui/material';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import ScaleTwoToneIcon from '@mui/icons-material/ScaleTwoTone';
import { ProductVariant } from 'src/models';
import { formatPrice } from 'src/utils';

export interface LocalVariant extends ProductVariant {
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}

interface VariantFormData {
  id: string;
  weight: string;
  price: string;
  is_active: boolean;
  sort_order: number;
}

interface ProductVariantsCardProps {
  variants: LocalVariant[];
  onAdd: (variant: VariantFormData) => Promise<void>;
  onEdit: (variant: LocalVariant, data: VariantFormData) => Promise<void>;
  onDelete: (variant: LocalVariant) => Promise<void>;
}

const initialFormData: VariantFormData = {
  id: '',
  weight: '',
  price: '',
  is_active: true,
  sort_order: 0
};

const VariantItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
  borderRadius: 12,
  backgroundColor: alpha(theme.palette.background.default, 0.5),
  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
  transition: 'all 0.15s ease-in-out',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.02),
    borderColor: alpha(theme.palette.primary.main, 0.2),
  },
}));

function ProductVariantsCard({
  variants,
  onAdd,
  onEdit,
  onDelete
}: ProductVariantsCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<LocalVariant | null>(null);
  const [formData, setFormData] = useState<VariantFormData>(initialFormData);

  const openAddDialog = () => {
    setEditingVariant(null);
    setFormData({
      ...initialFormData,
      sort_order: variants.length
    });
    setDialogOpen(true);
  };

  const openEditDialog = (variant: LocalVariant) => {
    setEditingVariant(variant);
    setFormData({
      id: variant.id,
      weight: variant.weight,
      price: variant.price,
      is_active: variant.is_active,
      sort_order: variant.sort_order
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.id || !formData.weight || !formData.price) {
      return;
    }

    if (editingVariant) {
      await onEdit(editingVariant, formData);
    } else {
      await onAdd(formData);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (variant: LocalVariant) => {
    if (window.confirm('Удалить этот вариант?')) {
      await onDelete(variant);
    }
  };

  return (
    <>
      <Card>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <ScaleTwoToneIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Варианты
              </Typography>
              <Chip
                label={variants.length}
                size="small"
                color="primary"
                sx={{ ml: 1, minWidth: 28, height: 24 }}
              />
            </Box>
          }
          action={
            <Button
              startIcon={<AddTwoToneIcon />}
              onClick={openAddDialog}
              size="small"
              variant="outlined"
            >
              Добавить
            </Button>
          }
        />
        <CardContent>
          {variants.length > 0 ? (
            <Stack spacing={1.5}>
              {variants.map((variant) => (
                <VariantItem key={variant.id}>
                  <Box display="flex" alignItems="center" gap={2} flex={1} minWidth={0}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1.5,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Typography variant="caption" fontWeight={700} color="primary">
                        {variant.id}
                      </Typography>
                    </Box>
                    
                    <Box flex={1} minWidth={0}>
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Typography variant="body2" fontWeight={600}>
                          {variant.weight}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          •
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color="primary.main">
                          {formatPrice(variant.price)}
                        </Typography>
                      </Box>
                      {!isMobile && (
                        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                          <Chip
                            size="small"
                            label={variant.is_active ? 'Активен' : 'Неактивен'}
                            color={variant.is_active ? 'success' : 'default'}
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Порядок: {variant.sort_order}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      onClick={() => openEditDialog(variant)}
                      sx={{
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.2),
                        },
                      }}
                    >
                      <EditTwoToneIcon fontSize="small" color="primary" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(variant)}
                      sx={{
                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.error.main, 0.2),
                        },
                      }}
                    >
                      <DeleteTwoToneIcon fontSize="small" color="error" />
                    </IconButton>
                  </Stack>
                </VariantItem>
              ))}
            </Stack>
          ) : (
            <Box
              py={4}
              display="flex"
              flexDirection="column"
              alignItems="center"
              sx={{
                borderRadius: 2,
                border: `2px dashed ${alpha(theme.palette.divider, 0.5)}`,
                backgroundColor: alpha(theme.palette.background.default, 0.5),
              }}
            >
              <ScaleTwoToneIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography color="text.secondary" gutterBottom>
                Варианты не добавлены
              </Typography>
              <Button
                startIcon={<AddTwoToneIcon />}
                onClick={openAddDialog}
                size="small"
                sx={{ mt: 1 }}
              >
                Добавить вариант
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            {editingVariant ? 'Редактировать вариант' : 'Добавить вариант'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ID варианта"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                disabled={!!editingVariant && !editingVariant.isNew}
                placeholder="25g"
                required
                helperText="Уникальный идентификатор (например: 25g, 50g, 100g)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Вес"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="25 г"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Цена (₽)"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="500"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Порядок сортировки"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" height="100%">
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      color="success"
                    />
                  }
                  label="Активен"
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} variant="contained">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ProductVariantsCard;
