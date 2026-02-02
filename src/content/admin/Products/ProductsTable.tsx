import { FC, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Avatar,
  Switch,
  Chip,
  Stack,
  useTheme
} from '@mui/material';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import Label from 'src/components/Label';
import DataTable, { DataTableColumn, FilterOption } from 'src/components/DataTable';
import { Product } from 'src/models';
import { productsService } from 'src/api';
import { ROUTES, PRODUCT_TYPE_CONFIG } from 'src/constants';
import { formatDate } from 'src/utils';

interface ProductsTableProps {
  products: Product[];
  onRefresh: () => void;
}

const ProductsTable: FC<ProductsTableProps> = ({ products, onRefresh }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesActive = 
        activeFilter === 'all' || 
        (activeFilter === 'active' && product.is_active) ||
        (activeFilter === 'inactive' && !product.is_active);
      return matchesSearch && matchesActive;
    });
  }, [products, searchTerm, activeFilter]);

  const activeFilterOptions: FilterOption[] = [
    { value: 'all', label: 'Все' },
    { value: 'active', label: 'Активные' },
    { value: 'inactive', label: 'Неактивные' },
  ];

  const handleToggleActive = useCallback(async (e: React.MouseEvent, productId: string, isActive: boolean) => {
    e.stopPropagation();
    try {
      await productsService.setActive(productId, isActive);
      onRefresh();
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  }, [onRefresh]);

  const handleDelete = useCallback(async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (window.confirm('Вы уверены, что хотите удалить этот продукт?')) {
      try {
        await productsService.delete(productId);
        onRefresh();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  }, [onRefresh]);

  const columns: DataTableColumn<Product>[] = [
    {
      id: 'product',
      label: 'Продукт',
      minWidth: 250,
      render: (product) => (
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            variant="rounded"
            src={product.image}
            sx={{ 
              width: 48, 
              height: 48,
              backgroundColor: theme.palette.primary.main + '15',
              fontSize: '1.5rem',
            }}
          >
            🍃
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {product.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {product.id}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'category',
      label: 'Категория',
      hideOnMobile: true,
      render: (product) => (
        <Chip
          label={product.category_slug}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      id: 'type',
      label: 'Тип',
      hideOnMobile: true,
      render: (product) => (
        <Typography variant="caption" color="text.secondary">
          {PRODUCT_TYPE_CONFIG[product.product_type_code]?.label || product.product_type_code}
        </Typography>
      ),
    },
    {
      id: 'variants',
      label: 'Варианты',
      align: 'center',
      render: (product) => (
        <Chip
          label={product.variants.length}
          size="small"
          color="primary"
          sx={{ minWidth: 32 }}
        />
      ),
    },
    {
      id: 'active',
      label: 'Активен',
      align: 'center',
      render: (product) => (
        <Switch
          checked={product.is_active}
          onChange={(e) => handleToggleActive(e as any, product.id, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          color="success"
          size="small"
        />
      ),
    },
    {
      id: 'date',
      label: 'Создан',
      hideOnMobile: true,
      render: (product) => (
        <Typography variant="caption" color="text.secondary">
          {formatDate(product.created_at)}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: '',
      align: 'right',
      render: (product) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Редактировать" arrow>
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                navigate(ROUTES.PRODUCT_EDIT(product.id));
              }}
              sx={{
                backgroundColor: theme.palette.primary.main + '10',
                '&:hover': {
                  backgroundColor: theme.palette.primary.main + '20',
                },
              }}
            >
              <EditTwoToneIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Удалить" arrow>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => handleDelete(e, product.id)}
              sx={{
                backgroundColor: theme.palette.error.main + '10',
                '&:hover': {
                  backgroundColor: theme.palette.error.main + '20',
                },
              }}
            >
              <DeleteTwoToneIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const renderMobileCard = (product: Product) => (
    <Box>
      <Box display="flex" alignItems="flex-start" gap={2}>
        <Avatar
          variant="rounded"
          src={product.image}
          sx={{ 
            width: 56, 
            height: 56,
            backgroundColor: theme.palette.primary.main + '15',
            fontSize: '1.5rem',
          }}
        >
          🍃
        </Avatar>
        <Box flex={1} minWidth={0}>
          <Typography variant="body1" fontWeight={600} noWrap>
            {product.name}
          </Typography>
          <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5} mb={1}>
            <Chip
              label={product.category_slug}
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: '0.7rem' }}
            />
            <Chip
              label={`${product.variants.length} вар.`}
              size="small"
              color="primary"
              sx={{ height: 22, fontSize: '0.7rem' }}
            />
            <Label color={product.is_active ? 'success' : 'warning'}>
              {product.is_active ? 'Активен' : 'Неактивен'}
            </Label>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {formatDate(product.created_at)}
          </Typography>
        </Box>
        <Stack direction="column" spacing={0.5}>
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              navigate(ROUTES.PRODUCT_EDIT(product.id));
            }}
          >
            <EditTwoToneIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(e) => handleDelete(e, product.id)}
          >
            <DeleteTwoToneIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );

  return (
    <DataTable
      title="Продукты"
      data={filteredProducts}
      columns={columns}
      keyExtractor={(product) => product.id}
      searchPlaceholder="Поиск по названию или ID..."
      onSearch={setSearchTerm}
      filters={[
        {
          label: 'Статус',
          value: activeFilter,
          options: activeFilterOptions,
          onChange: setActiveFilter,
        },
      ]}
      renderMobileCard={renderMobileCard}
      onRowClick={(product) => navigate(ROUTES.PRODUCT_EDIT(product.id))}
      emptyMessage="Продукты не найдены"
    />
  );
};

export default ProductsTable;
