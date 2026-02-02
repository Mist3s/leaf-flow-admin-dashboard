import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Format date to Russian locale
 */
export function formatDate(date: string | Date | null, formatStr = 'dd MMM yyyy'): string {
  if (!date) return '-';
  try {
    return format(new Date(date), formatStr, { locale: ru });
  } catch {
    return '-';
  }
}

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date | null): string {
  return formatDate(date, 'dd MMM yyyy HH:mm');
}

/**
 * Format price in rubles
 */
export function formatPrice(price: string | number | null): string {
  if (price === null || price === undefined) return '-';
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `${numPrice.toLocaleString('ru-RU')} ₽`;
}

/**
 * Format order ID to short format
 */
export function formatOrderId(orderId: string): string {
  return `#${orderId.slice(-8).toUpperCase()}`;
}

/**
 * Format phone number
 */
export function formatPhone(phone: string): string {
  // Simple pass-through for now, could be enhanced
  return phone;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}
