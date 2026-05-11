"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  Box,
  Checkbox,
  IconButton,
  Paper,
  Slider,
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
import { ChangeEvent, useEffect, useMemo, useState } from "react";

export type ExpenseRow = {
  id: string;
  amount: number;
  category: string;
  paymentMethod: string;
  description: string;
  date: string;
  receiptName?: string;
  receiptMimeType?: string | null;
};

type ExpensesTableProps = {
  rows: ExpenseRow[];
  onEditExpense?: (row: ExpenseRow) => void;
  onDeleteExpense?: (row: ExpenseRow) => void;
  onViewReceipt?: (row: ExpenseRow) => void;
  viewingReceiptId?: string | null;
  onSelectedIdsChange?: (ids: string[]) => void;
  onCurrentPageRowsChange?: (rows: ExpenseRow[]) => void;
};

type Order = "asc" | "desc";
type SortableColumn = "amount" | "category" | "paymentMethod" | "description" | "date";

type AppliedFilters = {
  amountMin: number | "";
  amountMax: number | "";
  categories: string[];
  paymentMethods: string[];
  dateFrom: string;
  dateTo: string;
};

const emptyFilters: AppliedFilters = {
  amountMin: "",
  amountMax: "",
  categories: [],
  paymentMethods: [],
  dateFrom: "",
  dateTo: "",
};

const FILTER_OPTION_PREVIEW = 6;

