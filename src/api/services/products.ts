import apiClient from '../client';
import {
  Product,
  ProductList,
  ProductCreate,
  ProductUpdate,
  VariantCreate,
  VariantUpdate,
  BrewProfile,
  AttributeDetail,
  SearchParams
} from '../../models';

export interface ProductsParams extends SearchParams {
  category_slug?: string;
  is_active?: boolean;
}

export const productsService = {
  // Products CRUD
  list: async (params?: ProductsParams): Promise<ProductList> => {
    const response = await apiClient.get<ProductList>('/v1/admin/products', { params });
    return response.data;
  },

  get: async (productId: string): Promise<Product> => {
    const response = await apiClient.get<Product>(`/v1/admin/products/${productId}`);
    return response.data;
  },

  create: async (data: ProductCreate): Promise<Product> => {
    const response = await apiClient.post<Product>('/v1/admin/products', data);
    return response.data;
  },

  update: async (productId: string, data: ProductUpdate): Promise<Product> => {
    const response = await apiClient.patch<Product>(`/v1/admin/products/${productId}`, data);
    return response.data;
  },

  delete: async (productId: string): Promise<void> => {
    await apiClient.delete(`/v1/admin/products/${productId}`);
  },

  setActive: async (productId: string, isActive: boolean): Promise<void> => {
    await apiClient.post(`/v1/admin/products/${productId}/active`, null, {
      params: { is_active: isActive }
    });
  },

  // Variants
  listVariants: async (productId: string): Promise<any[]> => {
    const response = await apiClient.get(`/v1/admin/products/${productId}/variants`);
    return response.data;
  },

  createVariant: async (productId: string, data: VariantCreate): Promise<any> => {
    const response = await apiClient.post(`/v1/admin/products/${productId}/variants`, data);
    return response.data;
  },

  updateVariant: async (productId: string, variantId: string, data: VariantUpdate): Promise<any> => {
    const response = await apiClient.patch(
      `/v1/admin/products/${productId}/variants/${variantId}`,
      data
    );
    return response.data;
  },

  deleteVariant: async (productId: string, variantId: string): Promise<void> => {
    await apiClient.delete(`/v1/admin/products/${productId}/variants/${variantId}`);
  },

  // Brew Profiles
  listBrewProfiles: async (productId: string): Promise<BrewProfile[]> => {
    const response = await apiClient.get(`/v1/admin/products/${productId}/brew-profiles`);
    return response.data;
  },

  createBrewProfile: async (productId: string, data: any): Promise<BrewProfile> => {
    const response = await apiClient.post(`/v1/admin/products/${productId}/brew-profiles`, data);
    return response.data;
  },

  updateBrewProfile: async (productId: string, profileId: number, data: any): Promise<BrewProfile> => {
    const response = await apiClient.patch(
      `/v1/admin/products/${productId}/brew-profiles/${profileId}`,
      data
    );
    return response.data;
  },

  deleteBrewProfile: async (productId: string, profileId: number): Promise<void> => {
    await apiClient.delete(`/v1/admin/products/${productId}/brew-profiles/${profileId}`);
  },

  // Attributes
  listAttributes: async (): Promise<AttributeDetail[]> => {
    const response = await apiClient.get('/v1/admin/products/attributes/list');
    return response.data;
  },

  setProductAttributes: async (productId: string, attributeValueIds: number[]): Promise<void> => {
    await apiClient.put(`/v1/admin/products/${productId}/attributes`, {
      attribute_value_ids: attributeValueIds
    });
  }
};
