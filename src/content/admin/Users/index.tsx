import { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Alert,
  IconButton,
  Tooltip,
  Avatar,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import VisibilityTwoToneIcon from '@mui/icons-material/VisibilityTwoTone';
import TelegramIcon from '@mui/icons-material/Telegram';
import EmailTwoToneIcon from '@mui/icons-material/EmailTwoTone';
import PageHeader from 'src/components/PageHeader';
import LoadingState from 'src/components/LoadingState';
import DataTable, { DataTableColumn, FilterOption } from 'src/components/DataTable';
import Label from 'src/components/Label';
import { usersService } from 'src/api';
import { User } from 'src/models';
import { ROUTES } from 'src/constants';

function UsersList() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await usersService.list({ limit: 100 });
      setUsers(response.items);
      setError('');
    } catch (err) {
      setError('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = 
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toString().includes(searchTerm);
      const matchesSource = 
        sourceFilter === 'all' || 
        (sourceFilter === 'telegram' && user.telegram_id) ||
        (sourceFilter === 'email' && user.email && !user.telegram_id);
      return matchesSearch && matchesSource;
    });
  }, [users, searchTerm, sourceFilter]);

  const sourceFilterOptions: FilterOption[] = [
    { value: 'all', label: 'Все источники' },
    { value: 'telegram', label: 'Telegram' },
    { value: 'email', label: 'Email' },
  ];

  const columns: DataTableColumn<User>[] = [
    {
      id: 'id',
      label: 'ID',
      render: (user) => (
        <Typography variant="body2" fontWeight={600} color="primary">
          #{user.id}
        </Typography>
      ),
    },
    {
      id: 'user',
      label: 'Пользователь',
      render: (user) => (
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar 
            src={user.photo_url || undefined}
            sx={{ 
              width: 40, 
              height: 40,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            }}
          >
            {user.first_name?.[0] || '?'}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {user.first_name} {user.last_name || ''}
            </Typography>
            {user.username && (
              <Typography variant="caption" color="text.secondary">
                @{user.username}
              </Typography>
            )}
          </Box>
        </Box>
      ),
    },
    {
      id: 'contacts',
      label: 'Контакты',
      hideOnMobile: true,
      render: (user) => (
        <Stack spacing={0.5}>
          {user.email && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <EmailTwoToneIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
              <Typography variant="caption">{user.email}</Typography>
            </Box>
          )}
          {user.telegram_id && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <TelegramIcon fontSize="small" sx={{ color: 'primary.main', fontSize: 16 }} />
              <Typography variant="caption">{user.telegram_id}</Typography>
            </Box>
          )}
        </Stack>
      ),
    },
    {
      id: 'source',
      label: 'Источник',
      render: (user) => (
        user.telegram_id ? (
          <Label color="info">Telegram</Label>
        ) : user.email ? (
          <Label color="primary">Email</Label>
        ) : (
          <Label color="warning">Неизвестно</Label>
        )
      ),
    },
    {
      id: 'actions',
      label: '',
      align: 'right',
      render: (user) => (
        <Tooltip title="Подробнее" arrow>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              navigate(ROUTES.USER_DETAIL(user.id));
            }}
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.2) },
            }}
          >
            <VisibilityTwoToneIcon fontSize="small" color="primary" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const renderMobileCard = (user: User) => (
    <Box>
      <Box display="flex" alignItems="center" gap={1.5} mb={1}>
        <Avatar 
          src={user.photo_url || undefined}
          sx={{ 
            width: 48, 
            height: 48,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
          }}
        >
          {user.first_name?.[0] || '?'}
        </Avatar>
        <Box flex={1}>
          <Typography variant="body1" fontWeight={600}>
            {user.first_name} {user.last_name || ''}
          </Typography>
          {user.username && (
            <Typography variant="caption" color="text.secondary">
              @{user.username}
            </Typography>
          )}
        </Box>
        <Typography variant="body2" fontWeight={600} color="primary">
          #{user.id}
        </Typography>
      </Box>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={1}>
          {user.telegram_id ? (
            <Label color="info">Telegram</Label>
          ) : user.email ? (
            <Label color="primary">Email</Label>
          ) : (
            <Label color="warning">Неизвестно</Label>
          )}
        </Stack>
        <IconButton
          size="small"
          onClick={() => navigate(ROUTES.USER_DETAIL(user.id))}
        >
          <VisibilityTwoToneIcon fontSize="small" color="primary" />
        </IconButton>
      </Box>
    </Box>
  );

  if (loading) {
    return <LoadingState message="Загрузка пользователей..." />;
  }

  return (
    <>
      <Helmet>
        <title>Пользователи - Leaf Flow Admin</title>
      </Helmet>
      <PageHeader
        title="Пользователи"
        subtitle="Управление пользователями системы"
      />
      <Container maxWidth="lg">
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        <DataTable
          title="Все пользователи"
          data={filteredUsers}
          columns={columns}
          keyExtractor={(user) => user.id}
          searchPlaceholder="Поиск по имени, username или email..."
          onSearch={setSearchTerm}
          filters={[
            {
              label: 'Источник',
              value: sourceFilter,
              options: sourceFilterOptions,
              onChange: setSourceFilter,
            },
          ]}
          renderMobileCard={renderMobileCard}
          onRowClick={(user) => navigate(ROUTES.USER_DETAIL(user.id))}
          emptyMessage="Пользователи не найдены"
        />
      </Container>
    </>
  );
}

export default UsersList;
