import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingStateProps {
  message?: string;
  minHeight?: string | number;
}

function LoadingState({ message = 'Загрузка...', minHeight = '400px' }: LoadingStateProps) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight={minHeight}
      gap={2}
    >
      <CircularProgress />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
}

export default LoadingState;
