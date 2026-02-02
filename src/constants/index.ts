import { OrderStatus, DeliveryMethod, ReviewPlatform } from 'src/models';

// Order status configuration
export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: 'error' | 'success' | 'warning' | 'info' | 'primary' }
> = {
  created: { label: 'Создан', color: 'info' },
  processing: { label: 'В обработке', color: 'warning' },
  paid: { label: 'Оплачен', color: 'primary' },
  fulfilled: { label: 'Выполнен', color: 'success' },
  cancelled: { label: 'Отменён', color: 'error' },
};

// Delivery method configuration
export const DELIVERY_METHOD_CONFIG: Record<DeliveryMethod, { label: string }> = {
  pickup: { label: 'Самовывоз' },
  courier: { label: 'Курьер' },
  cdek: { label: 'СДЭК' },
};

// Review platform configuration
export const REVIEW_PLATFORM_CONFIG: Record<
  ReviewPlatform,
  { label: string; color: 'primary' | 'secondary' | 'success' | 'info' }
> = {
  yandex: { label: 'Яндекс', color: 'primary' },
  google: { label: 'Google', color: 'info' },
  telegram: { label: 'Telegram', color: 'secondary' },
  avito: { label: 'Авито', color: 'success' },
};

// Product type configuration
export const PRODUCT_TYPE_CONFIG: Record<string, { label: string }> = {
  tea: { label: 'Чай' },
  teaware: { label: 'Посуда' },
  accessory: { label: 'Аксессуары' },
  set: { label: 'Набор' },
  certificate: { label: 'Сертификат' },
};

// Attribute kind configuration
export const ATTRIBUTE_KIND_CONFIG: Record<string, { label: string }> = {
  single: { label: 'Одиночный выбор' },
  multi: { label: 'Множественный выбор' },
  bool: { label: 'Да/Нет' },
  range: { label: 'Диапазон' },
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10 as number,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50] as number[],
};

// Routes
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/admin/dashboard',
  PRODUCTS: '/admin/products',
  PRODUCT_CREATE: '/admin/products/create',
  PRODUCT_EDIT: (id: string) => `/admin/products/${id}`,
  ORDERS: '/admin/orders',
  ORDER_DETAIL: (id: string) => `/admin/orders/${id}`,
  CATEGORIES: '/admin/categories',
  USERS: '/admin/users',
  USER_DETAIL: (id: number) => `/admin/users/${id}`,
  REVIEWS: '/admin/reviews',
} as const;

// Unified styling constants
// MUI theme spacing multiplier is 8px, so borderRadius: 1.5 = 12px
export const STYLES = {
  // Border radius values (in theme.spacing units)
  borderRadius: {
    sm: 1,      // 8px - for small elements like chips, badges
    md: 1.5,    // 12px - for buttons, inputs, small cards
    lg: 2,      // 16px - for cards, dialogs
    xl: 3,      // 24px - for large containers
  },
  // Transition duration
  transition: {
    fast: '0.15s',
    normal: '0.2s',
    slow: '0.3s',
  },
  // Opacity for hover/dividers
  opacity: {
    divider: 0.08,     // For subtle dividers
    hoverBg: 0.02,     // For hover backgrounds
    activeBg: 0.05,    // For active/pressed states
  },
} as const;
