import apiClient from '../client';

export interface ProductImageResponse {
  id: number;
  product_id: string;
  title: string;
  is_active: boolean;
  sort_order: number;
  variants: {
    id: number;
    product_image_id: number;
    variant: 'original' | 'thumb' | 'md' | 'lg';
    format: 'jpg' | 'jpeg' | 'png' | 'webp';
    storage_key: string;
    width: number;
    height: number;
    byte_size: number;
  }[];
}

export const imagesService = {
  listProductImages: async (productId: string): Promise<ProductImageResponse[]> => {
    const response = await apiClient.get<ProductImageResponse[]>(
      `/v1/admin/images/products/${productId}/images`
    );
    return response.data;
  },

  uploadImage: async (productId: string, file: File, title?: string): Promise<ProductImageResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<ProductImageResponse>('/v1/admin/images', formData, {
      params: { product_id: productId, title: title || '' },
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getImage: async (imageId: number): Promise<ProductImageResponse> => {
    const response = await apiClient.get<ProductImageResponse>(`/v1/admin/images/${imageId}`);
    return response.data;
  },

  deleteImage: async (imageId: number): Promise<void> => {
    await apiClient.delete(`/v1/admin/images/${imageId}`);
  }
};
