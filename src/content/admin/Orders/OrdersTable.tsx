import { FC, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Avatar,
  Chip,
  useTheme
} from '@mui/material';
import VisibilityTwoToneIcon from '@mui/icons-material/VisibilityTwoTone';
import LocalShippingTwoToneIcon from '@mui/icons-material/LocalShippingTwoTone';
import StorefrontTwoToneIcon from '@mui/icons-material/StorefrontTwoTone';
import Label from 'src/components/Label';
import DataTable, { DataTableColumn, FilterOption } from 'src/components/DataTable';
import { Order, OrderStatus } from 'src/models';
import { ORDER_STATUS_CONFIG, DELIVERY_METHOD_CONFIG, ROUTES } from 'src/constants';
import { formatDateTime, formatOrderId, formatPrice } from 'src/utils';

interface OrdersTableProps {
  orders: Order[];
}

const OrdersTable: FC<OrdersTableProps> = ({ orders }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone.includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const statusFilterOptions: FilterOption[] = [
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

  const columns: DataTableColumn<Order>[] = [
    {
      id: 'id',
      label: '№ Заказа',
      render: (order) => (
        <Typography variant="body2" fontWeight={600} color="primary">
          {formatOrderId(order.id)}
        </Typography>
      ),
    },
    {
      id: 'customer',
      label: 'Клиент',
      render: (order) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {order.customer_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {order.phone}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'delivery',
      label: 'Доставка',
      hideOnMobile: true,
      render: (order) => (
        <Chip
          icon={getDeliveryIcon(order.delivery)}
          label={DELIVERY_METHOD_CONFIG[order.delivery]?.label || order.delivery}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      id: 'total',
      label: 'Сумма',
      align: 'right',
      render: (order) => (
        <Typography variant="body2" fontWeight={600}>
          {formatPrice(order.total)}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Статус',
      align: 'center',
      render: (order) => {
        const config = ORDER_STATUS_CONFIG[order.status];
        return (
          <Label color={config?.color || 'info'}>
            {config?.label || order.status}
          </Label>
        );
      },
    },
    {
      id: 'date',
      label: 'Дата',
      hideOnMobile: true,
      render: (order) => (
        <Typography variant="caption" color="text.secondary">
          {formatDateTime(order.created_at)}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: '',
      align: 'right',
      render: (order) => (
        <Tooltip title="Подробнее" arrow>
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              navigate(ROUTES.ORDER_DETAIL(order.id));
            }}
            sx={{
              backgroundColor: theme.palette.primary.main + '10',
              '&:hover': {
                backgroundColor: theme.palette.primary.main + '20',
              },
            }}
          >
            <VisibilityTwoToneIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const renderMobileCard = (order: Order) => {
    const statusConfig = ORDER_STATUS_CONFIG[order.status];
    const deliveryConfig = DELIVERY_METHOD_CONFIG[order.delivery];

    return (
      <Box>
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
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              navigate(ROUTES.ORDER_DETAIL(order.id));
            }}
          >
            <VisibilityTwoToneIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    );
  };

  return (
    <DataTable
      title="Заказы"
      data={filteredOrders}
      columns={columns}
      keyExtractor={(order) => order.id}
      searchPlaceholder="Поиск по номеру, имени или телефону..."
      onSearch={setSearchTerm}
      filters={[
        {
          label: 'Статус',
          value: statusFilter,
          options: statusFilterOptions,
          onChange: setStatusFilter,
        },
      ]}
      renderMobileCard={renderMobileCard}
      onRowClick={(order) => navigate(ROUTES.ORDER_DETAIL(order.id))}
      emptyMessage="Заказы не найдены"
    />
  );
};

export default OrdersTable;
