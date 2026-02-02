import apiClient from '../client';
import { Order, OrderList, OrderUpdate, OrderStatusUpdate, SearchParams } from '../../models';

export interface OrdersParams extends SearchParams {
  status?: string;
  user_id?: number;
}

export const ordersService = {
  list: async (params?: OrdersParams): Promise<OrderList> => {
    const response = await apiClient.get<OrderList>('/v1/admin/orders', { params });
    return response.data;
  },

  get: async (orderId: string): Promise<Order> => {
    const response = await apiClient.get<Order>(`/v1/admin/orders/${orderId}`);
    return response.data;
  },

  update: async (orderId: string, data: OrderUpdate): Promise<Order> => {
    const response = await apiClient.patch<Order>(`/v1/admin/orders/${orderId}`, data);
    return response.data;
  },

  updateStatus: async (orderId: string, data: OrderStatusUpdate): Promise<Order> => {
    const response = await apiClient.post<Order>(`/v1/admin/orders/${orderId}/status`, data);
    return response.data;
  },

  updateItems: async (orderId: string, items: any[]): Promise<Order> => {
    const response = await apiClient.put<Order>(`/v1/admin/orders/${orderId}/items`, { items });
    return response.data;
  }
};
