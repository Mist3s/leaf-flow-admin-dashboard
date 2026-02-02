import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  CircularProgress,
  styled,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from 'src/contexts/AuthContext';

const LoginWrapper = styled(Box)(
  ({ theme }) => `
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, ${theme.colors.primary.dark} 0%, ${theme.colors.alpha.black[100]} 100%);
  `
);

const LoginCard = styled(Card)(
  ({ theme }) => `
    padding: ${theme.spacing(4)};
    width: 100%;
    max-width: 420px;
  `
);

const Logo = styled(Typography)(
  ({ theme }) => `
    font-weight: 700;
    font-size: 2rem;
    color: ${theme.colors.primary.main};
    text-align: center;
    margin-bottom: ${theme.spacing(3)};
  `
);

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!token.trim()) {
      setError('Введите токен');
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(token.trim());
      if (success) {
        navigate('/admin/dashboard');
      } else {
        setError('Неверный токен. Проверьте правильность ввода.');
      }
    } catch (err: any) {
      setError('Ошибка проверки токена. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Вход - Leaf Flow Admin</title>
      </Helmet>
      <LoginWrapper>
        <Container maxWidth="sm">
          <LoginCard>
            <Logo>🍃 Leaf Flow</Logo>
            <Typography variant="h4" textAlign="center" gutterBottom>
              Панель управления
            </Typography>
            <Typography variant="body2" textAlign="center" color="text.secondary" mb={3}>
              Введите токен администратора для входа
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Токен"
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                margin="normal"
                required
                autoComplete="off"
                placeholder="Введите токен доступа"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowToken(!showToken)}
                        edge="end"
                      >
                        {showToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{ mt: 3 }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Войти'}
              </Button>
            </form>
          </LoginCard>
        </Container>
      </LoginWrapper>
    </>
  );
}

export default Login;
