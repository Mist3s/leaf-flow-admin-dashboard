import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Container,
  Grid,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import OrdersTable from './OrdersTable';
import { ordersService } from 'src/api';
import { Order } from 'src/models';

function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersService.list({ limit: 100 });
      setOrders(response.items);
      setError('');
    } catch (err: any) {
      setError('Ошибка загрузки заказов');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <>
      <Helmet>
        <title>Заказы - Leaf Flow Admin</title>
      </Helmet>
      <PageTitleWrapper>
        <Box>
          <Typography variant="h3" component="h3" gutterBottom>
            Заказы
          </Typography>
          <Typography variant="subtitle2">
            Управление заказами клиентов
          </Typography>
        </Box>
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {loading ? (
              <Box display="flex" justifyContent="center" py={5}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <OrdersTable orders={orders} />
            )}
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default OrdersList;
