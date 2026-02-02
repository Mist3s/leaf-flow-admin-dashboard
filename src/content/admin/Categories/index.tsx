import { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Container,
  Typography,
  Box,
  Alert,
  IconButton,
  Tooltip,
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
import ConfirmDialog from 'src/components/ConfirmDialog';
import FormDialog from 'src/components/FormDialog';
import DataTable, { DataTableColumn } from 'src/components/DataTable';
import { useConfirmDialog, useFormDialog } from 'src/hooks';
import { categoriesService } from 'src/api';
import { Category, CategoryCreate, CategoryUpdate } from 'src/models';

interface CategoryFormData {
  slug: string;
  label: string;
  sort_order: number;
}

const defaultFormData: CategoryFormData = {
  slug: '',
  label: '',
  sort_order: 0,
};

function CategoriesList() {
  const theme = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { confirmDialog, openConfirmDialog, closeConfirmDialog } = useConfirmDialog();

  const fetchCategories = useCallback(async () => {
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
  }, []);

  const formDialog = useFormDialog<CategoryFormData, Category>(
    {
      defaultValues: { ...defaultFormData, sort_order: categories.length },
      onSubmit: async (data, isEditing) => {
        if (isEditing && formDialog.editingItem) {
          const updateData: CategoryUpdate = { label: data.label, sort_order: data.sort_order };
          await categoriesService.update(formDialog.editingItem.slug, updateData);
        } else {
          const createData: CategoryCreate = data;
          await categoriesService.create(createData);
        }
      },
      onSuccess: fetchCategories,
    },
    (category) => ({
      slug: category.slug,
      label: category.label,
      sort_order: category.sort_order,
    })
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => 
      category.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const handleDelete = useCallback((slug: string, label: string) => {
    openConfirmDialog({
      title: 'Удалить категорию',
      message: `Вы уверены, что хотите удалить категорию "${label}"?`,
      confirmText: 'Удалить',
      confirmColor: 'error',
      onConfirm: async () => {
        try {
          await categoriesService.delete(slug);
          fetchCategories();
        } catch (err) {
          setError('Ошибка удаления категории');
        }
      }
    });
  }, [openConfirmDialog, fetchCategories]);

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
                formDialog.open(category);
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
                handleDelete(category.slug, category.label);
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
        <IconButton size="small" onClick={() => formDialog.open(category)}>
          <EditTwoToneIcon fontSize="small" color="primary" />
        </IconButton>
        <IconButton size="small" onClick={() => handleDelete(category.slug, category.label)}>
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
          onClick: () => formDialog.open(),
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

      <FormDialog
        open={formDialog.isOpen}
        title={formDialog.isEditing ? 'Редактировать категорию' : 'Новая категория'}
        onClose={formDialog.close}
        onSubmit={formDialog.handleSubmit}
        isLoading={formDialog.isLoading}
      >
        {formDialog.error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={formDialog.clearError}>
            {formDialog.error}
          </Alert>
        )}
        <TextField
          fullWidth
          label="Slug"
          value={formDialog.formData.slug}
          onChange={(e) => formDialog.updateField('slug', e.target.value)}
          disabled={formDialog.isEditing}
          margin="normal"
          required
          helperText="Уникальный идентификатор категории"
        />
        <TextField
          fullWidth
          label="Название"
          value={formDialog.formData.label}
          onChange={(e) => formDialog.updateField('label', e.target.value)}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          type="number"
          label="Порядок сортировки"
          value={formDialog.formData.sort_order}
          onChange={(e) => formDialog.updateField('sort_order', parseInt(e.target.value) || 0)}
          margin="normal"
        />
      </FormDialog>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmColor={confirmDialog.confirmColor}
        onConfirm={confirmDialog.onConfirm}
        onClose={closeConfirmDialog}
      />
    </>
  );
}

export default CategoriesList;
