import { FC, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  Card,
  CardHeader,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
import LocalShippingTwoToneIcon from '@mui/icons-material/LocalShippingTwoTone';
import StorefrontTwoToneIcon from '@mui/icons-material/StorefrontTwoTone';
import Label from 'src/components/Label';
import { Order } from 'src/models';
import { ORDER_STATUS_CONFIG, DELIVERY_METHOD_CONFIG, ROUTES, PAGINATION } from 'src/constants';
import { formatDateTime, formatOrderId, formatPrice } from 'src/utils';

interface OrdersFilters {
  search: string;
  status: string;
}

interface OrdersTableProps {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  filters: OrdersFilters;
  loading: boolean;
  onFiltersChange: (filters: OrdersFilters) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

const OrdersTable: FC<OrdersTableProps> = ({
  orders,
  total,
  page,
  limit,
  filters,
  loading,
  onFiltersChange,
  onPageChange,
  onLimitChange,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      onFiltersChange({ ...filters, search: value });
    }, 300);
  }, [filters, onFiltersChange]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const statusOptions = [
    { value: 'all', label: 'Все статусы' },
    ...Object.entries(ORDER_STATUS_CONFIG).map(([value, config]) => ({
      value,
      label: config.label,
    })),
  ];

  const getDeliveryIcon = (delivery: string) => {
    switch (delivery) {
      case 'pickup':
        return <StorefrontTwoToneIcon fontSize="small" />;
      default:
        return <LocalShippingTwoToneIcon fontSize="small" />;
    }
  };

  const renderSkeleton = () => (
    <>
      {[...Array(limit)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton width={80} /></TableCell>
          <TableCell>
            <Box>
              <Skeleton width={120} height={20} />
              <Skeleton width={80} height={16} />
            </Box>
          </TableCell>
          <TableCell><Skeleton width={100} /></TableCell>
          <TableCell align="right"><Skeleton width={60} sx={{ ml: 'auto' }} /></TableCell>
          <TableCell align="center"><Skeleton width={80} sx={{ mx: 'auto' }} /></TableCell>
          <TableCell><Skeleton width={100} /></TableCell>
          <TableCell align="right"><Skeleton width={32} sx={{ ml: 'auto' }} /></TableCell>
        </TableRow>
      ))}
    </>
  );

  const renderMobileCard = (order: Order) => {
    const statusConfig = ORDER_STATUS_CONFIG[order.status];
    const deliveryConfig = DELIVERY_METHOD_CONFIG[order.delivery];

    return (
      <MobileCard key={order.id} onClick={() => navigate(ROUTES.ORDER_DETAIL(order.id))}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Box>
            <Typography variant="body1" fontWeight={600} color="primary">
              {formatOrderId(order.id)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {order.customer_name}
            </Typography>
          </Box>
          <Typography variant="h6" fontWeight={700} color="primary.main">
            {formatPrice(order.total)}
          </Typography>
        </Box>
        
        <Box display="flex" gap={1} flexWrap="wrap" mb={1.5}>
          <Label color={statusConfig?.color || 'info'}>
            {statusConfig?.label || order.status}
          </Label>
          <Chip
            icon={getDeliveryIcon(order.delivery)}
            label={deliveryConfig?.label || order.delivery}
            size="small"
            variant="outlined"
            sx={{ height: 24 }}
          />
        </Box>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {formatDateTime(order.created_at)} • {order.phone}
          </Typography>
          <IconButton size="small" color="primary">
            <VisibilityTwoToneIcon fontSize="small" />
          </IconButton>
        </Box>
      </MobileCard>
    );
  };

  return (
    <Card>
      <CardHeader
        title="Заказы"
        subheader={`Всего: ${total}`}
      />
      
      {/* Filters */}
      <Box sx={{ px: 2, pb: 2 }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <TextField
            size="small"
            placeholder="Поиск по номеру, имени или телефону..."
            defaultValue={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchTwoToneIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Статус</InputLabel>
            <Select
              value={filters.status}
              label="Статус"
              onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            >
              {statusOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {/* Table / Cards */}
      {isMobile ? (
        <Box>
          {loading ? (
            <Box p={2}>
              {[...Array(5)].map((_, i) => (
                <Box key={i} mb={2}>
                  <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1 }} />
                </Box>
              ))}
            </Box>
          ) : orders.length > 0 ? (
            orders.map(renderMobileCard)
          ) : (
            <Box p={4} textAlign="center">
              <Typography color="text.secondary">Заказы не найдены</Typography>
            </Box>
          )}
        </Box>
      ) : (
        <StyledTableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>№ Заказа</TableCell>
                <TableCell>Клиент</TableCell>
                <TableCell>Доставка</TableCell>
                <TableCell align="right">Сумма</TableCell>
                <TableCell align="center">Статус</TableCell>
                <TableCell>Дата</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? renderSkeleton() : orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow 
                    key={order.id}
                    onClick={() => navigate(ROUTES.ORDER_DETAIL(order.id))}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="primary">
                        {formatOrderId(order.id)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {order.customer_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.phone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getDeliveryIcon(order.delivery)}
                        label={DELIVERY_METHOD_CONFIG[order.delivery]?.label || order.delivery}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {formatPrice(order.total)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Label color={ORDER_STATUS_CONFIG[order.status]?.color || 'info'}>
                        {ORDER_STATUS_CONFIG[order.status]?.label || order.status}
                      </Label>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(order.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Подробнее" arrow>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(ROUTES.ORDER_DETAIL(order.id));
                          }}
                          sx={{
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.2) },
                          }}
                        >
                          <VisibilityTwoToneIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Заказы не найдены</Typography>
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
        onPageChange={(_, newPage) => onPageChange(newPage)}
        rowsPerPage={limit}
        onRowsPerPageChange={(e) => onLimitChange(parseInt(e.target.value))}
        rowsPerPageOptions={PAGINATION.PAGE_SIZE_OPTIONS}
        labelRowsPerPage="На странице:"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} из ${count}`}
      />
    </Card>
  );
};

export default OrdersTable;
