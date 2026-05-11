"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ExpensesTable, type ExpenseRow } from "@/components/expenses/expenses-table";
import {
  createExpense,
  deleteExpense,
  fetchExpenseReceipt,
  listExpenses,
  mapApiExpenseToRow,
  updateExpense,
} from "@/lib/expenses";
import { notify } from "@/lib/toast";

const categoryOptions = [
  "Petrol/Gas",
  "Car EMI",
  "Food",
  "Grocery",
  "Restaurant",
  "Utilities",
  "Rent",
  "Entertainment",
  "Healthcare",
  "Transport",
  "Education",
  "Shopping",
  "Others",
];

const paymentMethodOptions = [
  "Cash",
  "Debit Card",
  "Credit Card",
  "UPI",
  "Bank Transfer",
  "Net Banking",
];

type ExpenseFormState = {
  amount: number | "";
  category: string | "";
  paymentMethod: string | "";
  description: string;
  date: string;
  receipt: File | null;
  /** When editing, filename already stored on the server if user does not pick a new file */
  existingReceiptName: string | null;
};

type ExportScope = "selected" | "current-page" | "all";

const initialExpenseForm: ExpenseFormState = {
  amount: "",
  category: "",
  paymentMethod: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
  receipt: null,
  existingReceiptName: null,
};

function toCsvField(value: string): string {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replaceAll("\"", "\"\"")}"`;
  }
  return value;
}

