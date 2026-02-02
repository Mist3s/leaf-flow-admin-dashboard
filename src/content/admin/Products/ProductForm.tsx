import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Container,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Divider,
  TextField,
  Button,
  Box,
  FormControlLabel,
  Switch,
  MenuItem,
  CircularProgress,
  Alert,
  Typography,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  useTheme,
  useMediaQuery,
  Checkbox,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import CloudUploadTwoToneIcon from '@mui/icons-material/CloudUploadTwoTone';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import { productsService, categoriesService, imagesService } from 'src/api';
import { ProductImageResponse } from 'src/api/services/images';
import { Product, Category, ProductCreate, ProductUpdate, ProductVariant, VariantCreate, VariantUpdate, AttributeDetail, AttributeValueDetail } from 'src/models';

interface LocalVariant extends ProductVariant {
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}

function ProductForm() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const isEdit = !!productId;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    category_slug: '',
    product_type_code: 'tea',
    tags: [] as string[],
    is_active: true,
    sort_order: 0
  });

  const [variants, setVariants] = useState<LocalVariant[]>([]);
  const [images, setImages] = useState<ProductImageResponse[]>([]);
  const [newTag, setNewTag] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Attributes
  const [allAttributes, setAllAttributes] = useState<AttributeDetail[]>([]);
  const [selectedAttributeValues, setSelectedAttributeValues] = useState<number[]>([]);
  const [savingAttributes, setSavingAttributes] = useState(false);

  // Variant edit dialog
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<LocalVariant | null>(null);
  const [variantForm, setVariantForm] = useState({
    id: '',
    weight: '',
    price: '',
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cats, attrs] = await Promise.all([
          categoriesService.list(),
          productsService.listAttributes()
        ]);
        setCategories(cats);
        setAllAttributes(attrs);

        if (isEdit && productId) {
          const product = await productsService.get(productId);
          setFormData({
            id: product.id,
            name: product.name,
            description: product.description,
            category_slug: product.category_slug,
            product_type_code: product.product_type_code,
            tags: product.tags,
            is_active: product.is_active,
            sort_order: product.sort_order
          });
          setVariants(product.variants.map(v => ({
            ...v,
            isNew: false,
            isModified: false,
            isDeleted: false
          })));

          // Set selected attribute values from product
          if (product.attribute_values) {
            const selectedIds: number[] = [];
            product.attribute_values.forEach(attr => {
              attr.values.forEach(val => {
                selectedIds.push(val.id);
              });
            });
            setSelectedAttributeValues(selectedIds);
          }

          // Load images
          try {
            const productImages = await imagesService.listProductImages(productId);
            setImages(productImages);
          } catch {
            // Images might not exist yet
          }
        }
      } catch (err) {
        setError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isEdit, productId]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  // Variant operations
  const openAddVariantDialog = () => {
    setEditingVariant(null);
    setVariantForm({
      id: '',
      weight: '',
      price: '',
      is_active: true,
      sort_order: variants.length
    });
    setVariantDialogOpen(true);
  };

  const openEditVariantDialog = (variant: LocalVariant) => {
    setEditingVariant(variant);
    setVariantForm({
      id: variant.id,
      weight: variant.weight,
      price: variant.price,
      is_active: variant.is_active,
      sort_order: variant.sort_order
    });
    setVariantDialogOpen(true);
  };

  const handleSaveVariant = async () => {
    if (!variantForm.id || !variantForm.weight || !variantForm.price) {
      setError('Заполните все обязательные поля варианта');
      return;
    }

    try {
      if (isEdit && productId) {
        if (editingVariant && !editingVariant.isNew) {
          // Update existing variant
          const updateData: VariantUpdate = {
            weight: variantForm.weight,
            price: variantForm.price,
            is_active: variantForm.is_active,
            sort_order: variantForm.sort_order
          };
          await productsService.updateVariant(productId, editingVariant.id, updateData);
          setVariants(variants.map(v =>
            v.id === editingVariant.id
              ? { ...v, ...variantForm, isModified: false }
              : v
          ));
          setSuccess('Вариант обновлён');
        } else {
          // Create new variant
          const createData: VariantCreate = {
            id: variantForm.id,
            weight: variantForm.weight,
            price: variantForm.price,
            is_active: variantForm.is_active,
            sort_order: variantForm.sort_order
          };
          await productsService.createVariant(productId, createData);
          setVariants([...variants.filter(v => v.id !== variantForm.id), {
            ...variantForm,
            isNew: false,
            isModified: false,
            isDeleted: false
          }]);
          setSuccess('Вариант добавлен');
        }
      } else {
        // For new product - just add to local state
        if (editingVariant) {
          setVariants(variants.map(v =>
            v.id === editingVariant.id
              ? { ...v, ...variantForm }
              : v
          ));
        } else {
          setVariants([...variants, {
            ...variantForm,
            isNew: true,
            isModified: false,
            isDeleted: false
          }]);
        }
      }
      setVariantDialogOpen(false);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения варианта');
    }
  };

  const handleDeleteVariant = async (variant: LocalVariant) => {
    if (!window.confirm('Удалить этот вариант?')) return;

    try {
      if (isEdit && productId && !variant.isNew) {
        await productsService.deleteVariant(productId, variant.id);
        setSuccess('Вариант удалён');
      }
      setVariants(variants.filter(v => v.id !== variant.id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления варианта');
    }
  };

  // Image operations
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const targetProductId = isEdit ? productId : formData.id;
    if (!targetProductId) {
      setError('Сначала сохраните продукт, затем добавляйте изображения');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      for (const file of Array.from(files)) {
        const uploaded = await imagesService.uploadImage(targetProductId, file, file.name);
        setImages(prev => [...prev, uploaded]);
      }
      setSuccess('Изображения загружены');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки изображений');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!window.confirm('Удалить это изображение?')) return;

    try {
      await imagesService.deleteImage(imageId);
      setImages(images.filter(img => img.id !== imageId));
      setSuccess('Изображение удалено');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления изображения');
    }
  };

  const getImageUrl = (image: ProductImageResponse): string => {
    const mdVariant = image.variants.find(v => v.variant === 'md');
    const thumbVariant = image.variants.find(v => v.variant === 'thumb');
    const originalVariant = image.variants.find(v => v.variant === 'original');
    const variant = mdVariant || thumbVariant || originalVariant;
    if (variant) {
      return variant.storage_key;
    }
    return '';
  };

  // Attribute operations
  const handleAttributeValueToggle = (valueId: number) => {
    setSelectedAttributeValues(prev => {
      if (prev.includes(valueId)) {
        return prev.filter(id => id !== valueId);
      } else {
        return [...prev, valueId];
      }
    });
  };

  const handleSaveAttributes = async () => {
    if (!productId) return;
    setSavingAttributes(true);
    setError('');
    try {
      await productsService.setProductAttributes(productId, selectedAttributeValues);
      setSuccess('Атрибуты сохранены');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения атрибутов');
    } finally {
      setSavingAttributes(false);
    }
  };

  // Filter attributes by product type
  const filteredAttributes = useMemo(() => {
    if (!formData.product_type_code) return allAttributes;
    
    return allAttributes.filter(attr => {
      // If attribute has no product_type_codes, show it for all types
      if (!attr.product_type_codes || attr.product_type_codes.length === 0) {
        return true;
      }
      // Otherwise, check if current product type is in the list
      return attr.product_type_codes.includes(formData.product_type_code);
    });
  }, [allAttributes, formData.product_type_code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (isEdit && productId) {
        const updateData: ProductUpdate = {
          name: formData.name,
          description: formData.description,
          category_slug: formData.category_slug,
          product_type_code: formData.product_type_code,
          tags: formData.tags,
          is_active: formData.is_active,
          sort_order: formData.sort_order
        };
        await productsService.update(productId, updateData);
        setSuccess('Продукт сохранён');
      } else {
        const createData: ProductCreate = {
          id: formData.id,
          name: formData.name,
          description: formData.description,
          category_slug: formData.category_slug,
          product_type_code: formData.product_type_code,
          tags: formData.tags,
          is_active: formData.is_active
        };
        await productsService.create(createData);

        // Create variants for new product
        for (const variant of variants) {
          if (variant.id && variant.weight && variant.price) {
            await productsService.createVariant(formData.id, {
              id: variant.id,
              weight: variant.weight,
              price: variant.price,
              is_active: variant.is_active,
              sort_order: variant.sort_order
            });
          }
        }

        navigate('/admin/products');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isEdit ? 'Редактирование продукта' : 'Новый продукт'} - Leaf Flow Admin</title>
      </Helmet>
      <PageTitleWrapper>
        <Typography variant="h3" component="h3">
          {isEdit ? 'Редактирование продукта' : 'Новый продукт'}
        </Typography>
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {error && (
              <Grid item xs={12}>
                <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
              </Grid>
            )}
            {success && (
              <Grid item xs={12}>
                <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
              </Grid>
            )}

            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader title="Основная информация" />
                <Divider />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="ID продукта"
                        value={formData.id}
                        onChange={handleChange('id')}
                        disabled={isEdit}
                        required
                        helperText="Уникальный идентификатор (slug)"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Название"
                        value={formData.name}
                        onChange={handleChange('name')}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Описание"
                        value={formData.description}
                        onChange={handleChange('description')}
                        multiline
                        rows={4}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        select
                        label="Категория"
                        value={formData.category_slug}
                        onChange={handleChange('category_slug')}
                        required
                      >
                        {categories.map((cat) => (
                          <MenuItem key={cat.slug} value={cat.slug}>
                            {cat.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Тип продукта"
                        value={formData.product_type_code}
                        onChange={handleChange('product_type_code')}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box display="flex" gap={1} alignItems="center" mb={1}>
                        <TextField
                          size="small"
                          label="Добавить тег"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        />
                        <Button onClick={handleAddTag} variant="outlined" size="small">
                          Добавить
                        </Button>
                      </Box>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {formData.tags.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            onDelete={() => handleRemoveTag(tag)}
                            size="small"
                          />
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Настройки" />
                <Divider />
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      />
                    }
                    label="Активен"
                  />
                  <TextField
                    fullWidth
                    type="number"
                    label="Порядок сортировки"
                    value={formData.sort_order}
                    onChange={handleChange('sort_order')}
                    sx={{ mt: 2 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Variants Section */}
            <Grid item xs={12}>
              <Card>
                <CardHeader
                  title="Варианты"
                  action={
                    <Button
                      startIcon={<AddTwoToneIcon />}
                      onClick={openAddVariantDialog}
                      size="small"
                    >
                      Добавить вариант
                    </Button>
                  }
                />
                <Divider />
                <CardContent>
                  {variants.length > 0 ? (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>ID</TableCell>
                          <TableCell>Вес</TableCell>
                          <TableCell>Цена</TableCell>
                          <TableCell>Активен</TableCell>
                          <TableCell>Порядок</TableCell>
                          <TableCell align="right">Действия</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {variants.map((variant) => (
                          <TableRow key={variant.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {variant.id}
                              </Typography>
                            </TableCell>
                            <TableCell>{variant.weight}</TableCell>
                            <TableCell>{variant.price} ₽</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={variant.is_active ? 'Да' : 'Нет'}
                                color={variant.is_active ? 'success' : 'default'}
                              />
                            </TableCell>
                            <TableCell>{variant.sort_order}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={() => openEditVariantDialog(variant)}
                                color="primary"
                              >
                                <EditTwoToneIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteVariant(variant)}
                                color="error"
                              >
                                <DeleteTwoToneIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Typography color="text.secondary">
                      Добавьте варианты продукта (размеры/веса)
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Images Section */}
            {isEdit && (
              <Grid item xs={12}>
                <Card>
                  <CardHeader
                    title="Изображения"
                    action={
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          style={{ display: 'none' }}
                          id="image-upload-input"
                        />
                        <label htmlFor="image-upload-input">
                          <Button
                            component="span"
                            startIcon={uploadingImage ? <CircularProgress size={16} /> : <CloudUploadTwoToneIcon />}
                            size="small"
                            disabled={uploadingImage}
                          >
                            {uploadingImage ? 'Загрузка...' : 'Загрузить изображения'}
                          </Button>
                        </label>
                      </>
                    }
                  />
                  <Divider />
                  <CardContent>
                    {images.length > 0 ? (
                      <ImageList cols={isMobile ? 2 : 4} gap={16}>
                        {images.map((image) => (
                          <ImageListItem key={image.id} sx={{ borderRadius: 1, overflow: 'hidden' }}>
                            <img
                              src={getImageUrl(image)}
                              alt={image.title}
                              loading="lazy"
                              style={{ height: 150, objectFit: 'cover' }}
                            />
                            <ImageListItemBar
                              title={image.title}
                              subtitle={image.is_active ? 'Активно' : 'Неактивно'}
                              actionIcon={
                                <IconButton
                                  sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
                                  onClick={() => handleDeleteImage(image.id)}
                                >
                                  <DeleteTwoToneIcon />
                                </IconButton>
                              }
                            />
                          </ImageListItem>
                        ))}
                      </ImageList>
                    ) : (
                      <Typography color="text.secondary">
                        Изображения ещё не добавлены
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Attributes Section */}
            {isEdit && filteredAttributes.length > 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardHeader
                    title="Атрибуты"
                    action={
                      <Button
                        size="small"
                        variant="contained"
                        onClick={handleSaveAttributes}
                        disabled={savingAttributes}
                        startIcon={savingAttributes ? <CircularProgress size={16} /> : null}
                      >
                        {savingAttributes ? 'Сохранение...' : 'Сохранить атрибуты'}
                      </Button>
                    }
                  />
                  <Divider />
                  <CardContent>
                    {filteredAttributes.map((attribute) => (
                      <Accordion key={attribute.id} defaultExpanded={false}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {attribute.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {attribute.description} • {attribute.kind === 'single' ? 'Одиночный выбор' : attribute.kind === 'multi' ? 'Множественный выбор' : attribute.kind}
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <FormGroup row={!isMobile}>
                            {attribute.values
                              .filter(v => v.is_active)
                              .map((value) => (
                                <FormControlLabel
                                  key={value.id}
                                  control={
                                    <Checkbox
                                      checked={selectedAttributeValues.includes(value.id)}
                                      onChange={() => handleAttributeValueToggle(value.id)}
                                    />
                                  }
                                  label={value.name}
                                  sx={{ minWidth: 150 }}
                                />
                              ))}
                          </FormGroup>
                          {attribute.values.filter(v => v.is_active).length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                              Нет доступных значений
                            </Typography>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => navigate('/admin/products')}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={20} /> : (isEdit ? 'Сохранить' : 'Создать')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>

        {/* Variant Dialog */}
        <Dialog open={variantDialogOpen} onClose={() => setVariantDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingVariant ? 'Редактировать вариант' : 'Добавить вариант'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="ID варианта"
                  value={variantForm.id}
                  onChange={(e) => setVariantForm({ ...variantForm, id: e.target.value })}
                  disabled={!!editingVariant && !editingVariant.isNew}
                  placeholder="25g"
                  required
                  helperText="Уникальный идентификатор (например: 25g, 50g, 100g)"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Вес"
                  value={variantForm.weight}
                  onChange={(e) => setVariantForm({ ...variantForm, weight: e.target.value })}
                  placeholder="25 г"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Цена (₽)"
                  value={variantForm.price}
                  onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
                  placeholder="500"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Порядок сортировки"
                  value={variantForm.sort_order}
                  onChange={(e) => setVariantForm({ ...variantForm, sort_order: parseInt(e.target.value) || 0 })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={variantForm.is_active}
                      onChange={(e) => setVariantForm({ ...variantForm, is_active: e.target.checked })}
                    />
                  }
                  label="Активен"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setVariantDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleSaveVariant} variant="contained">
              Сохранить
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}

export default ProductForm;
