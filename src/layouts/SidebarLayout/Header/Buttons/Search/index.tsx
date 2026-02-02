import { forwardRef, Ref, useState, ReactElement, ChangeEvent, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Tooltip,
  Typography,
  Dialog,
  DialogContent,
  Slide,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { TransitionProps } from '@mui/material/transitions';
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';
import InventoryTwoToneIcon from '@mui/icons-material/InventoryTwoTone';
import ShoppingCartTwoToneIcon from '@mui/icons-material/ShoppingCartTwoTone';
import PeopleTwoToneIcon from '@mui/icons-material/PeopleTwoTone';
import CategoryTwoToneIcon from '@mui/icons-material/CategoryTwoTone';
import { productsService, ordersService, usersService, categoriesService } from 'src/api';
import { Product, Order, User, Category } from 'src/models';

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: ReactElement<any, any> },
  ref: Ref<unknown>
) {
  return <Slide direction="down" ref={ref} {...props} />;
});

const DialogWrapper = styled(Dialog)(
  () => `
    .MuiDialog-container {
        height: auto;
    }
    
    .MuiDialog-paperScrollPaper {
        max-height: calc(100vh - 64px)
    }
`
);

const SearchInputWrapper = styled(TextField)(
  ({ theme }) => `
    background: ${theme.colors.alpha.white[100]};

    .MuiInputBase-input {
        font-size: ${theme.typography.pxToRem(17)};
    }
`
);

const DialogTitleWrapper = styled(Box)(
  ({ theme }) => `
    padding: ${theme.spacing(3)}
`
);

interface SearchResults {
  products: Product[];
  orders: Order[];
  users: User[];
  categories: Category[];
}

function HeaderSearch() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    products: [],
    orders: [],
    users: [],
    categories: []
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [open, setOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults({ products: [], orders: [], users: [], categories: [] });
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const [productsRes, ordersRes, usersRes, categoriesRes] = await Promise.allSettled([
        productsService.list({ search: query, limit: 5 }),
        ordersService.list({ search: query, limit: 5 }),
        usersService.list({ search: query, limit: 5 }),
        categoriesService.list()
      ]);

      const products = productsRes.status === 'fulfilled' ? productsRes.value.items : [];
      const orders = ordersRes.status === 'fulfilled' ? ordersRes.value.items : [];
      const users = usersRes.status === 'fulfilled' ? usersRes.value.items : [];
      const allCategories = categoriesRes.status === 'fulfilled' ? categoriesRes.value : [];
      
      // Filter categories by query
      const categories = allCategories.filter(
        c => c.label.toLowerCase().includes(query.toLowerCase()) ||
             c.slug.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);

      setResults({ products, orders, users, categories });
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value;
    setSearchValue(value);
    
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSearchValue('');
    setResults({ products: [], orders: [], users: [], categories: [] });
    setHasSearched(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    handleClose();
  };

  const totalResults = results.products.length + results.orders.length + 
                       results.users.length + results.categories.length;

  return (
    <>
      <Tooltip arrow title="Поиск">
        <IconButton color="primary" onClick={handleClickOpen}>
          <SearchTwoToneIcon />
        </IconButton>
      </Tooltip>

      <DialogWrapper
        open={open}
        TransitionComponent={Transition}
        keepMounted
        maxWidth="sm"
        fullWidth
        scroll="paper"
        onClose={handleClose}
      >
        <DialogTitleWrapper>
          <SearchInputWrapper
            value={searchValue}
            autoFocus={true}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {loading ? <CircularProgress size={20} /> : <SearchTwoToneIcon />}
                </InputAdornment>
              )
            }}
            placeholder="Поиск продуктов, заказов, пользователей..."
            fullWidth
            label="Поиск"
          />
        </DialogTitleWrapper>
        <Divider />

        {hasSearched && (
          <DialogContent>
            {totalResults === 0 && !loading ? (
              <Box py={3} textAlign="center">
                <Typography variant="body1" color="text.secondary">
                  По запросу "{searchValue}" ничего не найдено
                </Typography>
              </Box>
            ) : (
              <>
                {/* Products */}
                {results.products.length > 0 && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Продукты
                    </Typography>
                    <List disablePadding>
                      {results.products.map((product) => (
                        <ListItem
                          key={product.id}
                          button
                          onClick={() => handleNavigate(`/admin/products/${product.id}`)}
                          sx={{ borderRadius: 1, mb: 0.5 }}
                        >
                          <ListItemAvatar>
                            <Avatar 
                              variant="rounded" 
                              src={product.image}
                              sx={{ bgcolor: 'primary.main' }}
                            >
                              <InventoryTwoToneIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={product.name}
                            secondary={
                              <Box display="flex" gap={1} alignItems="center">
                                <Chip size="small" label={product.category_slug} />
                                {!product.is_active && (
                                  <Chip size="small" label="Неактивен" color="warning" />
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                    <Divider sx={{ my: 2 }} />
                  </>
                )}

                {/* Orders */}
                {results.orders.length > 0 && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Заказы
                    </Typography>
                    <List disablePadding>
                      {results.orders.map((order) => (
                        <ListItem
                          key={order.id}
                          button
                          onClick={() => handleNavigate(`/admin/orders/${order.id}`)}
                          sx={{ borderRadius: 1, mb: 0.5 }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'info.main' }}>
                              <ShoppingCartTwoToneIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`#${order.id.slice(-8).toUpperCase()}`}
                            secondary={
                              <Box display="flex" gap={1} alignItems="center">
                                <span>{order.customer_name}</span>
                                <Chip size="small" label={`${order.total} ₽`} />
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                    <Divider sx={{ my: 2 }} />
                  </>
                )}

                {/* Users */}
                {results.users.length > 0 && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Пользователи
                    </Typography>
                    <List disablePadding>
                      {results.users.map((user) => (
                        <ListItem
                          key={user.id}
                          button
                          onClick={() => handleNavigate(`/admin/users/${user.id}`)}
                          sx={{ borderRadius: 1, mb: 0.5 }}
                        >
                          <ListItemAvatar>
                            <Avatar src={user.photo_url || undefined} sx={{ bgcolor: 'success.main' }}>
                              <PeopleTwoToneIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`${user.first_name} ${user.last_name || ''}`}
                            secondary={user.username ? `@${user.username}` : user.email}
                          />
                        </ListItem>
                      ))}
                    </List>
                    <Divider sx={{ my: 2 }} />
                  </>
                )}

                {/* Categories */}
                {results.categories.length > 0 && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Категории
                    </Typography>
                    <List disablePadding>
                      {results.categories.map((category) => (
                        <ListItem
                          key={category.slug}
                          button
                          onClick={() => handleNavigate('/admin/categories')}
                          sx={{ borderRadius: 1, mb: 0.5 }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'warning.main' }}>
                              <CategoryTwoToneIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={category.label}
                            secondary={category.slug}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </>
            )}
          </DialogContent>
        )}
      </DialogWrapper>
    </>
  );
}

export default HeaderSearch;
