"use client";

import { useMemo, useState } from "react";
import { Pie, PieChart } from "recharts";
import {
  CATEGORY_CHART_COLORS,
  spendingDateRangeLabel,
  summarizeByCategory,
} from "@/lib/analytics";
import type { ExpenseRow } from "@/components/expenses/expenses-table";
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
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const PREVIEW_COUNT = 8;

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

type SpendingByCategoryProps = {
  rows: ExpenseRow[];
};

export function SpendingByCategory({ rows }: SpendingByCategoryProps) {
  const [showAll, setShowAll] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | undefined>();

  const slices = useMemo(() => summarizeByCategory(rows), [rows]);

  const totalSpend = useMemo(
    () => slices.reduce((sum, s) => sum + s.amount, 0),
    [slices]
  );

  const pieData = useMemo(
    () =>
      slices.map((s, i) => ({
        name: s.category,
        value: s.amount,
        percent: s.percent,
        fill: CATEGORY_CHART_COLORS[i % CATEGORY_CHART_COLORS.length],
      })),
    [slices]
  );

  const chartConfig = useMemo(() => {
    const cfg: ChartConfig = {};
    pieData.forEach((d) => {
      cfg[d.name] = { label: d.name, color: d.fill };
    });
    return cfg;
  }, [pieData]);

  const rangeLabel = useMemo(() => spendingDateRangeLabel(rows), [rows]);

  const visibleSlices = showAll ? slices : slices.slice(0, PREVIEW_COUNT);
  const hiddenCount = Math.max(0, slices.length - PREVIEW_COUNT);

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-medium tracking-wide text-muted-foreground uppercase"> Spending by Category</CardTitle>
            <CardDescription>Add expenses to see your category breakdown.</CardDescription>
           
          </div>
        </div>

        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="@container border-slate-200 ring-slate-200/80">
      <CardHeader className="border-b border-border/60">

      <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-medium tracking-wide text-muted-foreground uppercase"> Spending by Category</CardTitle>
           {rangeLabel? (<CardDescription>
             {rangeLabel}
            </CardDescription>) : null}

          </div>
        </div>


      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,320px)_1fr] lg:items-start">
          <div className="relative mx-auto w-full max-w-[320px]">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square h-[280px] w-full max-w-[320px] text-foreground"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const point = payload[0];
                    const category = String(point.name ?? point.payload?.name ?? "Category");
                    const value = Number(point.value ?? 0);
                    const percent = Number(point.payload?.percent ?? 0);
                    const color = String(point.color ?? point.payload?.fill ?? "var(--muted-foreground)");

                    return (
                      <div
                        className="min-w-[11rem] rounded-lg border border-slate-900/30 px-3 py-2 shadow-lg"
                        style={{
                          backgroundColor: `color-mix(in oklab, ${color} 22%, white)`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                            aria-hidden
                          />
                          <p className="text-xs font-medium text-foreground">{category}</p>
                        </div>
                        <p className="mt-1 font-mono text-sm font-medium tabular-nums text-foreground">
                          {formatMoney(value)}
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({percent.toFixed(1)}%)
                          </span>
                        </p>
                      </div>
                    );
                  }}
                />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={74}
                  outerRadius={118}
                  paddingAngle={2}
                  stroke="var(--background)"
                  strokeWidth={2}
                  cornerRadius={2}
                />
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-xl font-semibold tabular-nums text-foreground sm:text-2xl">
                  {formatMoney(totalSpend)}
                </p>
                <p className="text-xs font-medium text-muted-foreground">Total</p>
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {visibleSlices.map((s) => {
                const fullIndex = slices.findIndex((x) => x.category === s.category);
                const color =
                  CATEGORY_CHART_COLORS[
                    Math.max(0, fullIndex) % CATEGORY_CHART_COLORS.length
                  ];
                return (
                  <li key={s.category}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                        activeIndex === fullIndex ? "bg-muted" : "hover:bg-muted/60"
                      )}
                      onMouseEnter={() =>
                        fullIndex >= 0 ? setActiveIndex(fullIndex) : undefined
                      }
                      onMouseLeave={() => setActiveIndex(undefined)}
                      aria-label={`${s.category}, ${formatMoney(s.amount)}, ${s.percent.toFixed(1)} percent`}
                    >
                      <span
                        className="mt-1 h-3 w-3 shrink-0 rounded-full ring-2 ring-background"
                        style={{ backgroundColor: color }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate font-medium text-foreground",
                            activeIndex !== undefined &&
                              activeIndex !== fullIndex &&
                              "opacity-45"
                          )}
                        >
                          {s.category}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {formatMoney(s.amount)}{" "}
                          <span className="tabular-nums">({s.percent.toFixed(1)}%)</span>
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            {hiddenCount > 0 ? (
              <button
                type="button"
                className="mt-4 flex items-center gap-1 text-sm font-semibold text-foreground underline decoration-slate-400 underline-offset-4 hover:decoration-foreground"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? "Show fewer categories" : `Show all categories (${hiddenCount} more)`}
              </button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
