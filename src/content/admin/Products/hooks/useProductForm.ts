import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productsService, categoriesService, imagesService } from 'src/api';
import { ProductImageResponse } from 'src/api/services/images';
import {
  Category,
  ProductCreate,
  ProductUpdate,
  VariantCreate,
  VariantUpdate,
  BrewProfile,
  BrewProfileCreate,
  BrewProfileUpdate,
  AttributeDetail
} from 'src/models';
import { LocalVariant } from '../components/ProductVariantsCard';
import { ROUTES } from 'src/constants';

interface ProductFormData {
  id: string;
  name: string;
  description: string;
  category_slug: string;
  product_type_code: string;
  tags: string[];
  is_active: boolean;
  sort_order: number;
}

const initialFormData: ProductFormData = {
  id: '',
  name: '',
  description: '',
  category_slug: '',
  product_type_code: 'tea',
  tags: [],
  is_active: false,
  sort_order: 0
};

export function useProductForm() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const isEdit = !!productId;

  // State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [variants, setVariants] = useState<LocalVariant[]>([]);
  const [brewProfiles, setBrewProfiles] = useState<BrewProfile[]>([]);
  const [images, setImages] = useState<ProductImageResponse[]>([]);
  const [newTag, setNewTag] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [allAttributes, setAllAttributes] = useState<AttributeDetail[]>([]);
  const [selectedAttributeValues, setSelectedAttributeValues] = useState<number[]>([]);
  const [savingAttributes, setSavingAttributes] = useState(false);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cats, attrs] = await Promise.all([
          categoriesService.list(),
          productsService.listAttributes()
        ]);
        setCategories(cats);
        setAllAttributes(attrs);

        if (isEdit && productId) {
          const product = await productsService.get(productId);
          setFormData({
            id: product.id,
            name: product.name,
            description: product.description,
            category_slug: product.category_slug,
            product_type_code: product.product_type_code,
            tags: product.tags,
            is_active: product.is_active,
            sort_order: product.sort_order
          });
          setVariants(product.variants.map(v => ({
            ...v,
            isNew: false,
            isModified: false,
            isDeleted: false
          })));

          setBrewProfiles(product.brew_profiles || []);

          if (product.attribute_values) {
            const selectedIds: number[] = [];
            product.attribute_values.forEach(attr => {
              attr.values.forEach(val => {
                selectedIds.push(val.id);
              });
            });
            setSelectedAttributeValues(selectedIds);
          }

          try {
            const productImages = await imagesService.listProductImages(productId);
            setImages(productImages);
          } catch {
            // Images might not exist yet
          }
        }
      } catch (err) {
        setError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isEdit, productId]);

  // All attributes (no client-side filtering by product type)
  const filteredAttributes = allAttributes;

  // Form field handlers
  const handleFieldChange = useCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  }, []);

  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  }, [newTag, formData.tags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  }, []);

  const handleActiveChange = useCallback((checked: boolean) => {
    setFormData(prev => ({ ...prev, is_active: checked }));
  }, []);

  const handleSortOrderChange = useCallback((value: number) => {
    setFormData(prev => ({ ...prev, sort_order: value }));
  }, []);

  // Variant handlers
  const handleAddVariant = useCallback(async (variantData: {
    id: string;
    weight: string;
    price: string;
    is_active: boolean;
    sort_order: number;
  }) => {
    try {
      if (isEdit && productId) {
        const createData: VariantCreate = {
          id: variantData.id,
          weight: variantData.weight,
          price: variantData.price,
          is_active: variantData.is_active,
          sort_order: variantData.sort_order
        };
        await productsService.createVariant(productId, createData);
        setVariants(prev => [...prev, { ...variantData, isNew: false, isModified: false, isDeleted: false }]);
        setSuccess('Вариант добавлен');
      } else {
        setVariants(prev => [...prev, { ...variantData, isNew: true, isModified: false, isDeleted: false }]);
      }
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка добавления варианта');
    }
  }, [isEdit, productId]);

  const handleEditVariant = useCallback(async (variant: LocalVariant, variantData: {
    id: string;
    weight: string;
    price: string;
    is_active: boolean;
    sort_order: number;
  }) => {
    try {
      if (isEdit && productId && !variant.isNew) {
        const updateData: VariantUpdate = {
          weight: variantData.weight,
          price: variantData.price,
          is_active: variantData.is_active,
          sort_order: variantData.sort_order
        };
        await productsService.updateVariant(productId, variant.id, updateData);
        setSuccess('Вариант обновлён');
      }
      setVariants(prev => prev.map(v =>
        v.id === variant.id ? { ...v, ...variantData, isModified: false } : v
      ));
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка обновления варианта');
    }
  }, [isEdit, productId]);

  const handleDeleteVariant = useCallback(async (variant: LocalVariant) => {
    try {
      if (isEdit && productId && !variant.isNew) {
        await productsService.deleteVariant(productId, variant.id);
        setSuccess('Вариант удалён');
      }
      setVariants(prev => prev.filter(v => v.id !== variant.id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления варианта');
    }
  }, [isEdit, productId]);

  // Brew Profile handlers
  const handleAddBrewProfile = useCallback(async (data: {
    method: string;
    teaware: string;
    temperature: string;
    brew_time: string;
    weight: string;
    note: string;
    sort_order: number;
    is_active: boolean;
  }) => {
    if (!productId) return;
    try {
      const createData: BrewProfileCreate = {
        method: data.method,
        teaware: data.teaware,
        temperature: data.temperature,
        brew_time: data.brew_time,
        weight: data.weight,
        note: data.note || null,
        sort_order: data.sort_order,
        is_active: data.is_active
      };
      const created = await productsService.createBrewProfile(productId, createData);
      setBrewProfiles(prev => [...prev, created]);
      setSuccess('Профиль заваривания добавлен');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка добавления профиля заваривания');
    }
  }, [productId]);

  const handleEditBrewProfile = useCallback(async (profile: BrewProfile, data: {
    method: string;
    teaware: string;
    temperature: string;
    brew_time: string;
    weight: string;
    note: string;
    sort_order: number;
    is_active: boolean;
  }) => {
    if (!productId) return;
    try {
      const updateData: BrewProfileUpdate = {
        method: data.method,
        teaware: data.teaware,
        temperature: data.temperature,
        brew_time: data.brew_time,
        weight: data.weight,
        note: data.note || null,
        sort_order: data.sort_order,
        is_active: data.is_active
      };
      const updated = await productsService.updateBrewProfile(productId, profile.id, updateData);
      setBrewProfiles(prev => prev.map(p => p.id === profile.id ? updated : p));
      setSuccess('Профиль заваривания обновлён');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка обновления профиля заваривания');
    }
  }, [productId]);

  const handleDeleteBrewProfile = useCallback(async (profile: BrewProfile) => {
    if (!productId) return;
    try {
      await productsService.deleteBrewProfile(productId, profile.id);
      setBrewProfiles(prev => prev.filter(p => p.id !== profile.id));
      setSuccess('Профиль заваривания удалён');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления профиля заваривания');
    }
  }, [productId]);

  // Image handlers
  const handleImageUpload = useCallback(async (files: FileList) => {
    const targetProductId = isEdit ? productId : formData.id;
    if (!targetProductId) {
      setError('Сначала сохраните продукт, затем добавляйте изображения');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      for (const file of Array.from(files)) {
        const uploaded = await imagesService.uploadImage(targetProductId, file, file.name);
        setImages(prev => [...prev, uploaded]);
      }
      setSuccess('Изображения загружены');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки изображений');
    } finally {
      setUploadingImage(false);
    }
  }, [isEdit, productId, formData.id]);

  const handleDeleteImage = useCallback(async (imageId: number) => {
    try {
      await imagesService.deleteImage(imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
      setSuccess('Изображение удалено');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления изображения');
    }
  }, []);

  // Attribute handlers
  const handleToggleAttributeValue = useCallback((valueId: number) => {
    setSelectedAttributeValues(prev => {
      if (prev.includes(valueId)) {
        return prev.filter(id => id !== valueId);
      }
      return [...prev, valueId];
    });
  }, []);

  const handleSaveAttributes = useCallback(async () => {
    if (!productId) return;
    setSavingAttributes(true);
    setError('');
    try {
      await productsService.setProductAttributes(productId, selectedAttributeValues);
      setSuccess('Атрибуты сохранены');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения атрибутов');
    } finally {
      setSavingAttributes(false);
    }
  }, [productId, selectedAttributeValues]);

  // Submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (isEdit && productId) {
        const updateData: ProductUpdate = {
          name: formData.name,
          description: formData.description,
          category_slug: formData.category_slug,
          product_type_code: formData.product_type_code,
          tags: formData.tags,
          is_active: formData.is_active,
          sort_order: formData.sort_order
        };
        await productsService.update(productId, updateData);
        setSuccess('Продукт сохранён');
      } else {
        const createData: ProductCreate = {
          id: formData.id,
          name: formData.name,
          description: formData.description,
          category_slug: formData.category_slug,
          product_type_code: formData.product_type_code,
          tags: formData.tags,
          is_active: false
        };
        await productsService.create(createData);
        navigate(ROUTES.PRODUCTS);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }, [isEdit, productId, formData, variants, navigate]);

  const handleCancel = useCallback(() => {
    navigate(ROUTES.PRODUCTS);
  }, [navigate]);

  const clearError = useCallback(() => setError(''), []);
  const clearSuccess = useCallback(() => setSuccess(''), []);

  return {
    // State
    isEdit,
    loading,
    saving,
    error,
    success,
    formData,
    categories,
    variants,
    brewProfiles,
    images,
    newTag,
    uploadingImage,
    filteredAttributes,
    selectedAttributeValues,
    savingAttributes,

    // Handlers
    handleFieldChange,
    handleAddTag,
    handleRemoveTag,
    handleActiveChange,
    handleSortOrderChange,
    handleAddVariant,
    handleEditVariant,
    handleDeleteVariant,
    handleAddBrewProfile,
    handleEditBrewProfile,
    handleDeleteBrewProfile,
    handleImageUpload,
    handleDeleteImage,
    handleToggleAttributeValue,
    handleSaveAttributes,
    handleSubmit,
    handleCancel,
    setNewTag,
    clearError,
    clearSuccess
  };
}
