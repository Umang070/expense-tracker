"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { ExpenseRow } from "@/components/expenses/expenses-table";
import {
  spendingDateRangeLabel,
  summarizeByCategory,
} from "@/lib/analytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center text-sm text-muted-foreground"
      style={{ minHeight: 320 }}
    >
      Loading chart…
    </div>
  ),
});

/** Hex palette for Apex bar fills (oklch is unreliable in some Apex/SVG paths). */
const BAR_COLORS = [
  "#2563eb",
  "#ea580c",
  "#db2777",
  "#7c3aed",
  "#16a34a",
  "#ca8a04",
  "#0891b2",
  "#4f46e5",
  "#0d9488",
  "#64748b",
] as const;

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

type SpendingCategoryRankApexProps = {
  rows: ExpenseRow[];
};

export function SpendingCategoryRankApex({ rows }: SpendingCategoryRankApexProps) {
  const slices = useMemo(() => summarizeByCategory(rows), [rows]);

  const categories = useMemo(
    () => slices.map((s) => s.category),
    [slices]
  );

  const amounts = useMemo(() => slices.map((s) => s.amount), [slices]);

  const percents = useMemo(() => slices.map((s) => s.percent), [slices]);

  const rangeLabel = useMemo(() => spendingDateRangeLabel(rows), [rows]);

  const chartHeight = useMemo(
    () => Math.max(340, categories.length * 42 + 100),
    [categories.length]
  );

  const options: ApexOptions = useMemo(() => {
    const colors = categories.map(
      (_, i) => BAR_COLORS[i % BAR_COLORS.length] ?? "#64748b"
    );

    return {
      chart: {
        type: "bar",
        height: chartHeight,
        toolbar: { show: true },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          borderRadiusApplication: "end",
          distributed: true,
          dataLabels: {
            position: "top",
          },
        },
      },
      colors,
      legend: { show: true },
      dataLabels: {
        enabled: true,
        offsetX: 13,
        style: {
          fontSize: "11px",
          fontWeight: 600,
          colors: ["#334155"],
        },
        formatter: (_val, opts) => {
          const idx = opts?.dataPointIndex ?? 0;
          const p = percents[idx];
          return p !== undefined ? `${p.toFixed(1)}%` : "";
        },
      },
      xaxis: {
        categories,
        labels: {
          formatter: (val: string | number) =>
            new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(Number(val)),
        },
      },
      yaxis: {
        labels: {
          maxWidth: 160,
          style: { fontSize: "12px" },
        },
      },
      tooltip: {
        y: {
          formatter: (val: number, opts) => {
            const idx = opts?.dataPointIndex ?? 0;
            const pct = percents[idx];
            const pctStr = pct !== undefined ? ` (${pct.toFixed(1)}% of total)` : "";
            return `${formatMoney(val)}${pctStr}`;
          },
        },
      },
      grid: {
        borderColor: "#e2e8f0",
        strokeDashArray: 4,
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
      },
    };
  }, [categories, chartHeight, percents]);

  const series = useMemo(
    () => [
      {
        name: "Spending",
        data: amounts,
      },
    ],
    [amounts]
  );

  if (rows.length === 0 || slices.length === 0) {
    return (
      <Card className="border-slate-200 ring-slate-200/80">
        <CardHeader className="border-b border-border/60">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="text-lg font-medium tracking-wide text-muted-foreground uppercase">Top Categories</CardTitle>

          </div>
        </CardHeader>
     
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Add expenses to see ranked spending by category
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="border-slate-200 ring-slate-200/80">
      <CardHeader className="border-b border-border/60">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-medium tracking-wide text-muted-foreground uppercase">Top categories</CardTitle>

            <CardDescription>
              Highest spending categories, descending.
              {rangeLabel ? ` ${rangeLabel}` : ""}
            </CardDescription>
          </div>
        </div>

      </CardHeader>
      <CardContent className="pt-4">
        <div className="w-full overflow-x-auto">
          <ReactApexChart
            options={options}
            series={series}
            type="bar"
            height={chartHeight}
          />
        </div>
      </CardContent>
    </Card>
  );
}