function receiptRowShowsViewAction(row: ExpenseRow): boolean {
  const name = row.receiptName?.trim();
  return Boolean(row.receiptMimeType || name);
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

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

function passesFilters(row: ExpenseRow, f: AppliedFilters): boolean {
  if (f.amountMin !== "" && !Number.isNaN(f.amountMin) && row.amount < f.amountMin) {
    return false;
  }
  if (f.amountMax !== "" && !Number.isNaN(f.amountMax) && row.amount > f.amountMax) {
    return false;
  }
  if (f.categories.length > 0 && !f.categories.includes(row.category)) {
    return false;
  }
  if (f.paymentMethods.length > 0 && !f.paymentMethods.includes(row.paymentMethod)) {
    return false;
  }
  if (f.dateFrom && row.date < f.dateFrom) {
    return false;
  }
  if (f.dateTo && row.date > f.dateTo) {
    return false;
  }
  return true;
}

function filtersActive(f: AppliedFilters): boolean {
  return (
    f.amountMin !== "" ||
    f.amountMax !== "" ||
    f.categories.length > 0 ||
    f.paymentMethods.length > 0 ||
    Boolean(f.dateFrom) ||
    Boolean(f.dateTo)
  );
}

function cloneFilters(f: AppliedFilters): AppliedFilters {
  return {
    amountMin: f.amountMin,
    amountMax: f.amountMax,
    categories: [...f.categories],
    paymentMethods: [...f.paymentMethods],
    dateFrom: f.dateFrom,
    dateTo: f.dateTo,
  };
}

function multiselectSummary(selected: string[], whenEmpty: string): string {
  if (selected.length === 0) return whenEmpty;
  if (selected.length <= 2) return selected.join(", ");
  return `${selected.length} selected`;
}

function formatUsdAmount(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export function ExpensesTable({
  rows,
  onEditExpense,
  onDeleteExpense,
  onViewReceipt,
  viewingReceiptId,
  onSelectedIdsChange,
  onCurrentPageRowsChange,
}: ExpensesTableProps) {
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<SortableColumn>("date");
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(emptyFilters);
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(emptyFilters);
  const [categorySectionOpen, setCategorySectionOpen] = useState(true);
  const [paymentSectionOpen, setPaymentSectionOpen] = useState(false);
  const [showAllCategoryOptions, setShowAllCategoryOptions] = useState(false);
  const [showAllPaymentOptions, setShowAllPaymentOptions] = useState(false);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(r.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const paymentMethodOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(r.paymentMethod));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const rowIdSet = useMemo(() => new Set(rows.map((r) => r.id)), [rows]);

  const amountExtent = useMemo(() => {
    if (rows.length === 0) return null;
    const vals = rows.map((r) => r.amount);
    const min = Math.min(...vals);
    let max = Math.max(...vals);
    if (min === max) {
      max = min + 1;
    }
    return { min, max };
  }, [rows]);

  const amountSliderValue = useMemo((): [number, number] => {
    if (!amountExtent) return [0, 100];
    const { min: emin, max: emax } = amountExtent;
    const rawLo = draftFilters.amountMin === "" ? emin : Number(draftFilters.amountMin);
    const rawHi = draftFilters.amountMax === "" ? emax : Number(draftFilters.amountMax);
    const lo = Math.min(Math.max(rawLo, emin), emax);
    const hi = Math.min(Math.max(rawHi, emin), emax);
    return lo <= hi ? [lo, hi] : [hi, lo];
  }, [amountExtent, draftFilters.amountMin, draftFilters.amountMax]);

  const draftResultCount = useMemo(
    () => rows.filter((row) => passesFilters(row, draftFilters)).length,
    [rows, draftFilters]
  );

  const filteredRows = useMemo(
    () => rows.filter((row) => passesFilters(row, appliedFilters)),
    [rows, appliedFilters]
  );

  const sortedRows = useMemo(() => {
    const sorted = [...filteredRows].sort((a, b) => {
      const base = compareValues(a, b, orderBy);
      return order === "asc" ? base : -base;
    });
    return sorted;
  }, [filteredRows, order, orderBy]);

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
    setSelectedIds((prev) => {
      const next = prev.filter((selectedId) => rowIdSet.has(selectedId));
      return next.includes(id)
        ? next.filter((selectedId) => selectedId !== id)
        : [...next, id];
    });
  };

  const openFilterDialog = () => {
    setDraftFilters(cloneFilters(appliedFilters));
    setCategorySectionOpen(true);
    setPaymentSectionOpen(false);
    setShowAllCategoryOptions(false);
    setShowAllPaymentOptions(false);
    setFilterOpen(true);
  };

  const clearDraftFilters = () => {
    setDraftFilters({ ...emptyFilters });
  };

  const handleFilterSave = () => {
    let next = cloneFilters(draftFilters);
    if (
      next.amountMin !== "" &&
      next.amountMax !== "" &&
      !Number.isNaN(next.amountMin) &&
      !Number.isNaN(next.amountMax) &&
      next.amountMin > next.amountMax
    ) {
      const swap = next.amountMin;
      next = { ...next, amountMin: next.amountMax, amountMax: swap };
    }
    if (next.dateFrom && next.dateTo && next.dateFrom > next.dateTo) {
      next = { ...next, dateFrom: next.dateTo, dateTo: next.dateFrom };
    }
    setAppliedFilters(next);
    setPage(0);
    setSelectedIds([]);
    setFilterOpen(false);
  };

  const handleFilterCancel = () => {
    setFilterOpen(false);
  };

  const toggleDraftCategory = (value: string) => {
    setDraftFilters((prev) => {
      const next = prev.categories.includes(value)
        ? prev.categories.filter((c) => c !== value)
        : [...prev.categories, value];
      return { ...prev, categories: next };
    });
  };

  const toggleDraftPaymentMethod = (value: string) => {
    setDraftFilters((prev) => {
      const next = prev.paymentMethods.includes(value)
        ? prev.paymentMethods.filter((p) => p !== value)
        : [...prev.paymentMethods, value];
      return { ...prev, paymentMethods: next };
    });
  };

  const handleAmountRangeSliderChange = (_event: Event, value: number | number[]) => {
    if (!amountExtent) return;
    const [a, b] = value as number[];
    const { min: emin, max: emax } = amountExtent;
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    if (lo <= emin && hi >= emax) {
      setDraftFilters((prev) => ({ ...prev, amountMin: "", amountMax: "" }));
      return;
    }
    setDraftFilters((prev) => ({ ...prev, amountMin: lo, amountMax: hi }));
  };

  const validSelectedIds = useMemo(
    () => selectedIds.filter((id) => rowIdSet.has(id)),
    [selectedIds, rowIdSet]
  );

  const numSelected = validSelectedIds.length;
  const rowCount = paginatedRows.length;
  const hasActiveFilters = filtersActive(appliedFilters);

  useEffect(() => {
    onSelectedIdsChange?.([...validSelectedIds]);
  }, [validSelectedIds, onSelectedIdsChange]);

  useEffect(() => {
    onCurrentPageRowsChange?.(paginatedRows);
  }, [paginatedRows, onCurrentPageRowsChange]);

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
            {hasActiveFilters ? (
              <Typography
                component="span"
                variant="caption"
                sx={{ ml: 1, color: "primary.main", fontWeight: 600 }}
              >
                (filtered)
              </Typography>
            ) : null}
          </Typography>
        )}
        <Tooltip title="Filter expenses">
          <IconButton
            onClick={openFilterDialog}
            color={hasActiveFilters ? "primary" : "default"}
            aria-label="open filters"
          >
            <FilterListIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>

      {filterOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="expense-filter-title"
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 id="expense-filter-title" className="text-lg font-semibold text-slate-900">
                Filter & Sort
              </h3>
              <button
                type="button"
                onClick={handleFilterCancel}
                className="rounded-md px-2 py-1 text-slate-500 transition hover:bg-slate-100"
                aria-label="Close filter dialog"
              >
                ×
              </button>
            </div>

            <div className="space-y-0 border-t border-slate-200">
              <div className="border-b border-slate-200 py-4">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-800">Amount</p>
                {!amountExtent ? (
                  <p className="mt-2 text-sm text-slate-500">No expenses loaded yet to set an amount range.</p>
                ) : (
                  <>
                    <Box sx={{ px: 0.5, pt: 2, pb: 1 }}>
                      <Slider
                        value={amountSliderValue}
                        onChange={handleAmountRangeSliderChange}
                        valueLabelDisplay="off"
                        min={amountExtent.min}
                        max={amountExtent.max}
                        step={0.01}
                        disableSwap
                        sx={{
                          color: "#0f172a",
                          height: 6,
                          "& .MuiSlider-track": {
                            border: "none",
                            backgroundColor: "#0f172a",
                          },
                          "& .MuiSlider-rail": {
                            opacity: 1,
                            backgroundColor: "#e2e8f0",
                          },
                          "& .MuiSlider-thumb": {
                            width: 22,
                            height: 22,
                            backgroundColor: "#0f172a",
                            border: "3px solid #fff",
                            boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.3)",
                            "&:hover, &.Mui-focusVisible": {
                              boxShadow: "0 0 0 6px rgba(15, 23, 42, 0.14)",
                            },
                          },
                        }}
                      />
                    </Box>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatUsdAmount(amountSliderValue[0])} –{" "}
                      {amountSliderValue[1] >= amountExtent.max - 1e-9
                        ? `${formatUsdAmount(amountSliderValue[1])}+`
                        : formatUsdAmount(amountSliderValue[1])}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Drag either end to narrow the range. Full span includes all amounts.
                    </p>
                  </>
                )}
              </div>

              <div className="border-b border-slate-200 py-4">
                <p className="mb-3 text-sm font-semibold text-slate-900">Date</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="filter-date-from" className="mb-1 block text-sm font-medium text-slate-700">
                      From
                    </label>
                    <input
                      id="filter-date-from"
                      type="date"
                      value={draftFilters.dateFrom}
                      onChange={(e) =>
                        setDraftFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="filter-date-to" className="mb-1 block text-sm font-medium text-slate-700">
                      To
                    </label>
                    <input
                      id="filter-date-to"
                      type="date"
                      value={draftFilters.dateTo}
                      onChange={(e) =>
                        setDraftFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="border-b border-slate-200">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 py-3 text-left"
                  onClick={() => setCategorySectionOpen((o) => !o)}
                  aria-expanded={categorySectionOpen}
                >
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">Category</span>
                    {!categorySectionOpen ? (
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {multiselectSummary(draftFilters.categories, "All categories")}
                      </span>
                    ) : null}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${categorySectionOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {categorySectionOpen ? (
                  <div className="pb-4">
                    <p className="mb-3 text-xs text-slate-500">
                      Leave none selected to include all categories.
                    </p>
                    {categoryOptions.length === 0 ? (
                      <p className="text-sm text-slate-500">No categories in loaded data.</p>
                    ) : (
                      <>
                        <ul className="space-y-2">
                          {(showAllCategoryOptions
                            ? categoryOptions
                            : categoryOptions.slice(0, FILTER_OPTION_PREVIEW)
                          ).map((opt) => (
                            <li key={opt}>
                              <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-900">
                                <input
                                  type="checkbox"
                                  checked={draftFilters.categories.includes(opt)}
                                  onChange={() => toggleDraftCategory(opt)}
                                  className="h-4 w-4 shrink-0 rounded border-2 border-slate-400 text-slate-900 focus:ring-2 focus:ring-blue-100"
                                />
                                <span>{opt}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                        {categoryOptions.length > FILTER_OPTION_PREVIEW ? (
                          <button
                            type="button"
                            onClick={() => setShowAllCategoryOptions((v) => !v)}
                            className="mt-3 text-sm font-semibold text-slate-900 underline decoration-slate-900 underline-offset-2 hover:text-slate-700"
                          >
                            {showAllCategoryOptions
                              ? "Show less"
                              : `+ Show ${categoryOptions.length - FILTER_OPTION_PREVIEW} more`}
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="border-b border-slate-200">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 py-3 text-left"
                  onClick={() => setPaymentSectionOpen((o) => !o)}
                  aria-expanded={paymentSectionOpen}
                >
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">Payment method</span>
                    {!paymentSectionOpen ? (
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {multiselectSummary(draftFilters.paymentMethods, "All methods")}
                      </span>
                    ) : null}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${paymentSectionOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {paymentSectionOpen ? (
                  <div className="pb-4">
                    <p className="mb-3 text-xs text-slate-500">
                      Leave none selected to include all methods.
                    </p>
                    {paymentMethodOptions.length === 0 ? (
                      <p className="text-sm text-slate-500">No payment methods in loaded data.</p>
                    ) : (
                      <>
                        <ul className="space-y-2">
                          {(showAllPaymentOptions
                            ? paymentMethodOptions
                            : paymentMethodOptions.slice(0, FILTER_OPTION_PREVIEW)
                          ).map((opt) => (
                            <li key={opt}>
                              <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-900">
                                <input
                                  type="checkbox"
                                  checked={draftFilters.paymentMethods.includes(opt)}
                                  onChange={() => toggleDraftPaymentMethod(opt)}
                                  className="h-4 w-4 shrink-0 rounded border-2 border-slate-400 text-slate-900 focus:ring-2 focus:ring-blue-100"
                                />
                                <span>{opt}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                        {paymentMethodOptions.length > FILTER_OPTION_PREVIEW ? (
                          <button
                            type="button"
                            onClick={() => setShowAllPaymentOptions((v) => !v)}
                            className="mt-3 text-sm font-semibold text-slate-900 underline decoration-slate-900 underline-offset-2 hover:text-slate-700"
                          >
                            {showAllPaymentOptions
                              ? "Show less"
                              : `+ Show ${paymentMethodOptions.length - FILTER_OPTION_PREVIEW} more`}
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={clearDraftFilters}
                className="rounded-lg border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Clear filters
              </button>
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={handleFilterCancel}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFilterSave}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  See ({draftResultCount}) Results
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
                  sx={{
                    fontWeight: 700,
                    ...(headCell.id === "date"
                      ? { minWidth: 120, whiteSpace: "nowrap" }
                      : {}),
                  }}
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
              <TableCell align="right" sx={{ fontWeight: 700, width: 1, whiteSpace: "nowrap" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.map((row) => (
              <TableRow
                key={row.id}
                hover
                selected={validSelectedIds.includes(row.id)}
                onClick={() => handleSelectRow(row.id)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    checked={validSelectedIds.includes(row.id)}
                    slotProps={{ input: { "aria-label": `select expense ${row.id}` } }}
                  />
                </TableCell>
                <TableCell align="right">${row.amount.toFixed(2)}</TableCell>
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
                <TableCell sx={{ minWidth: 120, whiteSpace: "nowrap" }}>
                  {row.date}
                </TableCell>
                <TableCell sx={{ maxWidth: 240 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.25,
                      minWidth: 0,
                    }}
                  >
                    <Typography
                      variant="body2"
                      noWrap
                      component="span"
                      title={row.receiptName ?? "No file"}
                      sx={{ flex: 1, minWidth: 0 }}
                    >
                      {row.receiptName ?? "No file"}
                    </Typography>
                    {receiptRowShowsViewAction(row) ? (
                      <Tooltip
                        title={
                          row.receiptMimeType
                            ? "View receipt"
                            : "No file uploaded — CSV/import may list a name only. Edit and attach a receipt to preview."
                        }
                      >
                        <IconButton
                          size="small"
                          aria-label={`View receipt ${row.receiptName ?? row.id}`}
                          disabled={viewingReceiptId === row.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewReceipt?.(row);
                          }}
                          sx={{
                            flexShrink: 0,
                            color: row.receiptMimeType
                              ? "text.secondary"
                              : "action.disabled",
                          }}
                        >
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                  </Box>
                </TableCell>
                <TableCell
                  align="right"
                  padding="checkbox"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: 1,
                    }}
                  >
                    <Tooltip title="Edit expense">
                      <IconButton
                        size="small"
                        aria-label={`edit expense ${row.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditExpense?.(row);
                        }}
                        sx={{ color: "text.secondary" }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete expense">
                      <IconButton
                        size="small"
                        aria-label={`delete expense ${row.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteExpense?.(row);
                        }}
                        sx={{ color: "text.secondary" }}
                      >
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
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
