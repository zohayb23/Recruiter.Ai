import React from 'react';
import { Box, Pagination, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

interface ResultsPaginationProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
}

const ResultsPagination: React.FC<ResultsPaginationProps> = ({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mt: 3,
        mb: 2,
      }}
    >
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Results per page</InputLabel>
        <Select
          value={rowsPerPage}
          label="Results per page"
          onChange={(e) => onRowsPerPageChange(e.target.value as number)}
        >
          <MenuItem value={5}>5</MenuItem>
          <MenuItem value={10}>10</MenuItem>
          <MenuItem value={25}>25</MenuItem>
          <MenuItem value={50}>50</MenuItem>
        </Select>
      </FormControl>

      <Pagination
        count={Math.ceil(count / rowsPerPage)}
        page={page}
        onChange={(_, value) => onPageChange(value)}
        color="primary"
        showFirstButton
        showLastButton
      />
    </Box>
  );
};

export default ResultsPagination; 