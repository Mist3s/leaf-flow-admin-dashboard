import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Avatar,
  styled
} from '@mui/material';
import InventoryTwoToneIcon from '@mui/icons-material/InventoryTwoTone';
import ShoppingCartTwoToneIcon from '@mui/icons-material/ShoppingCartTwoTone';
import PeopleTwoToneIcon from '@mui/icons-material/PeopleTwoTone';
import CategoryTwoToneIcon from '@mui/icons-material/CategoryTwoTone';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import { productsService, ordersService, usersService, categoriesService } from 'src/api';

const AvatarPrimary = styled(Avatar)(
  ({ theme }) => `
    background-color: ${theme.colors.primary.lighter};
    color: ${theme.colors.primary.main};
    width: ${theme.spacing(8)};
    height: ${theme.spacing(8)};
`
);

const AvatarSuccess = styled(Avatar)(
  ({ theme }) => `
    background-color: ${theme.colors.success.lighter};
    color: ${theme.colors.success.main};
    width: ${theme.spacing(8)};
    height: ${theme.spacing(8)};
`
);

const AvatarWarning = styled(Avatar)(
  ({ theme }) => `
    background-color: ${theme.colors.warning.lighter};
    color: ${theme.colors.warning.main};
    width: ${theme.spacing(8)};
    height: ${theme.spacing(8)};
`
);

const AvatarInfo = styled(Avatar)(
  ({ theme }) => `
    background-color: ${theme.colors.info.lighter};
    color: ${theme.colors.info.main};
    width: ${theme.spacing(8)};
    height: ${theme.spacing(8)};
`
);

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    users: 0,
    categories: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [products, orders, users, categories] = await Promise.all([
          productsService.list({ limit: 1 }),
          ordersService.list({ limit: 1 }),
          usersService.list({ limit: 1 }),
          categoriesService.list()
        ]);
        
        setStats({
          products: products.total,
          orders: orders.total,
          users: users.total,
          categories: categories.length
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Продукты',
      value: stats.products,
      icon: <InventoryTwoToneIcon fontSize="large" />,
      Avatar: AvatarPrimary,
      link: '/admin/products'
    },
    {
      title: 'Заказы',
      value: stats.orders,
      icon: <ShoppingCartTwoToneIcon fontSize="large" />,
      Avatar: AvatarSuccess,
      link: '/admin/orders'
    },
    {
      title: 'Пользователи',
      value: stats.users,
      icon: <PeopleTwoToneIcon fontSize="large" />,
      Avatar: AvatarWarning,
      link: '/admin/users'
    },
    {
      title: 'Категории',
      value: stats.categories,
      icon: <CategoryTwoToneIcon fontSize="large" />,
      Avatar: AvatarInfo,
      link: '/admin/categories'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Дашборд - Leaf Flow Admin</title>
      </Helmet>
      <PageTitleWrapper>
        <Box>
          <Typography variant="h3" component="h3" gutterBottom>
            Дашборд
          </Typography>
          <Typography variant="subtitle2">
            Обзор статистики магазина
          </Typography>
        </Box>
      </PageTitleWrapper>
      <Container maxWidth="lg">
        {loading ? (
          <Box display="flex" justifyContent="center" py={5}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {statCards.map((card) => (
              <Grid item xs={12} sm={6} md={3} key={card.title}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)' }
                  }}
                  onClick={() => navigate(card.link)}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h4" gutterBottom>
                          {card.value}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                          {card.title}
                        </Typography>
                      </Box>
                      <card.Avatar>
                        {card.icon}
                      </card.Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </>
  );
}

export default Dashboard;
