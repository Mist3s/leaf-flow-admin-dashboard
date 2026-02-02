import apiClient from '../client';
import { ACCESS_TOKEN_KEY } from '../config';

export const authService = {
  /**
   * Проверяет токен через запрос к админским категориям.
   * Если запрос успешен — токен валиден.
   */
  validateToken: async (token: string): Promise<boolean> => {
    try {
      // Временно устанавливаем токен для проверки
      const response = await apiClient.get('/v1/admin/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  },

  /**
   * Авторизация по статичному токену.
   * Проверяет токен через запрос к категориям.
   */
  login: async (token: string): Promise<boolean> => {
    const isValid = await authService.validateToken(token);
    if (isValid) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
      return true;
    }
    return false;
  },

  /**
   * Проверяет, есть ли сохранённый токен и валиден ли он.
   */
  checkAuth: async (): Promise<boolean> => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return false;
    return authService.validateToken(token);
  },

  /**
   * Выход из системы.
   */
  logout: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },

  /**
   * Получить текущий токен.
   */
  getToken: (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
};
