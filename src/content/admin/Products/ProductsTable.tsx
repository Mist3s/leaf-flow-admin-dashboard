import { FC, useCallback, useRef, useEffect } from 'react';
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
  Card,
  CardHeader,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  InputAdornment,
  useTheme,
  useMediaQuery,
  alpha,
  Skeleton
} from '@mui/material';
import { StyledTableContainer, MobileCard } from 'src/components/StyledTable';
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import Label from 'src/components/Label';
import ConfirmDialog from 'src/components/ConfirmDialog';
import { useConfirmDialog } from 'src/hooks';
import { Product, Category } from 'src/models';
import { productsService } from 'src/api';
import { ROUTES, PRODUCT_TYPE_CONFIG, PAGINATION } from 'src/constants';
import { formatDate } from 'src/utils';

interface ProductsFilters {
  search: string;
  category: string;
  status: string;
}

interface ProductsTableProps {
  products: Product[];
  categories: Category[];
  total: number;
  page: number;
  limit: number;
  filters: ProductsFilters;
  loading: boolean;
  onFiltersChange: (filters: ProductsFilters) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onRefresh: () => void;
}


const ProductsTable: FC<ProductsTableProps> = ({
  products,
  categories,
  total,
  page,
  limit,
  filters,
  loading,
  onFiltersChange,
  onPageChange,
  onLimitChange,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { confirmDialog, openConfirmDialog, closeConfirmDialog } = useConfirmDialog();
  
  // Debounce search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      onFiltersChange({ ...filters, search: value });
    }, 300);
  }, [filters, onFiltersChange]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const categoryOptions = [
    { value: 'all', label: 'Все категории' },
    ...categories.map(cat => ({ value: cat.slug, label: cat.label })),
  ];

  const statusOptions = [
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

  const handleDelete = useCallback((e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    openConfirmDialog({
      title: 'Удалить продукт',
      message: `Вы уверены, что хотите удалить "${product.name}"?`,
      confirmText: 'Удалить',
      confirmColor: 'error',
      onConfirm: async () => {
        try {
          await productsService.delete(product.id);
          onRefresh();
        } catch (error) {
          console.error('Error deleting product:', error);
        }
      },
    });
  }, [onRefresh, openConfirmDialog]);

  const getCategoryLabel = (slug: string) => {
    const category = categories.find(c => c.slug === slug);
    return category?.label || slug;
  };

  const renderSkeleton = () => (
    <>
      {[...Array(limit)].map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Box display="flex" alignItems="center" gap={2}>
              <Skeleton variant="rectangular" width={48} height={48} sx={{ borderRadius: 1 }} />
              <Box>
                <Skeleton width={150} height={20} />
                <Skeleton width={80} height={16} />
              </Box>
            </Box>
          </TableCell>
          <TableCell><Skeleton width={80} /></TableCell>
          <TableCell><Skeleton width={60} /></TableCell>
          <TableCell align="center"><Skeleton width={32} sx={{ mx: 'auto' }} /></TableCell>
          <TableCell align="center"><Skeleton width={40} sx={{ mx: 'auto' }} /></TableCell>
          <TableCell><Skeleton width={100} /></TableCell>
          <TableCell align="right"><Skeleton width={80} sx={{ ml: 'auto' }} /></TableCell>
        </TableRow>
      ))}
    </>
  );

  const renderMobileCard = (product: Product) => (
    <MobileCard key={product.id} onClick={() => navigate(ROUTES.PRODUCT_EDIT(product.id))}>
      <Box display="flex" alignItems="flex-start" gap={2}>
        <Avatar
          variant="rounded"
          src={product.image}
          sx={{ 
            width: 56, 
            height: 56,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
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
              label={getCategoryLabel(product.category_slug)}
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: '0.7rem' }}
            />
            <Label color="info">
              {PRODUCT_TYPE_CONFIG[product.product_type_code]?.label || product.product_type_code}
            </Label>
            <Chip
              label={`${product.variants.length} вар.`}
              size="small"
              color="primary"
              sx={{ height: 22, fontSize: '0.7rem' }}
            />
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Label color={product.is_active ? 'success' : 'warning'}>
              {product.is_active ? 'Активен' : 'Неактивен'}
            </Label>
            <Typography variant="caption" color="text.secondary">
              {formatDate(product.created_at)}
            </Typography>
          </Box>
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
            onClick={(e) => handleDelete(e, product)}
          >
            <DeleteTwoToneIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
    </MobileCard>
  );

  return (
    <>
      <Card>
        <CardHeader
          title="Продукты"
          subheader={`Всего: ${total}`}
        />
        
        {/* Filters */}
        <Box sx={{ px: 2, pb: 2 }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <TextField
              size="small"
              placeholder="Поиск по названию..."
              defaultValue={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchTwoToneIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Категория</InputLabel>
              <Select
                value={filters.category}
                label="Категория"
                onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
              >
                {categoryOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Статус</InputLabel>
              <Select
                value={filters.status}
                label="Статус"
                onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
              >
                {statusOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {/* Table / Cards */}
        {isMobile ? (
          <Box>
            {loading ? (
              <Box p={2}>
                {[...Array(5)].map((_, i) => (
                  <Box key={i} mb={2}>
                    <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
                  </Box>
                ))}
              </Box>
            ) : products.length > 0 ? (
              products.map(renderMobileCard)
            ) : (
              <Box p={4} textAlign="center">
                <Typography color="text.secondary">Продукты не найдены</Typography>
              </Box>
            )}
          </Box>
        ) : (
          <StyledTableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Продукт</TableCell>
                  <TableCell>Категория</TableCell>
                  <TableCell>Тип</TableCell>
                  <TableCell align="center">Варианты</TableCell>
                  <TableCell align="center">Активен</TableCell>
                  <TableCell>Создан</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? renderSkeleton() : products.length > 0 ? (
                  products.map((product) => (
                    <TableRow 
                      key={product.id}
                      onClick={() => navigate(ROUTES.PRODUCT_EDIT(product.id))}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar
                            variant="rounded"
                            src={product.image}
                            sx={{ 
                              width: 48, 
                              height: 48,
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
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
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getCategoryLabel(product.category_slug)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Label color="info">
                          {PRODUCT_TYPE_CONFIG[product.product_type_code]?.label || product.product_type_code}
                        </Label>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={product.variants.length}
                          size="small"
                          color="primary"
                          sx={{ minWidth: 32 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={product.is_active}
                          onChange={(e) => handleToggleActive(e as any, product.id, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                          color="success"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(product.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
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
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.2) },
                              }}
                            >
                              <EditTwoToneIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Удалить" arrow>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => handleDelete(e, product)}
                              sx={{
                                backgroundColor: alpha(theme.palette.error.main, 0.1),
                                '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.2) },
                              }}
                            >
                              <DeleteTwoToneIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">Продукты не найдены</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </StyledTableContainer>
        )}

        {/* Pagination */}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => onPageChange(newPage)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => onLimitChange(parseInt(e.target.value))}
          rowsPerPageOptions={PAGINATION.PAGE_SIZE_OPTIONS}
          labelRowsPerPage="На странице:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} из ${count}`}
        />
      </Card>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmColor={confirmDialog.confirmColor}
        onConfirm={confirmDialog.onConfirm}
        onClose={closeConfirmDialog}
      />
    </>
  );
};

export default ProductsTable;
