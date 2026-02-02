import { ReactNode, useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  useTheme,
  useMediaQuery,
  Stack,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha,
  styled
} from '@mui/material';
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';
import { PAGINATION } from 'src/constants';

// Styled components for better table appearance
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  '& .MuiTable-root': {
    borderCollapse: 'collapse',
  },
  '& .MuiTableHead-root': {
    '& .MuiTableCell-root': {
      backgroundColor: alpha(theme.palette.primary.main, 0.04),
      borderBottom: 'none',
      fontWeight: 600,
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      color: theme.palette.text.secondary,
      padding: theme.spacing(1.5, 2),
    },
  },
  '& .MuiTableBody-root': {
    '& .MuiTableRow-root': {
      transition: 'background-color 0.15s ease-in-out',
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.02),
      },
    },
    '& .MuiTableCell-root': {
      borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
      padding: theme.spacing(1.5, 2),
      fontSize: '0.875rem',
    },
    '& .MuiTableRow-root:last-child .MuiTableCell-root': {
      borderBottom: 'none',
    },
  },
}));

const MobileCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  transition: 'background-color 0.15s ease-in-out',
  cursor: 'pointer',
  borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.02),
  },
  '&:last-child': {
    borderBottom: 'none',
  },
}));

const SearchBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  flexWrap: 'wrap',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
  },
}));

export interface FilterOption {
  value: string;
  label: string;
}

export interface DataTableColumn<T> {
  id: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  minWidth?: number;
  render: (row: T, index: number) => ReactNode;
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  title: string;
  data: T[];
  columns: DataTableColumn<T>[];
  keyExtractor: (row: T) => string | number;
  searchPlaceholder?: string;
  onSearch?: (term: string) => void;
  filters?: {
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  renderMobileCard?: (row: T, index: number) => ReactNode;
  onRowClick?: (row: T) => void;
  headerAction?: ReactNode;
  emptyMessage?: string;
}

function DataTable<T>({
  title,
  data,
  columns,
  keyExtractor,
  searchPlaceholder = 'Поиск...',
  onSearch,
  filters,
  renderMobileCard,
  onRowClick,
  headerAction,
  emptyMessage = 'Нет данных для отображения',
}: DataTableProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(PAGINATION.DEFAULT_PAGE_SIZE);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(0);
    onSearch?.(value);
  };

  const handleFilterChange = (filter: typeof filters[0], value: string) => {
    setPage(0);
    filter.onChange(value);
  };

  // Reset page when data changes (e.g., after filter)
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(data.length / limit) - 1);
    if (page > maxPage) {
      setPage(0);
    }
  }, [data.length, limit, page]);

  const paginatedData = data.slice(page * limit, page * limit + limit);

  const renderHeader = () => (
    <CardHeader
      title={
        <Typography variant="h5" fontWeight={600}>
          {title}
        </Typography>
      }
      action={headerAction}
      sx={{ pb: 0 }}
    />
  );

  const renderFilters = () => (
    <Box px={2} py={2}>
      <SearchBar>
        {onSearch !== undefined && (
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            sx={{ 
              minWidth: 200,
              flex: isMobile ? 1 : 'none',
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchTwoToneIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
        )}
        {filters?.map((filter) => (
          <FormControl key={filter.label} size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{filter.label}</InputLabel>
            <Select
              value={filter.value}
              onChange={(e) => handleFilterChange(filter, e.target.value)}
              label={filter.label}
            >
              {filter.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ))}
      </SearchBar>
    </Box>
  );

  const renderMobileView = () => (
    <Box>
      {paginatedData.length === 0 ? (
        <Box py={6} textAlign="center">
          <Typography color="text.secondary">{emptyMessage}</Typography>
        </Box>
      ) : (
        paginatedData.map((row, index) => (
          <MobileCard
            key={keyExtractor(row)}
            onClick={() => onRowClick?.(row)}
            sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
          >
            {renderMobileCard ? (
              renderMobileCard(row, index)
            ) : (
              <Stack spacing={1}>
                {columns
                  .filter((col) => !col.hideOnMobile)
                  .map((column) => (
                    <Box key={column.id} display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {column.label}
                      </Typography>
                      <Box>{column.render(row, index)}</Box>
                    </Box>
                  ))}
              </Stack>
            )}
          </MobileCard>
        ))
      )}
    </Box>
  );

  const renderDesktopView = () => (
    <StyledTableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                align={column.align || 'left'}
                sx={{ minWidth: column.minWidth }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                <Typography color="text.secondary">{emptyMessage}</Typography>
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((row, index) => (
              <TableRow
                key={keyExtractor(row)}
                hover
                onClick={() => onRowClick?.(row)}
                sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((column) => (
                  <TableCell key={column.id} align={column.align || 'left'}>
                    {column.render(row, index)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </StyledTableContainer>
  );

  const renderPagination = () => (
    <Box
      px={2}
      py={1.5}
      display="flex"
      justifyContent="flex-end"
      sx={{
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: alpha(theme.palette.background.default, 0.5),
      }}
    >
      <TablePagination
        component="div"
        count={data.length}
        page={page}
        rowsPerPage={limit}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setLimit(parseInt(e.target.value));
          setPage(0);
        }}
        rowsPerPageOptions={isMobile ? [5, 10] : PAGINATION.PAGE_SIZE_OPTIONS}
        labelRowsPerPage={isMobile ? '' : 'На странице:'}
        sx={{
          '& .MuiTablePagination-toolbar': {
            minHeight: 'auto',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          },
          '& .MuiTablePagination-selectLabel': {
            display: isMobile ? 'none' : 'block',
          },
        }}
      />
    </Box>
  );

  return (
    <Card
      sx={{
        overflow: 'hidden',
      }}
    >
      {renderHeader()}
      {(onSearch !== undefined || (filters && filters.length > 0)) && (
        <>
          {renderFilters()}
          <Divider />
        </>
      )}
      {isMobile ? renderMobileView() : renderDesktopView()}
      {data.length > 0 && renderPagination()}
    </Card>
  );
}

export default DataTable;
