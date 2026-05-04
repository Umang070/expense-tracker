"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ExpensesTable, type ExpenseRow } from "@/components/expenses/expenses-table";
import {
  createExpense,
  deleteExpense,
  listExpenses,
  mapApiExpenseToRow,
  updateExpense,
} from "@/lib/expenses";

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

const initialExpenseForm: ExpenseFormState = {
  amount: "",
  category: "",
  paymentMethod: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
  receipt: null,
  existingReceiptName: null,
};

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

  const isEditMode = expenseEditId !== null;

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
        await updateExpense(Number(expenseEditId), {
          amount: Number(form.amount),
          category: form.category,
          paymentMethod: form.paymentMethod,
          description: form.description.trim(),
          date: form.date,
          receiptName,
        });
      } else {
        await createExpense({
          amount: Number(form.amount),
          category: form.category,
          paymentMethod: form.paymentMethod,
          description: form.description.trim(),
          date: form.date,
          receiptName,
        });
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
            disabled
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-400"
          >
            Export
          </button>
          <button
            type="button"
            disabled
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-400"
          >
            Import
          </button>
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
            />
          </div>
        )}
      </section>

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
