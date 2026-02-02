// ================== AUTH ==================
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface UserProfile {
  id: string;
  telegramId: number | null;
  email: string | null;
  firstName: string;
  lastName: string | null;
  username: string | null;
  languageCode: string | null;
  photoUrl: string | null;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user: UserProfile;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ================== PRODUCTS ==================
export interface ProductVariant {
  id: string;
  weight: string;
  price: string;
  is_active: boolean;
  sort_order: number;
}

export interface BrewProfile {
  id: number;
  method: string;
  teaware: string;
  temperature: string;
  brew_time: string;
  weight: string;
  note: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ProductImageVariant {
  id: number;
  variant: 'original' | 'thumb' | 'md' | 'lg';
  format: 'jpg' | 'jpeg' | 'png' | 'webp';
  storage_key: string;
  width: number;
  height: number;
}

export interface ProductImage {
  id: number;
  title: string;
  is_active: boolean;
  sort_order: number;
  variants: ProductImageVariant[];
}

export interface AttributeValue {
  id: number;
  name: string;
  slug: string;
}

export interface ProductAttribute {
  id: number;
  code: string;
  name: string;
  values: AttributeValue[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category_slug: string;
  image: string;
  product_type_code: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sort_order: number;
  variants: ProductVariant[];
  brew_profiles: BrewProfile[];
  images: ProductImage[];
  attribute_values: ProductAttribute[];
}

export interface ProductList {
  total: number;
  items: Product[];
}

export interface ProductCreate {
  id: string;
  name: string;
  description?: string;
  category_slug: string;
  image?: string;
  product_type_code: string;
  tags?: string[];
  is_active?: boolean;
}

export interface ProductUpdate {
  name?: string;
  description?: string;
  category_slug?: string;
  image?: string;
  product_type_code?: string;
  tags?: string[];
  is_active?: boolean;
  sort_order?: number;
}

export interface VariantCreate {
  id: string;
  weight: string;
  price: string | number;
  is_active?: boolean;
  sort_order?: number;
}

export interface VariantUpdate {
  weight?: string;
  price?: string | number;
  is_active?: boolean;
  sort_order?: number;
}

// ================== CATEGORIES ==================
export interface Category {
  slug: string;
  label: string;
  sort_order: number;
}

export interface CategoryCreate {
  slug: string;
  label: string;
  sort_order?: number;
}

export interface CategoryUpdate {
  label?: string;
  sort_order?: number;
}

// ================== ORDERS ==================
export type OrderStatus = 'created' | 'processing' | 'paid' | 'fulfilled' | 'cancelled';
export type DeliveryMethod = 'pickup' | 'courier' | 'cdek';

export interface OrderItem {
  product_id: string;
  variant_id: string;
  quantity: number;
  price: string;
  total: string;
  product_name: string;
  variant_weight: string;
  image: string;
}

export interface Order {
  id: string;
  customer_name: string;
  phone: string;
  user_id: number | null;
  delivery: DeliveryMethod;
  address: string | null;
  comment: string | null;
  total: string;
  status: OrderStatus;
  created_at: string | null;
  items: OrderItem[];
}

export interface OrderList {
  total: number;
  items: Order[];
}

export interface OrderUpdate {
  customer_name?: string;
  phone?: string;
  delivery?: DeliveryMethod;
  address?: string;
  comment?: string;
}

export interface OrderStatusUpdate {
  status: OrderStatus;
}

// ================== USERS ==================
export interface User {
  id: number;
  first_name: string;
  last_name: string | null;
  username: string | null;
  email: string | null;
  telegram_id: number | null;
  language_code: string | null;
  photo_url: string | null;
}

export interface UserList {
  total: number;
  items: User[];
}

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
  language_code?: string;
  photo_url?: string;
}

// ================== REVIEWS ==================
export type ReviewPlatform = 'yandex' | 'google' | 'telegram' | 'avito';

export interface Review {
  id: number;
  platform: ReviewPlatform;
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface ReviewCreate {
  platform: ReviewPlatform;
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface ReviewUpdate {
  platform?: ReviewPlatform;
  author?: string;
  rating?: number;
  text?: string;
  date?: string;
}

// ================== ATTRIBUTES ==================
export interface AttributeValueDetail {
  id: number;
  attribute_id: number;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
}

export interface AttributeDetail {
  id: number;
  code: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  kind: 'single' | 'multi' | 'bool' | 'range';
  ui_hint: 'chips' | 'radio' | 'toggle' | 'scale';
  values: AttributeValueDetail[];
  product_type_codes?: string[];
}

// ================== API RESPONSES ==================
export interface ErrorResponse {
  message: string;
  code?: string;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}
