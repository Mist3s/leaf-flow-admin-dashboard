import { ACCESS_TOKEN_KEY } from '../api/config';

/**
 * Извлекает ID текущего администратора из JWT-токена.
 * Возвращает null, если токен отсутствует или невалиден.
 */
export function getCurrentAdminId(): number | null {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return parseInt(payload.sub, 10);
    } catch {
        return null;
    }
}
