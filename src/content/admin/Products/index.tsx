import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Container, Alert } from '@mui/material';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import PageHeader from 'src/components/PageHeader';
import LoadingState from 'src/components/LoadingState';
import ProductsTable from './ProductsTable';
import { productsService, categoriesService } from 'src/api';
import { Product, Category } from 'src/models';
import { ROUTES, PAGINATION } from 'src/constants';

interface ProductsFilters {
  search: string;
  category: string;
  status: string;
}

function ProductsList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(PAGINATION.DEFAULT_PAGE_SIZE);
  
  // Filters
  const [filters, setFilters] = useState<ProductsFilters>({
    search: '',
    category: 'all',
    status: 'all',
  });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      const params: any = {
        limit,
        offset: page * limit,
      };
      
      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.category !== 'all') {
        params.category_slug = filters.category;
      }
      if (filters.status !== 'all') {
        params.is_active = filters.status === 'active';
      }
      
      const response = await productsService.list(params);
      setProducts(response.items);
      setTotal(response.total);
      setError('');
    } catch (err: any) {
      setError('Ошибка загрузки продуктов');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoriesService.list();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleFiltersChange = useCallback((newFilters: ProductsFilters) => {
    setFilters(newFilters);
    setPage(0); // Reset to first page when filters change
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  }, []);

  // Initial loading
  if (loading && products.length === 0) {
    return <LoadingState message="Загрузка продуктов..." />;
  }

  return (
    <>
      <Helmet>
        <title>Продукты - Leaf Flow Admin</title>
      </Helmet>
      <PageHeader
        title="Продукты"
        subtitle="Управление каталогом продуктов"
        action={{
          label: 'Добавить продукт',
          icon: <AddTwoToneIcon />,
          onClick: () => navigate(ROUTES.PRODUCT_CREATE),
        }}
      />
      <Container maxWidth="lg">
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <ProductsTable 
          products={products}
          categories={categories}
          total={total}
          page={page}
          limit={limit}
          filters={filters}
          loading={loading}
          onFiltersChange={handleFiltersChange}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          onRefresh={fetchProducts}
        />
      </Container>
    </>
  );
}

export default ProductsList;
