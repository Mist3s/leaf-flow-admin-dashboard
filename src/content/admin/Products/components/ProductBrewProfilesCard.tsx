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
import CoffeeMakerTwoToneIcon from '@mui/icons-material/CoffeeMakerTwoTone';
import { BrewProfile } from 'src/models';

interface BrewProfileFormData {
  method: string;
  teaware: string;
  temperature: string;
  brew_time: string;
  weight: string;
  note: string;
  sort_order: number;
  is_active: boolean;
}

interface ProductBrewProfilesCardProps {
  profiles: BrewProfile[];
  onAdd: (data: BrewProfileFormData) => Promise<void>;
  onEdit: (profile: BrewProfile, data: BrewProfileFormData) => Promise<void>;
  onDelete: (profile: BrewProfile) => Promise<void>;
}

const initialFormData: BrewProfileFormData = {
  method: '',
  teaware: '',
  temperature: '',
  brew_time: '',
  weight: '',
  note: '',
  sort_order: 0,
  is_active: true
};

const ProfileItem = styled(Box)(({ theme }) => ({
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

function ProductBrewProfilesCard({
  profiles,
  onAdd,
  onEdit,
  onDelete
}: ProductBrewProfilesCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<BrewProfile | null>(null);
  const [formData, setFormData] = useState<BrewProfileFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  const openAddDialog = () => {
    setEditingProfile(null);
    setFormData({
      ...initialFormData,
      sort_order: profiles.length
    });
    setDialogOpen(true);
  };

  const openEditDialog = (profile: BrewProfile) => {
    setEditingProfile(profile);
    setFormData({
      method: profile.method,
      teaware: profile.teaware,
      temperature: profile.temperature,
      brew_time: profile.brew_time,
      weight: profile.weight,
      note: profile.note || '',
      sort_order: profile.sort_order,
      is_active: profile.is_active
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.method || !formData.teaware || !formData.temperature || !formData.brew_time || !formData.weight) {
      return;
    }

    setSaving(true);
    try {
      if (editingProfile) {
        await onEdit(editingProfile, formData);
      } else {
        await onAdd(formData);
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (profile: BrewProfile) => {
    if (window.confirm(`Удалить профиль "${profile.method}"?`)) {
      await onDelete(profile);
    }
  };

  return (
    <>
      <Card>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={1} flexWrap="nowrap" minWidth={0}>
              {!isMobile && <CoffeeMakerTwoToneIcon color="primary" />}
              <Typography variant="h6" fontWeight={600} noWrap>
                Профили заваривания
              </Typography>
              <Chip
                label={profiles.length}
                size="small"
                color="primary"
                sx={{ minWidth: 24, height: 22 }}
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
              {isMobile ? '' : 'Добавить'}
            </Button>
          }
          sx={{
            '& .MuiCardHeader-action': {
              alignSelf: 'center',
            },
          }}
        />
        <CardContent>
          {profiles.length > 0 ? (
            <Stack spacing={1.5}>
              {profiles.map((profile) => (
                <ProfileItem key={profile.id}>
                  <Box flex={1} minWidth={0}>
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.5}>
                      <Typography variant="body2" fontWeight={600}>
                        {profile.method}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">•</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {profile.teaware}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                      <Chip
                        size="small"
                        label={`${profile.temperature}`}
                        sx={{ height: 22, fontSize: '0.75rem' }}
                      />
                      <Chip
                        size="small"
                        label={`${profile.brew_time}`}
                        sx={{ height: 22, fontSize: '0.75rem' }}
                      />
                      <Chip
                        size="small"
                        label={`${profile.weight}`}
                        sx={{ height: 22, fontSize: '0.75rem' }}
                      />
                      {!isMobile && (
                        <Chip
                          size="small"
                          label={profile.is_active ? 'Активен' : 'Неактивен'}
                          color={profile.is_active ? 'success' : 'default'}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                    {profile.note && !isMobile && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {profile.note}
                      </Typography>
                    )}
                  </Box>

                  <Stack direction="row" spacing={0.5} flexShrink={0}>
                    <IconButton
                      size="small"
                      onClick={() => openEditDialog(profile)}
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
                      onClick={() => handleDelete(profile)}
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
                </ProfileItem>
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
              <CoffeeMakerTwoToneIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography color="text.secondary" gutterBottom>
                Профили заваривания не добавлены
              </Typography>
              <Button
                startIcon={<AddTwoToneIcon />}
                onClick={openAddDialog}
                size="small"
                sx={{ mt: 1 }}
              >
                Добавить профиль
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
            {editingProfile ? 'Редактировать профиль' : 'Добавить профиль заваривания'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Метод"
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                placeholder="Пролив"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Посуда"
                value={formData.teaware}
                onChange={(e) => setFormData({ ...formData, teaware: e.target.value })}
                placeholder="Гайвань 150 мл"
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Температура"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                placeholder="95°C"
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Время заваривания"
                value={formData.brew_time}
                onChange={(e) => setFormData({ ...formData, brew_time: e.target.value })}
                placeholder="10-15 сек"
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Вес"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="7 г"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Заметка"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Дополнительные рекомендации..."
                multiline
                rows={2}
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
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ProductBrewProfilesCard;
