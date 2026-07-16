import type { ExpenseRow } from "@/components/expenses/expenses-table";

/** Distinct colors for category slices (oklch for consistent pop on light UI) */
export const CATEGORY_CHART_COLORS = [
  "oklch(0.72 0.17 210)",
  "oklch(0.75 0.15 45)",
  "oklch(0.72 0.2 330)",
  "oklch(0.78 0.12 230)",
  "oklch(0.72 0.14 150)",
  "oklch(0.68 0.18 290)",
  "oklch(0.82 0.16 95)",
  "oklch(0.65 0.12 250)",
  "oklch(0.7 0.1 200)",
  "oklch(0.75 0.08 180)",
] as const;

export function parseExpenseDate(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export type CategorySpend = {
  category: string;
  amount: number;
  percent: number;
};

export function summarizeByCategory(rows: ExpenseRow[]): CategorySpend[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.category, (map.get(r.category) ?? 0) + r.amount);
  }
  const total = [...map.values()].reduce((sum, n) => sum + n, 0);
  return [...map.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      percent: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export type MonthlySpendPoint = {
  key: string;
  label: string;
  amount: number;
};

export type TrendGranularity = "day" | "month" | "year";

export type TrendSpendPoint = {
  key: string;
  label: string;
  amount: number;
};

function formatMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function monthlySpendingSeries(rows: ExpenseRow[]): MonthlySpendPoint[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const dt = parseExpenseDate(r.date);
    if (Number.isNaN(dt.getTime())) continue;
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + r.amount);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, amount]) => ({
      key,
      label: formatMonthLabel(key),
      amount,
    }));
}

function formatDayLabel(isoDate: string): string {
  const d = parseExpenseDate(isoDate);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatYearLabel(year: string): string {
  return year;
}

export function spendingSeriesByGranularity(
  rows: ExpenseRow[],
  granularity: TrendGranularity
): TrendSpendPoint[] {
  const map = new Map<string, number>();

  for (const r of rows) {
    const dt = parseExpenseDate(r.date);
    if (Number.isNaN(dt.getTime())) continue;

    let key: string;
    if (granularity === "day") {
      key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
        dt.getDate()
      ).padStart(2, "0")}`;
    } else if (granularity === "year") {
      key = `${dt.getFullYear()}`;
    } else {
      key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    }
    map.set(key, (map.get(key) ?? 0) + r.amount);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, amount]) => {
      let label: string;
      if (granularity === "day") {
        label = formatDayLabel(key);
      } else if (granularity === "year") {
        label = formatYearLabel(key);
      } else {
        label = formatMonthLabel(key);
      }

      return {
        key,
        label,
        amount,
      };
    });
}

export function spendingDateRangeLabel(rows: ExpenseRow[]): string | null {
  if (rows.length === 0) return null;
  const times = rows
    .map((r) => parseExpenseDate(r.date).getTime())
    .filter((t) => !Number.isNaN(t));
  if (times.length === 0) return null;
  const min = new Date(Math.min(...times));
  const max = new Date(Math.max(...times));
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  return `${min.toLocaleDateString("en-US", opts)} – ${max.toLocaleDateString("en-US", opts)}`;
}
