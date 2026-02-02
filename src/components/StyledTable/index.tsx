import { styled, TableContainer, Box, alpha } from '@mui/material';

/**
 * Styled table container with consistent styling across all tables
 */
export const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  '& .MuiTableHead-root .MuiTableCell-root': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    borderBottom: 'none',
    fontWeight: 600,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: theme.palette.text.secondary,
    padding: theme.spacing(1.5, 2),
  },
  '& .MuiTableBody-root .MuiTableRow-root': {
    transition: theme.transitions.create('background-color', { duration: 150 }),
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.02),
    },
  },
  '& .MuiTableBody-root .MuiTableCell-root': {
    borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
    padding: theme.spacing(1.5, 2),
  },
  '& .MuiTableBody-root .MuiTableRow-root:last-child .MuiTableCell-root': {
    borderBottom: 'none',
  },
}));

/**
 * Mobile card container for list items
 */
export const MobileCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  transition: theme.transitions.create('background-color', { duration: 150 }),
  cursor: 'pointer',
  borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.02),
  },
  '&:last-child': {
    borderBottom: 'none',
  },
}));

/**
 * Action button wrapper with consistent styling
 */
export const ActionButton = styled(Box)<{ color?: 'primary' | 'error' | 'warning' | 'success' | 'info' }>(
  ({ theme, color = 'primary' }) => ({
    display: 'inline-flex',
    '& .MuiIconButton-root': {
      backgroundColor: alpha(theme.palette[color].main, 0.1),
      '&:hover': {
        backgroundColor: alpha(theme.palette[color].main, 0.2),
      },
    },
  })
);
