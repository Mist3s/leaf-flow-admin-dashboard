import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Box,
  Avatar,
  Typography,
  Skeleton,
  useTheme,
  alpha,
  styled
} from '@mui/material';

export interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  color: 'primary' | 'success' | 'warning' | 'info' | 'error';
  link?: string;
  loading?: boolean;
  onClick?: () => void;
}

const StyledCard = styled(Card)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

function StatCard({ title, value, icon, color, link, loading, onClick }: StatCardProps) {
  const theme = useTheme();
  const navigate = useNavigate();

  const colorMap = {
    primary: theme.palette.primary,
    success: theme.palette.success,
    warning: theme.palette.warning,
    info: theme.palette.info,
    error: theme.palette.error,
  };

  const selectedColor = colorMap[color];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (link) {
      navigate(link);
    }
  };

  return (
    <StyledCard onClick={handleClick}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            {loading ? (
              <>
                <Skeleton variant="text" width={60} height={40} />
                <Skeleton variant="text" width={80} height={24} />
              </>
            ) : (
              <>
                <Typography variant="h3" fontWeight={700}>
                  {value.toLocaleString('ru-RU')}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  {title}
                </Typography>
              </>
            )}
          </Box>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              backgroundColor: alpha(selectedColor.main, 0.12),
              color: selectedColor.main,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </StyledCard>
  );
}

export default StatCard;
