"use client";

import {
  Box,
  Checkbox,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import { ChangeEvent, useMemo, useState } from "react";

export type ExpenseRow = {
  id: string;
  amount: number;
  category: string;
  paymentMethod: string;
  description: string;
  date: string;
  receiptName?: string;
};

type ExpensesTableProps = {
  rows: ExpenseRow[];
};

type Order = "asc" | "desc";
type SortableColumn = "amount" | "category" | "paymentMethod" | "description" | "date";

const headCells: Array<{
  id: SortableColumn;
  label: string;
  align?: "left" | "right";
}> = [
  { id: "amount", label: "Amount", align: "right" },
  { id: "category", label: "Category" },
  { id: "paymentMethod", label: "Payment Method" },
  { id: "description", label: "Description" },
  { id: "date", label: "Date" },
];

function compareValues(a: ExpenseRow, b: ExpenseRow, orderBy: SortableColumn): number {
  if (orderBy === "amount") {
    return a.amount - b.amount;
  }
  return String(a[orderBy]).localeCompare(String(b[orderBy]));
}

function getDescriptionPreview(description: string): string {
  return description.trim() ? description : "No description";
}

export function ExpensesTable({ rows }: ExpensesTableProps) {
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<SortableColumn>("date");
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const sortedRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const base = compareValues(a, b, orderBy);
      return order === "asc" ? base : -base;
    });
    return sorted;
  }, [order, orderBy, rows]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return sortedRows.slice(start, end);
  }, [page, rowsPerPage, sortedRows]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number(event.target.value));
    setPage(0);
  };

  const handleRequestSort = (property: SortableColumn) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(paginatedRows.map((row) => row.id));
      return;
    }
    setSelectedIds([]);
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
    );
  };

  const numSelected = selectedIds.length;
  const rowCount = paginatedRows.length;

  return (
    <Paper
      sx={{ width: "100%", overflow: "hidden", borderRadius: 2, boxShadow: "none" }}
      variant="outlined"
    >
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        {numSelected > 0 ? (
          <Typography sx={{ flex: "1 1 100%" }} variant="subtitle1" component="div">
            {numSelected} selected
          </Typography>
        ) : (
          <Typography sx={{ flex: "1 1 100%" }} variant="h6" component="div">
            Expenses
          </Typography>
        )}
        <Tooltip title="Filter list">
          <IconButton>
            <FilterListIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
      <TableContainer>
        <Table size="small" aria-label="expenses table">
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafc" }}>
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={numSelected > 0 && numSelected < rowCount}
                  checked={rowCount > 0 && numSelected === rowCount}
                  onChange={handleSelectAllClick}
                  slotProps={{ input: { "aria-label": "select all expenses" } }}
                />
              </TableCell>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  align={headCell.align ?? "left"}
                  sortDirection={orderBy === headCell.id ? order : false}
                  sx={{ fontWeight: 700 }}
                >
                  <TableSortLabel
                    active={orderBy === headCell.id}
                    direction={orderBy === headCell.id ? order : "asc"}
                    onClick={() => handleRequestSort(headCell.id)}
                  >
                    {headCell.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: 700 }}>Receipt</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.map((row) => (
              <TableRow
                key={row.id}
                hover
                selected={selectedIds.includes(row.id)}
                onClick={() => handleSelectRow(row.id)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    checked={selectedIds.includes(row.id)}
                    slotProps={{ input: { "aria-label": `select expense ${row.id}` } }}
                  />
                </TableCell>
                <TableCell align="right">
                  ${row.amount.toFixed(2)}
                </TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell>{row.paymentMethod}</TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    noWrap
                    title={getDescriptionPreview(row.description)}
                    sx={{ maxWidth: 260 }}
                  >
                    {getDescriptionPreview(row.description)}
                  </Typography>
                </TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    noWrap
                    title={row.receiptName ?? "No file"}
                    sx={{ maxWidth: 180 }}
                  >
                    {row.receiptName ?? "No file"}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ borderTop: "1px solid #e2e8f0" }}>
        <TablePagination
          component="div"
          count={sortedRows.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Box>
    </Paper>
  );
}
