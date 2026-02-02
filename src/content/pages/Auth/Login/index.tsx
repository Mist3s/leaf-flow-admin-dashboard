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
  IconButton,
  alpha,
  useTheme
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from 'src/contexts/AuthContext';
import { ROUTES } from 'src/constants';

const LoginWrapper = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${alpha(theme.palette.primary.main, 0.9)} 50%, ${theme.palette.success.dark} 100%)`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      radial-gradient(circle at 20% 80%, ${alpha(theme.palette.common.white, 0.1)} 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, ${alpha(theme.palette.common.white, 0.08)} 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, ${alpha(theme.palette.success.main, 0.15)} 0%, transparent 30%)
    `,
    pointerEvents: 'none',
  },
}));

const FloatingLeaf = styled(Box)(({ theme }) => ({
  position: 'absolute',
  fontSize: '3rem',
  opacity: 0.15,
  animation: 'float 6s ease-in-out infinite',
  '@keyframes float': {
    '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
    '50%': { transform: 'translateY(-20px) rotate(10deg)' },
  },
}));

const LoginCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(5),
  width: '100%',
  maxWidth: 440,
  position: 'relative',
  backdropFilter: 'blur(10px)',
  backgroundColor: alpha(theme.palette.background.paper, 0.95),
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.2)}`,
  animation: 'slideUp 0.5s ease-out',
  '@keyframes slideUp': {
    from: {
      opacity: 0,
      transform: 'translateY(20px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(4),
}));

const LogoIcon = styled(Box)(({ theme }) => ({
  width: 56,
  height: 56,
  borderRadius: theme.spacing(2),
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '2rem',
  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.06),
    },
    '&.Mui-focused': {
      backgroundColor: theme.palette.background.paper,
    },
  },
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  height: 52,
  fontSize: '1rem',
  fontWeight: 600,
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}`,
    transform: 'translateY(-1px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
}));

function Login() {
  const theme = useTheme();
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
        navigate(ROUTES.DASHBOARD);
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
        {/* Decorative floating leaves */}
        <FloatingLeaf sx={{ top: '10%', left: '10%', animationDelay: '0s' }}>🍃</FloatingLeaf>
        <FloatingLeaf sx={{ top: '20%', right: '15%', animationDelay: '1s' }}>🌿</FloatingLeaf>
        <FloatingLeaf sx={{ bottom: '15%', left: '20%', animationDelay: '2s' }}>🍵</FloatingLeaf>
        <FloatingLeaf sx={{ bottom: '25%', right: '10%', animationDelay: '3s' }}>🍃</FloatingLeaf>

        <Container maxWidth="sm">
          <LoginCard>
            <LogoContainer>
              <LogoIcon>🍃</LogoIcon>
              <Box>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  Leaf Flow
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Панель управления
                </Typography>
              </Box>
            </LogoContainer>

            <Box textAlign="center" mb={4}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  mb: 2,
                }}
              >
                <LockOutlinedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              </Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Добро пожаловать
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Введите токен администратора для входа
              </Typography>
            </Box>

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  animation: 'shake 0.3s ease-in-out',
                  '@keyframes shake': {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '25%': { transform: 'translateX(-5px)' },
                    '75%': { transform: 'translateX(5px)' },
                  },
                }}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <StyledTextField
                fullWidth
                label="Токен доступа"
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                autoComplete="off"
                placeholder="Введите токен"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowToken(!showToken)}
                        edge="end"
                        sx={{ color: 'text.secondary' }}
                      >
                        {showToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 3 }}
              />
              <SubmitButton
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Войти в систему'
                )}
              </SubmitButton>
            </form>

            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              textAlign="center"
              mt={4}
            >
              © {new Date().getFullYear()} Leaf Flow. Все права защищены.
            </Typography>
          </LoginCard>
        </Container>
      </LoginWrapper>
    </>
  );
}

export default Login;
