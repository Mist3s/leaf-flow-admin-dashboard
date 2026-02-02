export { default as apiClient } from './client';
export * from './config';

// Services
export { authService } from './services/auth';
export { productsService } from './services/products';
export { ordersService } from './services/orders';
export { categoriesService } from './services/categories';
export { usersService } from './services/users';
export { reviewsService } from './services/reviews';
export { imagesService } from './services/images';

// Types
export type { ProductsParams } from './services/products';
export type { OrdersParams } from './services/orders';
export type { UsersParams } from './services/users';
