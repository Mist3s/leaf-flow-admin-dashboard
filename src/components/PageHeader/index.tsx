import { Box, Typography, Button, useTheme, useMediaQuery } from '@mui/material';
import ArrowBackTwoToneIcon from '@mui/icons-material/ArrowBackTwoTone';
import { useNavigate } from 'react-router-dom';
import PageTitleWrapper from '../PageTitleWrapper';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backUrl?: string;
  action?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
}

function PageHeader({ title, subtitle, backUrl, action }: PageHeaderProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <PageTitleWrapper>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={isMobile ? 'flex-start' : 'center'}
        flexDirection={isMobile ? 'column' : 'row'}
        gap={2}
      >
        <Box display="flex" alignItems="center" gap={2}>
          {backUrl && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<ArrowBackTwoToneIcon />}
              onClick={() => navigate(backUrl)}
            >
              Назад
            </Button>
          )}
          <Box>
            <Typography variant="h3" component="h3" gutterBottom={!!subtitle}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="subtitle2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {action && (
          <Button
            variant="contained"
            startIcon={action.icon}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
      </Box>
    </PageTitleWrapper>
  );
}

export default PageHeader;
