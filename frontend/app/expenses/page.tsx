"use client";

import { FormEvent, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

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

type ExpenseFormState = {
  amount: number | "";
  category: string | "";
  description: string;
  date: string;
};

const initialExpenseForm: ExpenseFormState = {
  amount: "",
  category: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
};

type Expense = {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
};

export default function ExpensesPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<ExpenseFormState>(initialExpenseForm);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{
    amount?: string;
    category?: string;
    date?: string;
  }>({});

  const validateForm = () => {
    const errors: {
      amount?: string;
      category?: string;
      date?: string;
    } = {};
    console.log("Category", form.category);

    if (form.amount === "" || Number.isNaN(form.amount) || form.amount <= 0) {
      errors.amount = "Amount is required.";
    }
    if (!form.category) {
      errors.category = "Category is required.";
    }
    if (!form.date) {
      errors.date = "Date is required.";
    }

    return errors;
  };

  const onSubmitExpense = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateForm();
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      amount: Number(form.amount),
      category: form.category,
      description: form.description.trim(),
      date: form.date,
    };

    setExpenses((prev) => [newExpense, ...prev]);
    setForm(initialExpenseForm);
    setShowAddForm(false);
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
            onClick={() => {
              setShowAddForm(true);
              setFieldErrors({});
            }}
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

      <section className="mt-10 flex min-h-[55vh] items-center justify-center">
        {expenses.length === 0 ? (
          <p className="text-center text-sm text-slate-600">
            No expense found. Click Add Expense to get started.
          </p>
        ) : (
          <ul className="w-full space-y-3">
            {expenses.map((expense) => (
              <li
                key={expense.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {expense.category}
                  </p>
                  <p className="text-xs text-slate-500">
                    {expense.description || "No description"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    ${expense.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500">{expense.date}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showAddForm ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Add Expense</h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFieldErrors({});
                }}
                className="rounded-md px-2 py-1 text-slate-500 transition hover:bg-slate-100"
                aria-label="Close add expense dialog"
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
                  {categoryOptions.map((category) => (
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

              <div className="md:col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFieldErrors({});
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
