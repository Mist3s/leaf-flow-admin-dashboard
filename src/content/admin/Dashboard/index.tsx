import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Stack,
  Skeleton,
  useTheme,
  alpha,
} from '@mui/material';
import InventoryTwoToneIcon from '@mui/icons-material/InventoryTwoTone';
import ShoppingCartTwoToneIcon from '@mui/icons-material/ShoppingCartTwoTone';
import PeopleTwoToneIcon from '@mui/icons-material/PeopleTwoTone';
import CategoryTwoToneIcon from '@mui/icons-material/CategoryTwoTone';
import TrendingUpTwoToneIcon from '@mui/icons-material/TrendingUpTwoTone';
import AccessTimeTwoToneIcon from '@mui/icons-material/AccessTimeTwoTone';
import { PageHeader, Label, StatCard } from 'src/components';
import type { StatCardProps } from 'src/components';
import { productsService, ordersService, usersService, categoriesService } from 'src/api';
import { Order } from 'src/models';
import { ORDER_STATUS_CONFIG, ROUTES } from 'src/constants';
import { formatPrice, formatDate } from 'src/utils';

function RecentOrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const theme = useTheme();
  const statusConfig = ORDER_STATUS_CONFIG[order.status];

  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2,
        cursor: 'pointer',
        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
        transition: 'background-color 0.15s',
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.02),
        },
        '&:last-child': {
          borderBottom: 'none',
        },
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
        <Box>
          <Typography variant="body2" fontWeight={600}>
            Заказ #{order.id}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDate(order.created_at)}
          </Typography>
        </Box>
        <Label color={statusConfig?.color || 'info'}>
          {statusConfig?.label || order.status}
        </Label>
      </Box>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary">
          {order.items?.length || 0} товаров
        </Typography>
        <Typography variant="body2" fontWeight={600} color="primary">
          {formatPrice(order.total)}
        </Typography>
      </Box>
    </Box>
  );
}

function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    users: 0,
    categories: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [products, orders, users, categories] = await Promise.all([
          productsService.list({ limit: 1 }),
          ordersService.list({ limit: 3 }),
          usersService.list({ limit: 1 }),
          categoriesService.list()
        ]);
        
        setStats({
          products: products.total,
          orders: orders.total,
          users: users.total,
          categories: categories.length
        });
        setRecentOrders(orders.items);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards: StatCardProps[] = [
    {
      title: 'Продукты',
      value: stats.products,
      icon: <InventoryTwoToneIcon fontSize="large" />,
      color: 'primary',
      link: ROUTES.PRODUCTS
    },
    {
      title: 'Заказы',
      value: stats.orders,
      icon: <ShoppingCartTwoToneIcon fontSize="large" />,
      color: 'success',
      link: ROUTES.ORDERS
    },
    {
      title: 'Пользователи',
      value: stats.users,
      icon: <PeopleTwoToneIcon fontSize="large" />,
      color: 'warning',
      link: ROUTES.USERS
    },
    {
      title: 'Категории',
      value: stats.categories,
      icon: <CategoryTwoToneIcon fontSize="large" />,
      color: 'info',
      link: ROUTES.CATEGORIES
    }
  ];

  return (
    <>
      <Helmet>
        <title>Дашборд - Leaf Flow Admin</title>
      </Helmet>
      <PageHeader
        title="Дашборд"
        subtitle="Обзор статистики магазина"
      />
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          {/* Статистика */}
          {statCards.map((card) => (
            <Grid item xs={6} sm={6} md={3} key={card.title}>
              <StatCard {...card} loading={loading} />
            </Grid>
          ))}

          {/* Последние заказы */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader
                title={
                  <Box display="flex" alignItems="center" gap={1}>
                    <AccessTimeTwoToneIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Последние заказы
                    </Typography>
                  </Box>
                }
                action={
                  <Chip
                    label="Все заказы"
                    size="small"
                    color="primary"
                    variant="outlined"
                    onClick={() => navigate(ROUTES.ORDERS)}
                    sx={{ cursor: 'pointer' }}
                  />
                }
              />
              <Box>
                {loading ? (
                  <Box p={2}>
                    {[1, 2, 3].map((i) => (
                      <Box key={i} mb={2}>
                        <Skeleton variant="text" width="40%" height={24} />
                        <Skeleton variant="text" width="60%" height={20} />
                      </Box>
                    ))}
                  </Box>
                ) : recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <RecentOrderCard
                      key={order.id}
                      order={order}
                      onClick={() => navigate(ROUTES.ORDER_DETAIL(order.id))}
                    />
                  ))
                ) : (
                  <Box p={4} textAlign="center">
                    <Typography color="text.secondary">
                      Нет заказов
                    </Typography>
                  </Box>
                )}
              </Box>
            </Card>
          </Grid>

          {/* Быстрые действия */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader
                title={
                  <Box display="flex" alignItems="center" gap={1}>
                    <TrendingUpTwoToneIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Быстрые действия
                    </Typography>
                  </Box>
                }
              />
              <CardContent>
                <Stack spacing={2}>
                  {[
                    { label: 'Добавить продукт', link: ROUTES.PRODUCT_CREATE, color: 'primary' },
                    { label: 'Просмотреть заказы', link: ROUTES.ORDERS, color: 'success' },
                    { label: 'Управление категориями', link: ROUTES.CATEGORIES, color: 'info' },
                    { label: 'Модерация отзывов', link: ROUTES.REVIEWS, color: 'warning' },
                  ].map((action) => (
                    <Box
                      key={action.label}
                      onClick={() => navigate(action.link)}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        cursor: 'pointer',
                        backgroundColor: alpha(theme.palette[action.color as 'primary'].main, 0.08),
                        transition: 'all 0.15s',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette[action.color as 'primary'].main, 0.16),
                          transform: 'translateX(4px)',
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={`${action.color}.main`}
                      >
                        {action.label}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default Dashboard;
