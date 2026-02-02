import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Container,
  Grid,
  Card,
  CardHeader,
  Divider,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme
} from '@mui/material';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import { categoriesService } from 'src/api';
import { Category, CategoryCreate, CategoryUpdate } from 'src/models';

function CategoriesList() {
  const theme = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ slug: '', label: '', sort_order: 0 });
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesService.list();
      setCategories(data.sort((a, b) => a.sort_order - b.sort_order));
      setError('');
    } catch (err) {
      setError('Ошибка загрузки категорий');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ slug: category.slug, label: category.label, sort_order: category.sort_order });
    } else {
      setEditingCategory(null);
      setFormData({ slug: '', label: '', sort_order: categories.length });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setFormData({ slug: '', label: '', sort_order: 0 });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (editingCategory) {
        const updateData: CategoryUpdate = { label: formData.label, sort_order: formData.sort_order };
        await categoriesService.update(editingCategory.slug, updateData);
      } else {
        const createData: CategoryCreate = formData;
        await categoriesService.create(createData);
      }
      handleCloseDialog();
      fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту категорию?')) {
      try {
        await categoriesService.delete(slug);
        fetchCategories();
      } catch (err) {
        setError('Ошибка удаления категории');
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Категории - Leaf Flow Admin</title>
      </Helmet>
      <PageTitleWrapper>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h3" component="h3" gutterBottom>
              Категории
            </Typography>
            <Typography variant="subtitle2">
              Управление категориями продуктов
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddTwoToneIcon fontSize="small" />}
            onClick={() => handleOpenDialog()}
          >
            Добавить категорию
          </Button>
        </Box>
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {loading ? (
              <Box display="flex" justifyContent="center" py={5}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            ) : (
              <Card>
                <CardHeader title="Все категории" />
                <Divider />
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Slug</TableCell>
                        <TableCell>Название</TableCell>
                        <TableCell align="center">Порядок</TableCell>
                        <TableCell align="right">Действия</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow hover key={category.slug}>
                          <TableCell>
                            <Typography variant="body1" fontWeight="bold">
                              {category.slug}
                            </Typography>
                          </TableCell>
                          <TableCell>{category.label}</TableCell>
                          <TableCell align="center">{category.sort_order}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="Редактировать" arrow>
                              <IconButton
                                sx={{
                                  '&:hover': { background: theme.colors.primary.lighter },
                                  color: theme.palette.primary.main
                                }}
                                onClick={() => handleOpenDialog(category)}
                                size="small"
                              >
                                <EditTwoToneIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Удалить" arrow>
                              <IconButton
                                sx={{
                                  '&:hover': { background: theme.colors.error.lighter },
                                  color: theme.palette.error.main
                                }}
                                onClick={() => handleDelete(category.slug)}
                                size="small"
                              >
                                <DeleteTwoToneIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Редактировать категорию' : 'Новая категория'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              disabled={!!editingCategory}
              margin="normal"
              required
              helperText="Уникальный идентификатор категории"
            />
            <TextField
              fullWidth
              label="Название"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              type="number"
              label="Порядок сортировки"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default CategoriesList;
