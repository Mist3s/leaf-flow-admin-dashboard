import apiClient from '../client';
import { Category, CategoryCreate, CategoryUpdate } from '../../models';

export const categoriesService = {
  list: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>('/v1/admin/categories');
    return response.data;
  },

  get: async (slug: string): Promise<Category> => {
    const response = await apiClient.get<Category>(`/v1/admin/categories/${slug}`);
    return response.data;
  },

  create: async (data: CategoryCreate): Promise<Category> => {
    const response = await apiClient.post<Category>('/v1/admin/categories', data);
    return response.data;
  },

  update: async (slug: string, data: CategoryUpdate): Promise<Category> => {
    const response = await apiClient.patch<Category>(`/v1/admin/categories/${slug}`, data);
    return response.data;
  },

  delete: async (slug: string): Promise<void> => {
    await apiClient.delete(`/v1/admin/categories/${slug}`);
  }
};
