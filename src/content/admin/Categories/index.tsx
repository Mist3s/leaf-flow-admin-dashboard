import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Container,
  Button,
  Typography,
  Box,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import CategoryTwoToneIcon from '@mui/icons-material/CategoryTwoTone';
import PageHeader from 'src/components/PageHeader';
import LoadingState from 'src/components/LoadingState';
import DataTable, { DataTableColumn } from 'src/components/DataTable';
import { categoriesService } from 'src/api';
import { Category, CategoryCreate, CategoryUpdate } from 'src/models';

function CategoriesList() {
  const theme = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => 
      category.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

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

  const columns: DataTableColumn<Category>[] = [
    {
      id: 'slug',
      label: 'Slug',
      render: (category) => (
        <Chip
          label={category.slug}
          size="small"
          variant="outlined"
          sx={{ borderRadius: 1.5, fontFamily: 'monospace' }}
        />
      ),
    },
    {
      id: 'label',
      label: 'Название',
      render: (category) => (
        <Typography variant="body2" fontWeight={600}>
          {category.label}
        </Typography>
      ),
    },
    {
      id: 'sort_order',
      label: 'Порядок',
      align: 'center',
      render: (category) => (
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 'auto',
          }}
        >
          <Typography variant="body2" fontWeight={600} color="primary">
            {category.sort_order}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'actions',
      label: '',
      align: 'right',
      render: (category) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Редактировать" arrow>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDialog(category);
              }}
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.2) },
              }}
            >
              <EditTwoToneIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Удалить" arrow>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(category.slug);
              }}
              sx={{
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.2) },
              }}
            >
              <DeleteTwoToneIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const renderMobileCard = (category: Category) => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CategoryTwoToneIcon color="primary" />
          </Box>
          <Box>
            <Typography variant="body1" fontWeight={600}>
              {category.label}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontFamily="monospace">
              {category.slug}
            </Typography>
          </Box>
        </Box>
        <Chip
          label={`#${category.sort_order}`}
          size="small"
          color="primary"
          sx={{ borderRadius: 1 }}
        />
      </Box>
      <Box display="flex" justifyContent="flex-end" gap={0.5}>
        <IconButton size="small" onClick={() => handleOpenDialog(category)}>
          <EditTwoToneIcon fontSize="small" color="primary" />
        </IconButton>
        <IconButton size="small" onClick={() => handleDelete(category.slug)}>
          <DeleteTwoToneIcon fontSize="small" color="error" />
        </IconButton>
      </Box>
    </Box>
  );

  if (loading) {
    return <LoadingState message="Загрузка категорий..." />;
  }

  return (
    <>
      <Helmet>
        <title>Категории - Leaf Flow Admin</title>
      </Helmet>
      <PageHeader
        title="Категории"
        subtitle="Управление категориями продуктов"
        action={{
          label: 'Добавить категорию',
          icon: <AddTwoToneIcon />,
          onClick: () => handleOpenDialog(),
        }}
      />
      <Container maxWidth="lg">
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        <DataTable
          title="Все категории"
          data={filteredCategories}
          columns={columns}
          keyExtractor={(category) => category.slug}
          searchPlaceholder="Поиск по slug или названию..."
          onSearch={setSearchTerm}
          renderMobileCard={renderMobileCard}
          emptyMessage="Категории не найдены"
        />
      </Container>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            {editingCategory ? 'Редактировать категорию' : 'Новая категория'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default CategoriesList;
