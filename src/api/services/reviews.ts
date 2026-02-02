import apiClient from '../client';
import { Review, ReviewCreate, ReviewUpdate } from '../../models';

export const reviewsService = {
  list: async (): Promise<Review[]> => {
    const response = await apiClient.get<Review[]>('/v1/admin/reviews');
    return response.data;
  },

  get: async (reviewId: number): Promise<Review> => {
    const response = await apiClient.get<Review>(`/v1/admin/reviews/${reviewId}`);
    return response.data;
  },

  create: async (data: ReviewCreate): Promise<Review> => {
    const response = await apiClient.post<Review>('/v1/admin/reviews', data);
    return response.data;
  },

  update: async (reviewId: number, data: ReviewUpdate): Promise<Review> => {
    const response = await apiClient.patch<Review>(`/v1/admin/reviews/${reviewId}`, data);
    return response.data;
  },

  delete: async (reviewId: number): Promise<void> => {
    await apiClient.delete(`/v1/admin/reviews/${reviewId}`);
  }
};
