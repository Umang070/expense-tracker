"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import type { ExpenseRow } from "@/components/expenses/expenses-table";
import {
  spendingSeriesByGranularity,
  type TrendGranularity,
} from "@/lib/analytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export const description = "A line chart";

const chartConfig = {
  desktop: {
    label: "Spending",
    color: "#0f172a",
  },
} satisfies ChartConfig;

type SpendingTrendChartProps = {
  rows: ExpenseRow[];
};

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function SpendingTrendChart({ rows }: SpendingTrendChartProps) {
  const [granularity, setGranularity] = useState<TrendGranularity>("month");

  const chartData = useMemo(
    () =>
      spendingSeriesByGranularity(rows, granularity).map((point) => ({
        month: point.label,
        desktop: Number(point.amount.toFixed(2)),
      })),
    [rows, granularity]
  );

  if (chartData.length === 0) {
    return (
      <Card className="border-slate-200 ring-slate-200/80">
        <CardHeader className="border-b border-border/60">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Spending trends
          </p>
          <CardTitle className="text-lg">No data yet</CardTitle>
          <CardDescription>No spending trend data available</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Add expenses to see monthly trend lines.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 ring-slate-200/80">
      <CardHeader className="border-b border-border/60">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Spending trends
            </p>
            <CardTitle className="text-lg">Line Chart</CardTitle>
            <CardDescription>
              {chartData[0].month} - {chartData[chartData.length - 1].month}
            </CardDescription>
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            {(["day", "month", "year"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setGranularity(value)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  granularity === value
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 8,
              left: 12,
              right: 12,
              bottom: 8,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) =>
                granularity === "year" ? String(value) : String(value).slice(0, 6)
              }
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={70}
              tickFormatter={(value) => formatMoney(Number(value))}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  className="min-w-[160px]"
                  formatter={(value) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        {chartConfig.desktop.label}
                      </span>
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {formatMoney(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
        
            <Line
              dataKey="desktop"
              name={chartConfig.desktop.label}
              type="linear"
              stroke="#0f172a"
              strokeWidth={2.5}
              connectNulls
              dot={{ r: 4, fill: "#0f172a", stroke: "var(--background)", strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
