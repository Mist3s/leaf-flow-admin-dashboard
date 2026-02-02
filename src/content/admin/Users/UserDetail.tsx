import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Container,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField
} from '@mui/material';
import ArrowBackTwoToneIcon from '@mui/icons-material/ArrowBackTwoTone';
import EmailTwoToneIcon from '@mui/icons-material/EmailTwoTone';
import TelegramIcon from '@mui/icons-material/Telegram';
import PersonTwoToneIcon from '@mui/icons-material/PersonTwoTone';
import LanguageIcon from '@mui/icons-material/Language';
import SaveTwoToneIcon from '@mui/icons-material/SaveTwoTone';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import { usersService } from 'src/api';
import { User, UserUpdate } from 'src/models';

function UserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UserUpdate>({});

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      try {
        const data = await usersService.get(parseInt(userId));
        setUser(data);
        setFormData({
          first_name: data.first_name,
          last_name: data.last_name || '',
          username: data.username || '',
          email: data.email || ''
        });
      } catch (err) {
        setError('Ошибка загрузки пользователя');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const handleSave = async () => {
    if (!userId || !user) return;
    setSaving(true);
    try {
      const updatedUser = await usersService.update(parseInt(userId), formData);
      setUser(updatedUser);
      setEditing(false);
    } catch (err) {
      setError('Ошибка сохранения');
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

  if (error || !user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Пользователь не найден'}</Alert>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`Пользователь #${user.id} - Leaf Flow Admin`}</title>
      </Helmet>
      <PageTitleWrapper>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackTwoToneIcon />}
            onClick={() => navigate('/admin/users')}
          >
            Назад
          </Button>
          <Typography variant="h3" component="h3">
            Пользователь #{user.id}
          </Typography>
        </Box>
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar
                  src={user.photo_url || undefined}
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                >
                  {user.first_name?.[0] || '?'}
                </Avatar>
                <Typography variant="h4" gutterBottom>
                  {user.first_name} {user.last_name || ''}
                </Typography>
                {user.username && (
                  <Typography variant="body1" color="text.secondary">
                    @{user.username}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader
                title="Информация"
                action={
                  !editing ? (
                    <Button variant="outlined" onClick={() => setEditing(true)}>
                      Редактировать
                    </Button>
                  ) : (
                    <Box display="flex" gap={1}>
                      <Button variant="outlined" onClick={() => setEditing(false)}>
                        Отмена
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<SaveTwoToneIcon />}
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? <CircularProgress size={20} /> : 'Сохранить'}
                      </Button>
                    </Box>
                  )
                }
              />
              <Divider />
              <CardContent>
                {editing ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Имя"
                        value={formData.first_name || ''}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Фамилия"
                        value={formData.last_name || ''}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Username"
                        value={formData.username || ''}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                ) : (
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <PersonTwoToneIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Полное имя"
                        secondary={`${user.first_name} ${user.last_name || ''}`}
                      />
                    </ListItem>
                    {user.email && (
                      <ListItem>
                        <ListItemIcon>
                          <EmailTwoToneIcon />
                        </ListItemIcon>
                        <ListItemText primary="Email" secondary={user.email} />
                      </ListItem>
                    )}
                    {user.telegram_id && (
                      <ListItem>
                        <ListItemIcon>
                          <TelegramIcon />
                        </ListItemIcon>
                        <ListItemText primary="Telegram ID" secondary={user.telegram_id} />
                      </ListItem>
                    )}
                    {user.username && (
                      <ListItem>
                        <ListItemIcon>
                          <PersonTwoToneIcon />
                        </ListItemIcon>
                        <ListItemText primary="Username" secondary={`@${user.username}`} />
                      </ListItem>
                    )}
                    {user.language_code && (
                      <ListItem>
                        <ListItemIcon>
                          <LanguageIcon />
                        </ListItemIcon>
                        <ListItemText primary="Язык" secondary={user.language_code} />
                      </ListItem>
                    )}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default UserDetail;
