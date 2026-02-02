import { useState, useEffect, useCallback, useRef } from 'react';
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
  Card,
  CardHeader,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  InputAdornment,
  useTheme,
  useMediaQuery,
  alpha,
  Skeleton
} from '@mui/material';
import { StyledTableContainer, MobileCard } from 'src/components/StyledTable';
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';
import VisibilityTwoToneIcon from '@mui/icons-material/VisibilityTwoTone';
import TelegramIcon from '@mui/icons-material/Telegram';
import EmailTwoToneIcon from '@mui/icons-material/EmailTwoTone';
import PageHeader from 'src/components/PageHeader';
import LoadingState from 'src/components/LoadingState';
import Label from 'src/components/Label';
import { usersService } from 'src/api';
import { User } from 'src/models';
import { ROUTES, PAGINATION } from 'src/constants';

function UsersList() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(PAGINATION.DEFAULT_PAGE_SIZE);
  
  // Search
  const [search, setSearch] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      const params: any = {
        limit,
        offset: page * limit,
      };
      
      if (search) {
        params.search = search;
      }
      
      const response = await usersService.list(params);
      setUsers(response.items);
      setTotal(response.total);
      setError('');
    } catch (err) {
      setError('Ошибка загрузки пользователей');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearch(value);
      setPage(0);
    }, 300);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  }, []);

  const renderSkeleton = () => (
    <>
      {[...Array(limit)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton width={40} /></TableCell>
          <TableCell>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box>
                <Skeleton width={120} height={20} />
                <Skeleton width={80} height={16} />
              </Box>
            </Box>
          </TableCell>
          <TableCell>
            <Skeleton width={150} height={16} />
            <Skeleton width={100} height={16} />
          </TableCell>
          <TableCell><Skeleton width={80} /></TableCell>
          <TableCell align="right"><Skeleton width={32} sx={{ ml: 'auto' }} /></TableCell>
        </TableRow>
      ))}
    </>
  );

  const renderMobileCard = (user: User) => (
    <MobileCard key={user.id} onClick={() => navigate(ROUTES.USER_DETAIL(user.id))}>
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
        <IconButton size="small" onClick={() => navigate(ROUTES.USER_DETAIL(user.id))}>
          <VisibilityTwoToneIcon fontSize="small" color="primary" />
        </IconButton>
      </Box>
    </MobileCard>
  );

  if (loading && users.length === 0) {
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
        
        <Card>
          <CardHeader
            title="Все пользователи"
            subheader={`Всего: ${total}`}
          />
          
          {/* Search */}
          <Box sx={{ px: 2, pb: 2 }}>
            <TextField
              size="small"
              placeholder="Поиск по имени, username или email..."
              defaultValue={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchTwoToneIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300, maxWidth: 400 }}
            />
          </Box>

          {/* Table / Cards */}
          {isMobile ? (
            <Box>
              {loading ? (
                <Box p={2}>
                  {[...Array(5)].map((_, i) => (
                    <Box key={i} mb={2}>
                      <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
                    </Box>
                  ))}
                </Box>
              ) : users.length > 0 ? (
                users.map(renderMobileCard)
              ) : (
                <Box p={4} textAlign="center">
                  <Typography color="text.secondary">Пользователи не найдены</Typography>
                </Box>
              )}
            </Box>
          ) : (
            <StyledTableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Пользователь</TableCell>
                    <TableCell>Контакты</TableCell>
                    <TableCell>Источник</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? renderSkeleton() : users.length > 0 ? (
                    users.map((user) => (
                      <TableRow 
                        key={user.id}
                        onClick={() => navigate(ROUTES.USER_DETAIL(user.id))}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="primary">
                            #{user.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>
                          {user.telegram_id ? (
                            <Label color="info">Telegram</Label>
                          ) : user.email ? (
                            <Label color="primary">Email</Label>
                          ) : (
                            <Label color="warning">Неизвестно</Label>
                          )}
                        </TableCell>
                        <TableCell align="right">
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
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">Пользователи не найдены</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </StyledTableContainer>
          )}

          {/* Pagination */}
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => handlePageChange(newPage)}
            rowsPerPage={limit}
            onRowsPerPageChange={(e) => handleLimitChange(parseInt(e.target.value))}
            rowsPerPageOptions={PAGINATION.PAGE_SIZE_OPTIONS}
            labelRowsPerPage="На странице:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} из ${count}`}
          />
        </Card>
      </Container>
    </>
  );
}

export default UsersList;
