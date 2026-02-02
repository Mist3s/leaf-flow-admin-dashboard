import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container, Alert } from '@mui/material';
import PageHeader from 'src/components/PageHeader';
import LoadingState from 'src/components/LoadingState';
import OrdersTable from './OrdersTable';
import { ordersService } from 'src/api';
import { Order } from 'src/models';
import { PAGINATION } from 'src/constants';

interface OrdersFilters {
  search: string;
  status: string;
}

function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(PAGINATION.DEFAULT_PAGE_SIZE);
  
  // Filters
  const [filters, setFilters] = useState<OrdersFilters>({
    search: '',
    status: 'all',
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      const params: any = {
        limit,
        offset: page * limit,
      };
      
      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.status !== 'all') {
        params.status = filters.status;
      }
      
      const response = await ordersService.list(params);
      setOrders(response.items);
      setTotal(response.total);
      setError('');
    } catch (err: any) {
      setError('Ошибка загрузки заказов');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleFiltersChange = useCallback((newFilters: OrdersFilters) => {
    setFilters(newFilters);
    setPage(0);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  }, []);

  if (loading && orders.length === 0) {
    return <LoadingState message="Загрузка заказов..." />;
  }

  return (
    <>
      <Helmet>
        <title>Заказы - Leaf Flow Admin</title>
      </Helmet>
      <PageHeader
        title="Заказы"
        subtitle="Управление заказами клиентов"
      />
      <Container maxWidth="lg">
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <OrdersTable 
          orders={orders}
          total={total}
          page={page}
          limit={limit}
          filters={filters}
          loading={loading}
          onFiltersChange={handleFiltersChange}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </Container>
    </>
  );
}

export default OrdersList;
