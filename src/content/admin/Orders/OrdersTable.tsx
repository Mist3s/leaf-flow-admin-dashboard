import { FC, ChangeEvent, useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip,
  Divider,
  Box,
  FormControl,
  InputLabel,
  Card,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableContainer,
  Select,
  MenuItem,
  Typography,
  useTheme,
  CardHeader,
  TextField,
  InputAdornment,
  useMediaQuery,
  Stack
} from '@mui/material';
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';
import VisibilityTwoToneIcon from '@mui/icons-material/VisibilityTwoTone';
import Label from 'src/components/Label';
import { Order, OrderStatus } from 'src/models';

interface OrdersTableProps {
  orders: Order[];
}

const getStatusLabel = (status: OrderStatus): JSX.Element => {
  const map: Record<OrderStatus, { text: string; color: 'error' | 'success' | 'warning' | 'info' | 'primary' }> = {
    created: { text: 'Создан', color: 'info' },
    processing: { text: 'В обработке', color: 'warning' },
    paid: { text: 'Оплачен', color: 'primary' },
    fulfilled: { text: 'Выполнен', color: 'success' },
    cancelled: { text: 'Отменён', color: 'error' }
  };

  const { text, color } = map[status];
  return <Label color={color}>{text}</Label>;
};

const getDeliveryLabel = (delivery: string): string => {
  const map: Record<string, string> = {
    pickup: 'Самовывоз',
    courier: 'Курьер',
    cdek: 'СДЭК'
  };
  return map[delivery] || delivery;
};

const OrdersTable: FC<OrdersTableProps> = ({ orders }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedOrders = filteredOrders.slice(page * limit, page * limit + limit);

  // Mobile card view
  if (isMobile) {
    return (
      <Card>
        <CardHeader title="Заказы" sx={{ pb: 1 }} />
        <Box px={2} pb={2}>
          <Stack spacing={2}>
            <TextField
              size="small"
              placeholder="Поиск..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchTwoToneIcon />
                  </InputAdornment>
                )
              }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Статус</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Статус"
              >
                <MenuItem value="all">Все</MenuItem>
                <MenuItem value="created">Создан</MenuItem>
                <MenuItem value="processing">В обработке</MenuItem>
                <MenuItem value="paid">Оплачен</MenuItem>
                <MenuItem value="fulfilled">Выполнен</MenuItem>
                <MenuItem value="cancelled">Отменён</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>
        <Divider />
        <Box>
          {paginatedOrders.map((order) => (
            <Box
              key={order.id}
              sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                '&:last-child': { borderBottom: 'none' },
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => navigate(`/admin/orders/${order.id}`)}
            >
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Box>
                  <Typography variant="body1" fontWeight="bold">
                    #{order.id.slice(-8).toUpperCase()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.customer_name}
                  </Typography>
                </Box>
                <Typography variant="h6" color="primary.main">
                  {order.total} ₽
                </Typography>
              </Box>
              <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                {getStatusLabel(order.status)}
                <Label color="secondary">{getDeliveryLabel(order.delivery)}</Label>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {order.created_at && format(new Date(order.created_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                {' • '}
                {order.phone}
              </Typography>
            </Box>
          ))}
        </Box>
        <Box p={2}>
          <TablePagination
            component="div"
            count={filteredOrders.length}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => setLimit(parseInt(e.target.value))}
            page={page}
            rowsPerPage={limit}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="На странице:"
          />
        </Box>
      </Card>
    );
  }

  // Desktop table view
  return (
    <Card>
      <CardHeader
        action={
          <Box display="flex" gap={2}>
            <TextField
              size="small"
              placeholder="Поиск..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchTwoToneIcon />
                  </InputAdornment>
                )
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Статус</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Статус"
              >
                <MenuItem value="all">Все</MenuItem>
                <MenuItem value="created">Создан</MenuItem>
                <MenuItem value="processing">В обработке</MenuItem>
                <MenuItem value="paid">Оплачен</MenuItem>
                <MenuItem value="fulfilled">Выполнен</MenuItem>
                <MenuItem value="cancelled">Отменён</MenuItem>
              </Select>
            </FormControl>
          </Box>
        }
        title="Заказы"
      />
      <Divider />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>№ Заказа</TableCell>
              <TableCell>Клиент</TableCell>
              <TableCell>Телефон</TableCell>
              <TableCell>Доставка</TableCell>
              <TableCell align="right">Сумма</TableCell>
              <TableCell align="center">Статус</TableCell>
              <TableCell>Дата</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedOrders.map((order) => (
              <TableRow hover key={order.id}>
                <TableCell>
                  <Typography variant="body1" fontWeight="bold" noWrap>
                    #{order.id.slice(-8).toUpperCase()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body1" noWrap>
                    {order.customer_name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap>
                    {order.phone}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Label color="secondary">{getDeliveryLabel(order.delivery)}</Label>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body1" fontWeight="bold">
                    {order.total} ₽
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  {getStatusLabel(order.status)}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap>
                    {order.created_at && format(new Date(order.created_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Просмотреть" arrow>
                    <IconButton
                      sx={{
                        '&:hover': { background: theme.colors.primary.lighter },
                        color: theme.palette.primary.main
                      }}
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
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
          count={filteredOrders.length}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => setLimit(parseInt(e.target.value))}
          page={page}
          rowsPerPage={limit}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Строк на странице:"
        />
      </Box>
    </Card>
  );
};

export default OrdersTable;