function buildExpensesCsv(rows: ExpenseRow[]): string {
  const header = [
    "Amount",
    "Category",
    "Payment Method",
    "Date",
    "Description",
    "Receipt Name",
  ];
  const lines = rows.map((row) =>
    [
      row.amount.toFixed(2),
      row.category,
      row.paymentMethod,
      row.date,
      row.description ?? "",
      row.receiptName ?? "",
    ]
      .map((v) => toCsvField(String(v)))
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

function buildSampleExpensesCsv(): string {
  const sampleRow: ExpenseRow = {
    id: "sample",
    amount: 125.5,
    category: "Food",
    paymentMethod: "UPI",
    date: new Date().toISOString().slice(0, 10),
    description: "Lunch with team",
    receiptName: "sample-receipt.jpg",
  };
  return buildExpensesCsv([sampleRow]);
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === "\"") {
      if (inQuotes && line[i + 1] === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

function normalizeCsvHeader(header: string): string {
  return header.toLowerCase().replace(/[\s_]+/g, "");
}

export default function ExpensesPage() {
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseEditId, setExpenseEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseFormState>(initialExpenseForm);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    amount?: string;
    category?: string;
    paymentMethod?: string;
    date?: string;
    receipt?: string;
  }>({});
  const [fileInputKey, setFileInputKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportScope, setExportScope] = useState<ExportScope>("selected");
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [currentPageExpenses, setCurrentPageExpenses] = useState<ExpenseRow[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<{
    url: string;
    mimeType: string;
    name: string;
  } | null>(null);
  const [viewingReceiptId, setViewingReceiptId] = useState<string | null>(null);

  const isEditMode = expenseEditId !== null;

  const closeReceiptPreview = useCallback(() => {
    setReceiptPreview((prev) => {
      if (prev?.url) {
        URL.revokeObjectURL(prev.url);
      }
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (receiptPreview?.url) {
        URL.revokeObjectURL(receiptPreview.url);
      }
    };
  }, [receiptPreview?.url]);

  const handleViewReceipt = useCallback(async (row: ExpenseRow) => {
    if (!row.receiptMimeType?.trim()) {
      notify.warning(
        "There is no receipt file saved for this expense yet. Edit it and attach a PDF or image, or imported rows may list a filename without a stored file.",
      );
      return;
    }
    setViewingReceiptId(row.id);
    try {
      const { blob, mimeType } = await fetchExpenseReceipt(Number(row.id));
      setReceiptPreview((prev) => {
        if (prev?.url) {
          URL.revokeObjectURL(prev.url);
        }
        return {
          url: URL.createObjectURL(blob),
          mimeType,
          name: row.receiptName ?? "Receipt",
        };
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load receipt.";
      notify.error(message);
    } finally {
      setViewingReceiptId(null);
    }
  }, []);

  const categorySelectOptions = useMemo(() => {
    const extra =
      form.category && !categoryOptions.includes(form.category) ? [form.category] : [];
    return [...categoryOptions, ...extra];
  }, [form.category]);

  const paymentSelectOptions = useMemo(() => {
    const extra =
      form.paymentMethod && !paymentMethodOptions.includes(form.paymentMethod)
        ? [form.paymentMethod]
        : [];
    return [...paymentMethodOptions, ...extra];
  }, [form.paymentMethod]);

  const selectedExpenses = useMemo(() => {
    if (selectedExpenseIds.length === 0) return [];
    const selectedSet = new Set(selectedExpenseIds);
    return expenses.filter((row) => selectedSet.has(row.id));
  }, [expenses, selectedExpenseIds]);

  const loadExpenses = useCallback(async (options?: { silent?: boolean }) => {
    setListError(null);
    if (!options?.silent) {
      setListLoading(true);
    }
    try {
      const result = await listExpenses({ page: 1, limit: 100 });
      setExpenses(result.data.map(mapApiExpenseToRow));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load expenses.";
      setListError(message);
      setExpenses([]);
    } finally {
      if (!options?.silent) {
        setListLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadExpenses();
    });
  }, [loadExpenses]);

  const validateForm = () => {
    const errors: {
      amount?: string;
      category?: string;
      paymentMethod?: string;
      date?: string;
      receipt?: string;
    } = {};

    if (form.amount === "" || Number.isNaN(form.amount) || form.amount <= 0) {
      errors.amount = "Amount is required.";
    }
    if (!form.category) {
      errors.category = "Category is required.";
    }
    if (!form.paymentMethod) {
      errors.paymentMethod = "Payment method is required.";
    }
    if (!form.date) {
      errors.date = "Date is required.";
    }
    if (
      form.receipt &&
      ![
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
      ].includes(form.receipt.type)
    ) {
      errors.receipt = "Receipt must be an image or PDF.";
    }

    return errors;
  };

  const onReceiptChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setForm((prev) => ({ ...prev, receipt: selectedFile }));

    if (fieldErrors.receipt) {
      setFieldErrors((prev) => ({ ...prev, receipt: undefined }));
    }
  };

  const closeExpenseDialog = () => {
    setExpenseDialogOpen(false);
    setExpenseEditId(null);
    setForm(initialExpenseForm);
    setFileInputKey((prev) => prev + 1);
    setFieldErrors({});
    setSubmitError(null);
  };

  const openAddExpenseDialog = () => {
    setExpenseEditId(null);
    setForm(initialExpenseForm);
    setFileInputKey((prev) => prev + 1);
    setFieldErrors({});
    setSubmitError(null);
    setExpenseDialogOpen(true);
  };

  const openEditExpenseDialog = (row: ExpenseRow) => {
    setExpenseEditId(row.id);
    setForm({
      amount: row.amount,
      category: row.category,
      paymentMethod: row.paymentMethod,
      description: row.description,
      date: row.date.slice(0, 10),
      receipt: null,
      existingReceiptName: row.receiptName ?? null,
    });
    setFileInputKey((prev) => prev + 1);
    setFieldErrors({});
    setSubmitError(null);
    setExpenseDialogOpen(true);
  };

  const onSubmitExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    const validationErrors = validateForm();
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const receiptName = form.receipt?.name ?? form.existingReceiptName ?? null;

    try {
      setSubmitLoading(true);
      if (isEditMode && expenseEditId) {
        await updateExpense(
          Number(expenseEditId),
          {
            amount: Number(form.amount),
            category: form.category,
            paymentMethod: form.paymentMethod,
            description: form.description.trim(),
            date: form.date,
            receiptName,
          },
          form.receipt
        );
      } else {
        await createExpense(
          {
            amount: Number(form.amount),
            category: form.category,
            paymentMethod: form.paymentMethod,
            description: form.description.trim(),
            date: form.date,
            receiptName,
          },
          form.receipt
        );
      }
      closeExpenseDialog();
      await loadExpenses({ silent: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save expense.";
      setSubmitError(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const confirmDeleteExpense = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      await deleteExpense(Number(deleteTarget.id));
      if (expenseEditId === deleteTarget.id) {
        closeExpenseDialog();
      }
      setDeleteTarget(null);
      await loadExpenses({ silent: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete expense.";
      setDeleteError(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportExpenses = () => {
    const rowsToExport =
      exportScope === "selected"
        ? selectedExpenses
        : exportScope === "current-page"
          ? currentPageExpenses
          : expenses;

    if (rowsToExport.length === 0) {
      notify.warning("No expenses available for selected export scope.");
      return;
    }

    const csv = buildExpensesCsv(rowsToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expense_CSV_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setExportDialogOpen(false);
    notify.success(`Exported ${rowsToExport.length} expense(s) to CSV.`);
  };

  const downloadSampleCsv = () => {
    const csv = buildSampleExpensesCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "expense_CSV_sample.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const triggerImportPicker = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImportLoading(true);

    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        throw new Error("CSV must include a header and at least one row.");
      }

      const headers = parseCsvLine(lines[0]).map((h) => normalizeCsvHeader(h));
      const required = ["amount", "category", "paymentmethod", "date"];
      const missing = required.filter((key) => !headers.includes(key));
      if (missing.length > 0) {
        throw new Error(`Missing required CSV columns: ${missing.join(", ")}`);
      }

      let success = 0;
      let failed = 0;
      for (let i = 1; i < lines.length; i += 1) {
        const values = parseCsvLine(lines[i]);
        const rowData: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowData[h] = values[idx] ?? "";
        });

        const amount = Number(rowData.amount);
        const category = rowData.category;
        const paymentMethod = rowData.paymentmethod;
        const date = rowData.date;
        const description = rowData.description ?? "";
        const receiptName = rowData.receiptname ? rowData.receiptname : null;

        if (!Number.isFinite(amount) || amount <= 0 || !category || !paymentMethod || !date) {
          failed += 1;
          continue;
        }

        try {
          await createExpense({
            amount,
            category,
            paymentMethod,
            date,
            description,
            receiptName,
          });
          success += 1;
        } catch {
          failed += 1;
        }
      }

      await loadExpenses({ silent: true });
      if (success > 0 && failed > 0) {
        notify.warning(`Imported ${success} expense(s). Skipped ${failed} invalid row(s).`);
      } else if (success > 0) {
        notify.success(`Imported ${success} expense(s) successfully.`);
      } else {
        notify.warning("No valid rows were imported.");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to import expenses.";
      notify.error(message);
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <DashboardShell
      title="Expenses"
      description="Track, filter, and manage all of your expenses here."
    >
      <section className="flex justify-end">
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={openAddExpenseDialog}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + Add Expense
          </button>
          <button
            type="button"
            onClick={() => {
              setExportScope(selectedExpenses.length > 0 ? "selected" : "all");
              setExportDialogOpen(true);
            }}
            disabled={expenses.length === 0}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Export
          </button>
          <button
            type="button"
            onClick={triggerImportPicker}
            disabled={importLoading}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {importLoading ? "Importing…" : "Import"}
          </button>
          <button
            type="button"
            onClick={downloadSampleCsv}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Download Sample CSV
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              void handleImportFile(e);
            }}
            className="hidden"
          />
        </div>
      </section>

      <section className="mt-10 flex min-h-[55vh] flex-col items-center justify-center">
        {listLoading ? (
          <p className="text-center text-sm text-slate-600">Loading expenses…</p>
        ) : listError ? (
          <p className="max-w-md text-center text-sm text-rose-600">{listError}</p>
        ) : expenses.length === 0 ? (
          <p className="text-center text-sm text-slate-600">
            No expense found. Click Add Expense to get started.
          </p>
        ) : (
          <div className="w-full">
            <ExpensesTable
              rows={expenses}
              onEditExpense={openEditExpenseDialog}
              onDeleteExpense={(row) => {
                setDeleteTarget(row);
                setDeleteError(null);
              }}
              onViewReceipt={handleViewReceipt}
              viewingReceiptId={viewingReceiptId}
              onSelectedIdsChange={setSelectedExpenseIds}
              onCurrentPageRowsChange={setCurrentPageExpenses}
            />
          </div>
        )}
      </section>

      {receiptPreview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="truncate pr-4 text-lg font-semibold text-slate-900">
                {receiptPreview.name}
              </h3>
              <button
                type="button"
                onClick={closeReceiptPreview}
                className="shrink-0 rounded-md px-2 py-1 text-slate-500 transition hover:bg-slate-100"
                aria-label="Close receipt preview"
              >
                ×
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-slate-50 p-2">
              {receiptPreview.mimeType.includes("pdf") ? (
                <iframe
                  title={receiptPreview.name}
                  src={receiptPreview.url}
                  className="block h-[min(70vh,720px)] w-full rounded-lg border border-slate-200 bg-white"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- blob: URLs from the API are not passed through next/image.
                <img
                  src={receiptPreview.url}
                  alt={receiptPreview.name}
                  className="mx-auto max-h-[70vh] w-auto rounded-lg border border-slate-200 object-contain"
                />
              )}
            </div>
          </div>
        </div>
      ) : null}

      {expenseDialogOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {isEditMode ? "Edit Expense" : "Add Expense"}
              </h3>
              <button
                type="button"
                onClick={closeExpenseDialog}
                className="rounded-md px-2 py-1 text-slate-500 transition hover:bg-slate-100"
                aria-label={isEditMode ? "Close edit expense dialog" : "Close add expense dialog"}
              >
                ×
              </button>
            </div>

            <form onSubmit={onSubmitExpense} className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="amount"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Amount
                </label>
                <input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      amount:
                        event.target.value === ""
                          ? ""
                          : Number(event.target.value),
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e") {
                      e.preventDefault();
                    }
                  }}

                  placeholder="0.00"
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
                    fieldErrors.amount
                      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                  }`}
                />
                {fieldErrors.amount ? (
                  <p className="mt-1 text-xs text-rose-600">{fieldErrors.amount}</p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Category
                </label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, category: event.target.value }))
                  }
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
                    fieldErrors.category
                      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                  }`}
                >
                  <option value="">Select category</option>
                  {categorySelectOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {fieldErrors.category ? (
                  <p className="mt-1 text-xs text-rose-600">{fieldErrors.category}</p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="paymentMethod"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Payment method
                </label>
                <select
                  id="paymentMethod"
                  value={form.paymentMethod}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      paymentMethod: event.target.value,
                    }))
                  }
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
                    fieldErrors.paymentMethod
                      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                  }`}
                >
                  <option value="">Select payment method</option>
                  {paymentSelectOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {fieldErrors.paymentMethod ? (
                  <p className="mt-1 text-xs text-rose-600">
                    {fieldErrors.paymentMethod}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="date"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, date: event.target.value }))
                  }
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
                    fieldErrors.date
                      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                  }`}
                />
                {fieldErrors.date ? (
                  <p className="mt-1 text-xs text-rose-600">{fieldErrors.date}</p>
                ) : null}
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="receipt"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Receipt
                </label>
                <input
                  key={fileInputKey}
                  id="receipt"
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                  onChange={onReceiptChange}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm ${
                    fieldErrors.receipt
                      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                  }`}
                />
                {form.receipt ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Selected: {form.receipt.name}
                  </p>
                ) : form.existingReceiptName ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Current file: {form.existingReceiptName}
                  </p>
                ) : null}
                {fieldErrors.receipt ? (
                  <p className="mt-1 text-xs text-rose-600">{fieldErrors.receipt}</p>
                ) : null}
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="description"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Notes
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Optional notes..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {submitError ? (
                <p className="md:col-span-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {submitError}
                </p>
              ) : null}

              <div className="md:col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeExpenseDialog}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                >
                  {submitLoading ? "Saving…" : isEditMode ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {exportDialogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-expenses-title"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 id="export-expenses-title" className="text-lg font-semibold text-slate-900">
                Export expenses
              </h3>
              <button
                type="button"
                onClick={() => setExportDialogOpen(false)}
                className="rounded-md px-2 py-1 text-slate-500 transition hover:bg-slate-100"
                aria-label="Close export dialog"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <label className="grid cursor-pointer grid-cols-[1fr_3rem_auto] items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                <span className="text-sm text-slate-700">Selected expenses</span>
                <span className="text-center text-sm font-semibold tabular-nums text-slate-900">
                  {selectedExpenses.length}
                </span>
                <input
                  type="radio"
                  name="export-scope"
                  value="selected"
                  checked={exportScope === "selected"}
                  onChange={() => setExportScope("selected")}
                  disabled={selectedExpenses.length === 0}
                  className="h-4 w-4"
                />
              </label>
              <label className="grid cursor-pointer grid-cols-[1fr_3rem_auto] items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                <span className="text-sm text-slate-700">Current page</span>
                <span className="text-center text-sm font-semibold tabular-nums text-slate-900">
                  {currentPageExpenses.length}
                </span>
                <input
                  type="radio"
                  name="export-scope"
                  value="current-page"
                  checked={exportScope === "current-page"}
                  onChange={() => setExportScope("current-page")}
                  disabled={currentPageExpenses.length === 0}
                  className="h-4 w-4"
                />
              </label>
              <label className="grid cursor-pointer grid-cols-[1fr_3rem_auto] items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                <span className="text-sm text-slate-700">All expenses</span>
                <span className="text-center text-sm font-semibold tabular-nums text-slate-900">
                  {expenses.length}
                </span>
                <input
                  type="radio"
                  name="export-scope"
                  value="all"
                  checked={exportScope === "all"}
                  onChange={() => setExportScope("all")}
                  className="h-4 w-4"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setExportDialogOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExportExpenses}
                disabled={
                  (exportScope === "selected" && selectedExpenses.length === 0) ||
                  (exportScope === "current-page" && currentPageExpenses.length === 0) ||
                  (exportScope === "all" && expenses.length === 0)
                }
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-expense-title"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
            <h3 id="delete-expense-title" className="text-lg font-semibold text-slate-900">
              Delete expense
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              Are you sure you want to delete this expense? This action cannot be undone.
            </p>
            {deleteError ? (
              <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {deleteError}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError(null);
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => {
                  void confirmDeleteExpense();
                }}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-400"
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
