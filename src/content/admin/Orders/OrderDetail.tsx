import { Helmet } from 'react-helmet-async';
import {
  Container,
  Grid,
  Typography,
  Box,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import PageHeader from 'src/components/PageHeader';
import LoadingState from 'src/components/LoadingState';
import {
  OrderStatusCard,
  OrderCustomerCard,
  OrderDeliveryCard,
  OrderItemsCard
} from './components';
import { useOrderDetail } from './hooks/useOrderDetail';
import { formatDateTime, formatOrderId } from 'src/utils';

function OrderDetail() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const {
    order,
    loading,
    error,
    success,
    updatingStatus,
    handleStatusChange,
    handleUpdateOrder,
    handleUpdateItems,
    handleBack,
    clearError,
    clearSuccess
  } = useOrderDetail();

  if (loading) {
    return <LoadingState message="Загрузка заказа..." />;
  }

  if (error && !order) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Заказ не найден'}</Alert>
      </Container>
    );
  }

  if (!order) {
    return null;
  }

  const orderItems = order.items.map(item => ({ ...item, isNew: false }));

  return (
    <>
      <Helmet>
        <title>{`Заказ ${formatOrderId(order.id)} - Leaf Flow Admin`}</title>
      </Helmet>

      <PageHeader
        title={`Заказ ${formatOrderId(order.id)}`}
        subtitle={formatDateTime(order.created_at)}
        backUrl="/admin/orders"
      />

      <Container maxWidth="lg">
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={clearSuccess}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3} direction={isMobile ? 'column-reverse' : 'row'}>
          <Grid item xs={12} md={8}>
            <OrderItemsCard
              items={orderItems}
              orderTotal={order.total}
              onSave={handleUpdateItems}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <OrderStatusCard
              status={order.status}
              updating={updatingStatus}
              onStatusChange={handleStatusChange}
            />

            <OrderCustomerCard
              order={order}
              onSave={handleUpdateOrder}
            />

            <OrderDeliveryCard
              order={order}
              onSave={handleUpdateOrder}
            />
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default OrderDetail;
