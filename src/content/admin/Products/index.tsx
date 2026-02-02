import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import ProductsTable from './ProductsTable';
import { productsService } from 'src/api';
import { Product } from 'src/models';

function ProductsList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsService.list({ limit: 100 });
      setProducts(response.items);
      setError('');
    } catch (err: any) {
      setError('Ошибка загрузки продуктов');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <>
      <Helmet>
        <title>Продукты - Leaf Flow Admin</title>
      </Helmet>
      <PageTitleWrapper>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h3" component="h3" gutterBottom>
              Продукты
            </Typography>
            <Typography variant="subtitle2">
              Управление каталогом продуктов
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddTwoToneIcon fontSize="small" />}
            onClick={() => navigate('/admin/products/create')}
          >
            Добавить продукт
          </Button>
        </Box>
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {loading ? (
              <Box display="flex" justifyContent="center" py={5}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <ProductsTable products={products} onRefresh={fetchProducts} />
            )}
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default ProductsList;
