import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardHeader,
  Divider,
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
  TablePagination,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Avatar,
  useTheme
} from '@mui/material';
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';
import VisibilityTwoToneIcon from '@mui/icons-material/VisibilityTwoTone';
import TelegramIcon from '@mui/icons-material/Telegram';
import EmailTwoToneIcon from '@mui/icons-material/EmailTwoTone';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import Label from 'src/components/Label';
import { usersService } from 'src/api';
import { User } from 'src/models';

function UsersList() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersService.list({
        search: searchTerm || undefined,
        limit,
        offset: page * limit
      });
      setUsers(response.items);
      setTotal(response.total);
      setError('');
    } catch (err) {
      setError('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit, searchTerm]);

  return (
    <>
      <Helmet>
        <title>Пользователи - Leaf Flow Admin</title>
      </Helmet>
      <PageTitleWrapper>
        <Box>
          <Typography variant="h3" component="h3" gutterBottom>
            Пользователи
          </Typography>
          <Typography variant="subtitle2">
            Управление пользователями системы
          </Typography>
        </Box>
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Card>
              <CardHeader
                title="Все пользователи"
                action={
                  <TextField
                    size="small"
                    placeholder="Поиск..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(0);
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchTwoToneIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                }
              />
              <Divider />
              {loading ? (
                <Box display="flex" justifyContent="center" py={5}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>ID</TableCell>
                          <TableCell>Пользователь</TableCell>
                          <TableCell>Контакты</TableCell>
                          <TableCell>Источник</TableCell>
                          <TableCell align="right">Действия</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow hover key={user.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                #{user.id}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={2}>
                                <Avatar src={user.photo_url || undefined}>
                                  {user.first_name?.[0] || '?'}
                                </Avatar>
                                <Box>
                                  <Typography variant="body1" fontWeight="bold">
                                    {user.first_name} {user.last_name || ''}
                                  </Typography>
                                  {user.username && (
                                    <Typography variant="body2" color="text.secondary">
                                      @{user.username}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" flexDirection="column" gap={0.5}>
                                {user.email && (
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <EmailTwoToneIcon fontSize="small" color="action" />
                                    <Typography variant="body2">{user.email}</Typography>
                                  </Box>
                                )}
                                {user.telegram_id && (
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <TelegramIcon fontSize="small" color="primary" />
                                    <Typography variant="body2">{user.telegram_id}</Typography>
                                  </Box>
                                )}
                              </Box>
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
                                  sx={{
                                    '&:hover': { background: theme.colors.primary.lighter },
                                    color: theme.palette.primary.main
                                  }}
                                  onClick={() => navigate(`/admin/users/${user.id}`)}
                                  size="small"
                                >
                                  <VisibilityTwoToneIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box p={2}>
                    <TablePagination
                      component="div"
                      count={total}
                      onPageChange={(_, newPage) => setPage(newPage)}
                      onRowsPerPageChange={(e) => {
                        setLimit(parseInt(e.target.value));
                        setPage(0);
                      }}
                      page={page}
                      rowsPerPage={limit}
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      labelRowsPerPage="Строк на странице:"
                    />
                  </Box>
                </>
              )}
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default UsersList;
