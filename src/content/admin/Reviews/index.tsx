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
  MenuItem,
  Rating,
  useTheme
} from '@mui/material';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import Label from 'src/components/Label';
import { reviewsService } from 'src/api';
import { Review, ReviewCreate, ReviewPlatform } from 'src/models';

const platformOptions: { value: ReviewPlatform; label: string; color: 'error' | 'success' | 'warning' | 'info' | 'primary' }[] = [
  { value: 'yandex', label: 'Яндекс', color: 'warning' },
  { value: 'google', label: 'Google', color: 'info' },
  { value: 'telegram', label: 'Telegram', color: 'primary' },
  { value: 'avito', label: 'Авито', color: 'success' }
];

function ReviewsList() {
  const theme = useTheme();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  const getPlatformLabel = (platform: ReviewPlatform) => {
    const option = platformOptions.find(p => p.value === platform);
    return option ? <Label color={option.color}>{option.label}</Label> : platform;
  };

  return (
    <>
      <Helmet>
        <title>Отзывы - Leaf Flow Admin</title>
      </Helmet>
      <PageTitleWrapper>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h3" component="h3" gutterBottom>
              Отзывы
            </Typography>
            <Typography variant="subtitle2">
              Управление отзывами с внешних платформ
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddTwoToneIcon fontSize="small" />}
            onClick={() => handleOpenDialog()}
          >
            Добавить отзыв
          </Button>
        </Box>
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {loading ? (
              <Box display="flex" justifyContent="center" py={5}>
                <CircularProgress />
              </Box>
            ) : (
              <Card>
                <CardHeader title="Все отзывы" />
                <Divider />
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Платформа</TableCell>
                        <TableCell>Автор</TableCell>
                        <TableCell>Рейтинг</TableCell>
                        <TableCell>Текст</TableCell>
                        <TableCell>Дата</TableCell>
                        <TableCell align="right">Действия</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reviews.map((review) => (
                        <TableRow hover key={review.id}>
                          <TableCell>{getPlatformLabel(review.platform)}</TableCell>
                          <TableCell>
                            <Typography variant="body1" fontWeight="bold">
                              {review.author}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Rating value={review.rating} readOnly size="small" />
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: 300,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {review.text}
                            </Typography>
                          </TableCell>
                          <TableCell>{review.date}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="Редактировать" arrow>
                              <IconButton
                                sx={{
                                  '&:hover': { background: theme.colors.primary.lighter },
                                  color: theme.palette.primary.main
                                }}
                                onClick={() => handleOpenDialog(review)}
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
                                onClick={() => handleDelete(review.id)}
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
          {editingReview ? 'Редактировать отзыв' : 'Новый отзыв'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              select
              label="Платформа"
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value as ReviewPlatform })}
              margin="normal"
              required
            >
              {platformOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
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
              <Typography component="legend">Рейтинг</Typography>
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

export default ReviewsList;
