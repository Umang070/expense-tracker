"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SpendingByCategory } from "@/components/analytics/spending-by-category";
import { SpendingTrendChart } from "@/components/analytics/spending-trend-chart";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { ExpenseRow } from "@/components/expenses/expenses-table";
import { summarizeByCategory } from "@/lib/analytics";
import { listExpenses, mapApiExpenseToRow } from "@/lib/expenses";

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function AnalyticsPage() {
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

  const totals = useMemo(() => {
    const totalSpend = rows.reduce((s, r) => s + r.amount, 0);
    const byCat = summarizeByCategory(rows);
    const top = byCat.length > 0 ? byCat[0] : null;
    return { totalSpend, count: rows.length, top };
  }, [rows]);

  return (
    <DashboardShell
      title="Analytics"
      description="Spending by category and monthly trends from your loaded transactions."
    >
      {loading ? (
        <p className="text-sm text-slate-600">Loading analytics…</p>
      ) : error ? (
        <p className="max-w-md text-sm text-rose-600">{error}</p>
      ) : (
        <div className="space-y-6">
          {rows.length > 0 ? (
            <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3 sm:gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Transactions
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                  {totals.count}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Total spending
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                  {formatMoney(totals.totalSpend)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Top category
                </p>
                <p className="mt-1 text-xl font-semibold text-foreground">
                  {totals.top?.category ?? "—"}
                </p>
              </div>
            </section>
          ) : null}

          <SpendingByCategory rows={rows} />
          <SpendingTrendChart rows={rows} />
        </div>
      )}
    </DashboardShell>
  );
}
