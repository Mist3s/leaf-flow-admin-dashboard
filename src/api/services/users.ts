import apiClient from '../client';
import { User, UserList, UserUpdate } from '../../models';

interface UsersParams {
  search?: string;
  limit?: number;
  offset?: number;
}

export const usersService = {
  list: async (params?: UsersParams): Promise<UserList> => {
    const response = await apiClient.get<UserList>('/v1/admin/users', { params });
    return response.data;
  },

  get: async (userId: number): Promise<User> => {
    const response = await apiClient.get<User>(`/v1/admin/users/${userId}`);
    return response.data;
  },

  update: async (userId: number, data: UserUpdate): Promise<User> => {
    const response = await apiClient.patch<User>(`/v1/admin/users/${userId}`, data);
    return response.data;
  }
};
