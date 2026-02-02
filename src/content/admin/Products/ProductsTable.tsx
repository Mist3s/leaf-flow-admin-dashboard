import { FC, ChangeEvent, useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip,
  Divider,
  Box,
  FormControl,
  InputLabel,
  Card,
  Checkbox,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableContainer,
  Select,
  MenuItem,
  Typography,
  useTheme,
  CardHeader,
  Switch,
  TextField,
  InputAdornment,
  Avatar,
  useMediaQuery,
  Stack
} from '@mui/material';
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';
import Label from 'src/components/Label';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import { Product } from 'src/models';
import { productsService } from 'src/api';

interface ProductsTableProps {
  products: Product[];
  onRefresh: () => void;
}

const ProductsTable: FC<ProductsTableProps> = ({ products, onRefresh }) => {
  const navigate = useNavigate();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSelectAllProducts = (event: ChangeEvent<HTMLInputElement>): void => {
    setSelectedProducts(event.target.checked ? products.map((p) => p.id) : []);
  };

  const handleSelectOneProduct = (event: ChangeEvent<HTMLInputElement>, productId: string): void => {
    if (!selectedProducts.includes(productId)) {
      setSelectedProducts((prev) => [...prev, productId]);
    } else {
      setSelectedProducts((prev) => prev.filter((id) => id !== productId));
    }
  };

  const handlePageChange = (event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
  };

  const handleToggleActive = async (productId: string, isActive: boolean) => {
    try {
      await productsService.setActive(productId, isActive);
      onRefresh();
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот продукт?')) {
      try {
        await productsService.delete(productId);
        onRefresh();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActive = activeFilter === 'all' || 
      (activeFilter === 'active' && product.is_active) ||
      (activeFilter === 'inactive' && !product.is_active);
    return matchesSearch && matchesActive;
  });

  const paginatedProducts = filteredProducts.slice(page * limit, page * limit + limit);

  // Mobile card view
  if (isMobile) {
    return (
      <Card>
        <CardHeader
          title="Продукты"
          sx={{ pb: 1 }}
        />
        <Box px={2} pb={2}>
          <Stack spacing={2}>
            <TextField
              size="small"
              placeholder="Поиск..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchTwoToneIcon />
                  </InputAdornment>
                )
              }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Статус</InputLabel>
              <Select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                label="Статус"
              >
                <MenuItem value="all">Все</MenuItem>
                <MenuItem value="active">Активные</MenuItem>
                <MenuItem value="inactive">Неактивные</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>
        <Divider />
        <Box>
          {paginatedProducts.map((product) => (
            <Box
              key={product.id}
              sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                '&:last-child': { borderBottom: 'none' }
              }}
            >
              <Box display="flex" alignItems="flex-start" gap={2}>
                <Avatar
                  variant="rounded"
                  src={product.image}
                  sx={{ width: 56, height: 56 }}
                >
                  🍃
                </Avatar>
                <Box flex={1} minWidth={0}>
                  <Typography variant="body1" fontWeight="bold" noWrap>
                    {product.name}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                    <Label color="info">{product.category_slug}</Label>
                    <Label color="primary">{product.variants.length} вар.</Label>
                    <Label color={product.is_active ? 'success' : 'warning'}>
                      {product.is_active ? 'Активен' : 'Неактивен'}
                    </Label>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {product.created_at && format(new Date(product.created_at), 'dd MMM yyyy', { locale: ru })}
                  </Typography>
                </Box>
                <Box display="flex" flexDirection="column" gap={0.5}>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/admin/products/${product.id}`)}
                    color="primary"
                  >
                    <EditTwoToneIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(product.id)}
                    color="error"
                  >
                    <DeleteTwoToneIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
        <Box p={2}>
          <TablePagination
            component="div"
            count={filteredProducts.length}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleLimitChange}
            page={page}
            rowsPerPage={limit}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="На странице:"
          />
        </Box>
      </Card>
    );
  }

  // Desktop table view
  return (
    <Card>
      <CardHeader
        action={
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Поиск..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchTwoToneIcon />
                  </InputAdornment>
                )
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Статус</InputLabel>
              <Select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                label="Статус"
              >
                <MenuItem value="all">Все</MenuItem>
                <MenuItem value="active">Активные</MenuItem>
                <MenuItem value="inactive">Неактивные</MenuItem>
              </Select>
            </FormControl>
          </Box>
        }
        title="Продукты"
      />
      <Divider />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  checked={selectedProducts.length === products.length}
                  indeterminate={selectedProducts.length > 0 && selectedProducts.length < products.length}
                  onChange={handleSelectAllProducts}
                />
              </TableCell>
              <TableCell>Продукт</TableCell>
              <TableCell>Категория</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell align="center">Вариантов</TableCell>
              <TableCell align="center">Активен</TableCell>
              <TableCell>Создан</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedProducts.map((product) => {
              const isSelected = selectedProducts.includes(product.id);
              return (
                <TableRow hover key={product.id} selected={isSelected}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      checked={isSelected}
                      onChange={(e) => handleSelectOneProduct(e, product.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        variant="rounded"
                        src={product.image}
                        sx={{ width: 48, height: 48 }}
                      >
                        🍃
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="bold" noWrap>
                          {product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {product.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Label color="info">{product.category_slug}</Label>
                  </TableCell>
                  <TableCell>{product.product_type_code}</TableCell>
                  <TableCell align="center">
                    <Label color="primary">{product.variants.length}</Label>
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={product.is_active}
                      onChange={(e) => handleToggleActive(product.id, e.target.checked)}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {product.created_at && format(new Date(product.created_at), 'dd MMM yyyy', { locale: ru })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Редактировать" arrow>
                      <IconButton
                        sx={{
                          '&:hover': { background: theme.colors.primary.lighter },
                          color: theme.palette.primary.main
                        }}
                        onClick={() => navigate(`/admin/products/${product.id}`)}
                        size="small"
                      >
                        <EditTwoToneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Удалить" arrow>
                      <IconButton
                        sx={{
                          '&:hover': { background: theme.colors.error.lighter },
                          color: theme.palette.error.main
                        }}
                        onClick={() => handleDelete(product.id)}
                        size="small"
                      >
                        <DeleteTwoToneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Box p={2}>
        <TablePagination
          component="div"
          count={filteredProducts.length}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleLimitChange}
          page={page}
          rowsPerPage={limit}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Строк на странице:"
        />
      </Box>
    </Card>
  );
};

export default ProductsTable;
