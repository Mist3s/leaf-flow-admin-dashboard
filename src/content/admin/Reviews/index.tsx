import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Container,
  Grid,
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
  MenuItem,
  Rating,
  useTheme,
  Stack,
  Chip,
  alpha
} from '@mui/material';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import RateReviewTwoToneIcon from '@mui/icons-material/RateReviewTwoTone';
import PageHeader from 'src/components/PageHeader';
import LoadingState from 'src/components/LoadingState';
import DataTable, { DataTableColumn, FilterOption } from 'src/components/DataTable';
import Label from 'src/components/Label';
import { reviewsService } from 'src/api';
import { Review, ReviewCreate, ReviewPlatform } from 'src/models';
import { REVIEW_PLATFORM_CONFIG } from 'src/constants';
import { formatDate, truncate } from 'src/utils';

function ReviewsList() {
  const theme = useTheme();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [formData, setFormData] = useState<ReviewCreate>({
    platform: 'yandex',
    author: '',
    rating: 5,
    text: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [saving, setSaving] = useState(false);

  const fetchReviews = async () => {
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
  };

  useEffect(() => {
    fetchReviews();
  }, []);

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

  const handleOpenDialog = (review?: Review) => {
    if (review) {
      setEditingReview(review);
      setFormData({
        platform: review.platform,
        author: review.author,
        rating: review.rating,
        text: review.text,
        date: review.date
      });
    } else {
      setEditingReview(null);
      setFormData({
        platform: 'yandex',
        author: '',
        rating: 5,
        text: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingReview(null);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (editingReview) {
        await reviewsService.update(editingReview.id, formData);
      } else {
        await reviewsService.create(formData);
      }
      handleCloseDialog();
      fetchReviews();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот отзыв?')) {
      try {
        await reviewsService.delete(id);
        fetchReviews();
      } catch (err) {
        setError('Ошибка удаления отзыва');
      }
    }
  };

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
                handleOpenDialog(review);
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
                handleDelete(review.id);
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
            <IconButton size="small" onClick={() => handleOpenDialog(review)}>
              <EditTwoToneIcon fontSize="small" color="primary" />
            </IconButton>
            <IconButton size="small" onClick={() => handleDelete(review.id)}>
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
          onClick: () => handleOpenDialog(),
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

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            {editingReview ? 'Редактировать отзыв' : 'Новый отзыв'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              select
              label="Платформа"
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value as ReviewPlatform })}
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
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              margin="normal"
              required
            />
            <Box sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Рейтинг
              </Typography>
              <Rating
                value={formData.rating}
                onChange={(_, newValue) => setFormData({ ...formData, rating: newValue || 5 })}
                size="large"
              />
            </Box>
            <TextField
              fullWidth
              label="Текст отзыва"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              margin="normal"
              required
              multiline
              rows={4}
            />
            <TextField
              fullWidth
              label="Дата"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              margin="normal"
              required
              InputLabelProps={{ shrink: true }}
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

export default ReviewsList;
