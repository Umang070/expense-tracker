"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { ExpenseRow } from "@/components/expenses/expenses-table";
import { listExpenses, mapApiExpenseToRow } from "@/lib/expenses";

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function parseIsoDateOnly(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function aggregateExpenses(rows: ExpenseRow[], reference: Date) {
  const refYear = reference.getFullYear();
  const refMonth = reference.getMonth();

  let totalAll = 0;
  let monthTotal = 0;
  let yearTotal = 0;
  const categoryTotals = new Map<string, number>();

  for (const r of rows) {
    totalAll += r.amount;
    const dt = parseIsoDateOnly(r.date);
    if (!Number.isNaN(dt.getTime())) {
      if (dt.getFullYear() === refYear && dt.getMonth() === refMonth) {
        monthTotal += r.amount;
      }
      if (dt.getFullYear() === refYear) {
        yearTotal += r.amount;
      }
    }
    categoryTotals.set(r.category, (categoryTotals.get(r.category) ?? 0) + r.amount);
  }

  let topCategory: string | null = null;
  let topAmount = -1;
  for (const [cat, amt] of categoryTotals) {
    if (amt > topAmount) {
      topAmount = amt;
      topCategory = cat;
    } else if (amt === topAmount && topCategory !== null && cat.localeCompare(topCategory) < 0) {
      topCategory = cat;
    }
  }

  if (topAmount < 0) {
    topCategory = null;
  }

  const recent = [...rows]
    .sort((a, b) => {
      const ta = parseIsoDateOnly(a.date).getTime();
      const tb = parseIsoDateOnly(b.date).getTime();
      return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
    })
    .slice(0, 5);

  return {
    totalAll,
    monthTotal,
    yearTotal,
    topCategory,
    topCategoryAmount: topAmount >= 0 ? topAmount : 0,
    recent,
  };
}

export default function DashboardPage() {
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExpenses = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await listExpenses({ page: 1, limit: 100 });
      setRows(result.data.map(mapApiExpenseToRow));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load expenses.";
      setError(message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadExpenses();
    });
  }, [loadExpenses]);

  const stats = useMemo(
    () => aggregateExpenses(rows, new Date()),
    [rows]
  );

  return (
    <DashboardShell
      title="Dashboard"
      description="Welcome back. Here is a snapshot of your spending."
    >
      {loading ? (
        <p className="text-sm text-slate-600">Loading your summary…</p>
      ) : error ? (
        <p className="max-w-md text-sm text-rose-600">{error}</p>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                This Month
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatMoney(stats.monthTotal)}
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                This Year
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatMoney(stats.yearTotal)}
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Top Category
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {stats.topCategory ?? "—"}
              </p>
              {stats.topCategory ? (
                <p className="mt-1 text-xs text-slate-500">
                  {formatMoney(stats.topCategoryAmount)} total
                </p>
              ) : null}
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Total Expense
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatMoney(stats.totalAll)}
              </p>
            </article>
          </section>

          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-slate-900">
                Recent transactions
              </h3>
              {rows.length > 0 ? (
                <Link
                  href="/expenses"
                  className="text-sm font-medium text-slate-900 underline decoration-slate-400 underline-offset-2 hover:decoration-slate-900"
                >
                  View all
                </Link>
              ) : null}
            </div>
            {stats.recent.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">
                No transactions yet.{" "}
                <Link
                  href="/expenses"
                  className="font-medium text-slate-900 underline decoration-slate-400 underline-offset-2 hover:decoration-slate-900"
                >
                  Add your first expense
                </Link>{" "}
                to get started.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {stats.recent.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{row.category}</p>
                      <p className="truncate text-sm text-slate-500">
                        {row.paymentMethod}
                        {row.description.trim() ? ` · ${row.description.trim()}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        {formatMoney(row.amount)}
                      </p>
                      <p className="text-xs text-slate-500">{row.date}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </DashboardShell>
  );
}
