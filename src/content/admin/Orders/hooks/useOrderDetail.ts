import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersService } from 'src/api';
import { Order, OrderStatus, OrderUpdate } from 'src/models';
import { EditableItem } from '../components/OrderItemsCard';
import { ROUTES } from 'src/constants';

export function useOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Load order
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        const data = await ordersService.get(orderId);
        setOrder(data);
      } catch (err) {
        setError('Ошибка загрузки заказа');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  // Status change
  const handleStatusChange = useCallback(async (newStatus: OrderStatus) => {
    if (!orderId || !order) return;
    setUpdatingStatus(true);
    setError('');
    try {
      const updatedOrder = await ordersService.updateStatus(orderId, { status: newStatus });
      setOrder(updatedOrder);
      setSuccess('Статус обновлён');
    } catch (err) {
      setError('Ошибка обновления статуса');
    } finally {
      setUpdatingStatus(false);
    }
  }, [orderId, order]);

  // Update order details (customer, delivery)
  const handleUpdateOrder = useCallback(async (data: OrderUpdate) => {
    if (!orderId) return;
    setError('');
    try {
      const updatedOrder = await ordersService.update(orderId, data);
      setOrder(updatedOrder);
      setSuccess('Заказ сохранён');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения');
      throw err;
    }
  }, [orderId]);

  // Update order items
  const handleUpdateItems = useCallback(async (items: EditableItem[]) => {
    if (!orderId) return;
    setError('');
    try {
      const itemsToSave = items.map(item => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: item.price
      }));
      const updatedOrder = await ordersService.updateItems(orderId, itemsToSave);
      setOrder(updatedOrder);
      setSuccess('Состав заказа обновлён');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения состава заказа');
      throw err;
    }
  }, [orderId]);

  const handleBack = useCallback(() => {
    navigate(ROUTES.ORDERS);
  }, [navigate]);

  const clearError = useCallback(() => setError(''), []);
  const clearSuccess = useCallback(() => setSuccess(''), []);

  return {
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
  };
}
