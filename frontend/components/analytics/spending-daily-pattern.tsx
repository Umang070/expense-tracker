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

type SpendingDailyPatternProps = {
  rows: ExpenseRow[];
};



type HeatmapData = {
  name: string;
  data: {
    x: string;
    y: number;
  }[];
};

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type HeatmapRange = {
    from: number;
    to: number;
    name: string;
    color: string;
  };

export function buildExpenseHeatmapData(
    expenses: ExpenseRow[]
  ): HeatmapData[] {
    // Initialize all months with 31 days = 0
    const monthlyMap: Record<string, number[]> = {};
  
    monthNames.forEach((month) => {
      monthlyMap[month] = Array(31).fill(0);
    });
  
    // Map expense data
    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);
  
      const monthIndex = expenseDate.getMonth();
      const day = expenseDate.getDate();
  
      const monthName = monthNames[monthIndex];
  
      // Add amount to matching day
      monthlyMap[monthName][day - 1] += expense.amount;
    });
  
    // Convert to ApexCharts heatmap format
    return monthNames.map((month) => ({
      name: month,
      data: monthlyMap[month].map((amount, index) => ({
        x: String(index + 1),
        y: Number(amount.toFixed(2)),
      })),
    }));
  }


export function generateHeatmapRanges(
    expenses: ExpenseRow[]
  ): HeatmapRange[] {
    // Get all amounts
    const amounts = expenses.map((expense) => expense.amount);
  
    // Handle empty state
    if (amounts.length === 0) {
      return [
        {
          from: 0,
          to: 0,
          name: "No Data",
          color: "#E2E8F0",
        },
      ];
    }
  
    const min = 0;
    const max = Math.max(...amounts);
  
    // Divide into 4 equal ranges
    const step = (max - min) / 4;
  
    return [
      {
        from: min,
        to: min + step,
        name: "Low",
        color: "#22C55E",
      },
      {
        from: min + step + 0.01,
        to: min + step * 2,
        name: "Medium",
        color: "#3B82F6",
      },
      {
        from: min + step * 2 + 0.01,
        to: min + step * 3,
        name: "High",
        color: "#F59E0B",
      },
      {
        from: min + step * 3 + 0.01,
        to: max,
        name: "Extreme",
        color: "#EF4444",
      },
    ];
  }

       
export function SpendingDailyPattern({ rows }: SpendingDailyPatternProps) {
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

const series = useMemo(
    () => buildExpenseHeatmapData(rows),
    [categories]
  );

console.log("Heatmap ranges", generateHeatmapRanges(rows));
const options: ApexOptions = useMemo(() => {

    return {
    chart: {
      height: 350,
      type: 'heatmap',
    },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        radius: 0,
        useFillColorAsStroke: true,
        colorScale: {
          ranges: generateHeatmapRanges(rows)
        },
        distributed: false
      } 
    },
    tooltip: {
        enabled: true,
                y: {
                    formatter: (value) => { 
                        return `${formatMoney(value)}`
                    },
                    title: {
                      formatter : () => "Total Spending:" // removes "May"
                    }
                  },
                x:{
                    show: true,
                    formatter: (val: number, opts) => {
                        const idx = opts?.dataPointIndex ?? 0;
                        const month = monthNames[opts?.seriesIndex ?? 0];
                        return `${month} ${idx+1}`;
                      },
                }
             
              },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: 1
    },
    xaxis:{
        title: {
            text:" Day"
        }
    },
    yaxis:{
        title: {
            text:" Month"
        }
    },
  }
}, [categories])

  if (rows.length === 0 || slices.length === 0) {
    return (
      <Card className="border-slate-200 ring-slate-200/80">
        <CardHeader className="border-b border-border/60">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="text-lg font-medium tracking-wide text-muted-foreground uppercase">Daily Spending Pattern</CardTitle>

          <CardDescription>Add expenses to see daily spending.</CardDescription>
          </div>
        </CardHeader>
     
        {/* <CardContent className="pt-6 text-sm text-muted-foreground">
          Add expenses to see monthly trend lines.
        </CardContent> */}
      </Card>
    );
  }


  return (
    <Card className="border-slate-200 ring-slate-200/80">
      <CardHeader className="border-b border-border/60">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-medium tracking-wide text-muted-foreground uppercase">Daily Spending Pattern</CardTitle>

            <CardDescription>
              Spending Pattern
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
            name = "Speding" 
            type="heatmap"
            height={chartHeight}
          />
        </div>
      </CardContent>
    </Card>
  );
}
