import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Product } from 'src/models';

const MEDIA_BASE_URL = 'https://app.zavarka39.ru';

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

/**
 * Get product thumbnail URL.
 * Prefers images[].variants with variant="thumb", falls back to product.image.
 * Prepends base domain if the path is relative.
 */
export function getProductThumbUrl(product: Product): string | undefined {
  // Try to find thumb variant in images
  if (product.images && product.images.length > 0) {
    for (const img of product.images) {
      const thumb = img.variants?.find(v => v.variant === 'thumb');
      if (thumb?.storage_key) {
        return prependMediaUrl(thumb.storage_key);
      }
    }
    // If no thumb variant found, try first image's first variant
    const firstVariant = product.images[0]?.variants?.[0];
    if (firstVariant?.storage_key) {
      return prependMediaUrl(firstVariant.storage_key);
    }
  }

  // Fallback to product.image
  if (product.image) {
    return prependMediaUrl(product.image);
  }

  return undefined;
}

/**
 * Prepend media base domain to a relative path.
 * Returns the path unchanged if it's already an absolute URL.
 */
export function prependMediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${MEDIA_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
