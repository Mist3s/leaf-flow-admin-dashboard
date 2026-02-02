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
  MenuItem,
  Rating,
  useTheme,
  Stack,
  alpha
} from '@mui/material';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import PageHeader from 'src/components/PageHeader';
import LoadingState from 'src/components/LoadingState';
import ConfirmDialog from 'src/components/ConfirmDialog';
import FormDialog from 'src/components/FormDialog';
import DataTable, { DataTableColumn, FilterOption } from 'src/components/DataTable';
import Label from 'src/components/Label';
import { useConfirmDialog, useFormDialog } from 'src/hooks';
import { reviewsService } from 'src/api';
import { Review, ReviewCreate, ReviewPlatform } from 'src/models';
import { REVIEW_PLATFORM_CONFIG } from 'src/constants';
import { formatDate, truncate } from 'src/utils';

interface ReviewFormData {
  platform: ReviewPlatform;
  author: string;
  rating: number;
  text: string;
  date: string;
}

const defaultFormData: ReviewFormData = {
  platform: 'yandex',
  author: '',
  rating: 5,
  text: '',
  date: new Date().toISOString().split('T')[0],
};

function ReviewsList() {
  const theme = useTheme();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const { confirmDialog, openConfirmDialog, closeConfirmDialog } = useConfirmDialog();

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reviewsService.list();
      setReviews(data);
      setError('');
    } catch (err) {
      setError('Ошибка загрузки отзывов');
    } finally {
      setLoading(false);
    }
  }, []);

  const formDialog = useFormDialog<ReviewFormData, Review>(
    {
      defaultValues: defaultFormData,
      onSubmit: async (data, isEditing) => {
        const reviewData: ReviewCreate = data;
        if (isEditing && formDialog.editingItem) {
          await reviewsService.update(formDialog.editingItem.id, reviewData);
        } else {
          await reviewsService.create(reviewData);
        }
      },
      onSuccess: fetchReviews,
    },
    (review) => ({
      platform: review.platform,
      author: review.author,
      rating: review.rating,
      text: review.text,
      date: review.date,
    })
  );

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchesSearch = 
        review.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.text.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlatform = platformFilter === 'all' || review.platform === platformFilter;
      return matchesSearch && matchesPlatform;
    });
  }, [reviews, searchTerm, platformFilter]);

  const platformFilterOptions: FilterOption[] = [
    { value: 'all', label: 'Все платформы' },
    ...Object.entries(REVIEW_PLATFORM_CONFIG).map(([value, config]) => ({
      value,
      label: config.label,
    })),
  ];

  const handleDelete = useCallback((id: number, author: string) => {
    openConfirmDialog({
      title: 'Удалить отзыв',
      message: `Вы уверены, что хотите удалить отзыв от "${author}"?`,
      confirmText: 'Удалить',
      confirmColor: 'error',
      onConfirm: async () => {
        try {
          await reviewsService.delete(id);
          fetchReviews();
        } catch (err) {
          setError('Ошибка удаления отзыва');
        }
      }
    });
  }, [openConfirmDialog, fetchReviews]);

  const columns: DataTableColumn<Review>[] = [
    {
      id: 'platform',
      label: 'Платформа',
      render: (review) => {
        const config = REVIEW_PLATFORM_CONFIG[review.platform];
        return <Label color={config?.color || 'info'}>{config?.label || review.platform}</Label>;
      },
    },
    {
      id: 'author',
      label: 'Автор',
      render: (review) => (
        <Typography variant="body2" fontWeight={600}>
          {review.author}
        </Typography>
      ),
    },
    {
      id: 'rating',
      label: 'Рейтинг',
      render: (review) => <Rating value={review.rating} readOnly size="small" />,
    },
    {
      id: 'text',
      label: 'Текст',
      hideOnMobile: true,
      render: (review) => (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
          {truncate(review.text, 100)}
        </Typography>
      ),
    },
    {
      id: 'date',
      label: 'Дата',
      hideOnMobile: true,
      render: (review) => (
        <Typography variant="caption" color="text.secondary">
          {formatDate(review.date)}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: '',
      align: 'right',
      render: (review) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Редактировать" arrow>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                formDialog.open(review);
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
                handleDelete(review.id, review.author);
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

  const renderMobileCard = (review: Review) => {
    const config = REVIEW_PLATFORM_CONFIG[review.platform];
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box>
            <Typography variant="body1" fontWeight={600}>
              {review.author}
            </Typography>
            <Label color={config?.color || 'info'}>{config?.label || review.platform}</Label>
          </Box>
          <Rating value={review.rating} readOnly size="small" />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {truncate(review.text, 120)}
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {formatDate(review.date)}
          </Typography>
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" onClick={() => formDialog.open(review)}>
              <EditTwoToneIcon fontSize="small" color="primary" />
            </IconButton>
            <IconButton size="small" onClick={() => handleDelete(review.id, review.author)}>
              <DeleteTwoToneIcon fontSize="small" color="error" />
            </IconButton>
          </Stack>
        </Box>
      </Box>
    );
  };

  if (loading) {
    return <LoadingState message="Загрузка отзывов..." />;
  }

  return (
    <>
      <Helmet>
        <title>Отзывы - Leaf Flow Admin</title>
      </Helmet>
      <PageHeader
        title="Отзывы"
        subtitle="Управление отзывами с внешних платформ"
        action={{
          label: 'Добавить отзыв',
          icon: <AddTwoToneIcon />,
          onClick: () => formDialog.open(),
        }}
      />
      <Container maxWidth="lg">
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        <DataTable
          title="Все отзывы"
          data={filteredReviews}
          columns={columns}
          keyExtractor={(review) => review.id}
          searchPlaceholder="Поиск по автору или тексту..."
          onSearch={setSearchTerm}
          filters={[
            {
              label: 'Платформа',
              value: platformFilter,
              options: platformFilterOptions,
              onChange: setPlatformFilter,
            },
          ]}
          renderMobileCard={renderMobileCard}
          emptyMessage="Отзывы не найдены"
        />
      </Container>

      <FormDialog
        open={formDialog.isOpen}
        title={formDialog.isEditing ? 'Редактировать отзыв' : 'Новый отзыв'}
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
          select
          label="Платформа"
          value={formDialog.formData.platform}
          onChange={(e) => formDialog.updateField('platform', e.target.value as ReviewPlatform)}
          margin="normal"
          required
        >
          {Object.entries(REVIEW_PLATFORM_CONFIG).map(([value, config]) => (
            <MenuItem key={value} value={value}>{config.label}</MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth
          label="Автор"
          value={formDialog.formData.author}
          onChange={(e) => formDialog.updateField('author', e.target.value)}
          margin="normal"
          required
        />
        <Box sx={{ my: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Рейтинг
          </Typography>
          <Rating
            value={formDialog.formData.rating}
            onChange={(_, newValue) => formDialog.updateField('rating', newValue || 5)}
            size="large"
          />
        </Box>
        <TextField
          fullWidth
          label="Текст отзыва"
          value={formDialog.formData.text}
          onChange={(e) => formDialog.updateField('text', e.target.value)}
          margin="normal"
          required
          multiline
          rows={4}
        />
        <TextField
          fullWidth
          label="Дата"
          type="date"
          value={formDialog.formData.date}
          onChange={(e) => formDialog.updateField('date', e.target.value)}
          margin="normal"
          required
          InputLabelProps={{ shrink: true }}
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

export default ReviewsList;
