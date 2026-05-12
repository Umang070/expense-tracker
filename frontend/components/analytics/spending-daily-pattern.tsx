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


function generateData(count:number, yrange: any) {
    var i = 0;
    var series = [];
    while (i < count) {
      var x = (i + 1).toString();
      var y =
      Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;
    
      series.push({
        x: x,
        y: y
      });
      i++;
    }
    return series;
    }



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


//   const options: ApexOptions = useMemo(() => {
//     const colors = categories.map(
//       (_, i) => BAR_COLORS[i % BAR_COLORS.length] ?? "#64748b"
//     );

//     return {
//       chart: {
//         type: "bar",
//         height: chartHeight,
//         toolbar: { show: true },
//       },
//       plotOptions: {
//         bar: {
//           horizontal: true,
//           borderRadius: 4,
//           borderRadiusApplication: "end",
//           distributed: true,
//           dataLabels: {
//             position: "top",
//           },
//         },
//       },
//       colors,
//       legend: { show: true },
//       dataLabels: {
//         enabled: true,
//         offsetX: 13,
//         style: {
//           fontSize: "11px",
//           fontWeight: 600,
//           colors: ["#334155"],
//         },
//         formatter: (_val, opts) => {
//           const idx = opts?.dataPointIndex ?? 0;
//           const p = percents[idx];
//           return p !== undefined ? `${p.toFixed(1)}%` : "";
//         },
//       },
//       xaxis: {
//         categories,
//         labels: {
//           formatter: (val: string | number) =>
//             new Intl.NumberFormat("en-US", {
//               style: "currency",
//               currency: "USD",
//               maximumFractionDigits: 0,
//             }).format(Number(val)),
//         },
//       },
//       yaxis: {
//         labels: {
//           maxWidth: 160,
//           style: { fontSize: "12px" },
//         },
//       },
//       tooltip: {
//         y: {
//           formatter: (val: number, opts) => {
//             const idx = opts?.dataPointIndex ?? 0;
//             const pct = percents[idx];
//             const pctStr = pct !== undefined ? ` (${pct.toFixed(1)}% of total)` : "";
//             return `${formatMoney(val)}${pctStr}`;
//           },
//         },
//       },
//       grid: {
//         borderColor: "#e2e8f0",
//         strokeDashArray: 4,
//         xaxis: { lines: { show: true } },
//         yaxis: { lines: { show: false } },
//       },
//     };
//   }, [categories, chartHeight, percents]);

  const series = useMemo(
    () => buildExpenseHeatmapData(rows),
    [categories]
  );



const data = buildExpenseHeatmapData(rows);
console.log("Series", data);

console.log("Rows ", rows);

const options: ApexOptions =  {
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
          ranges: [{
              from: -30,
              to: 5,
              name: 'low',
              color: '#00A100'
            },
            {
              from: 6,
              to: 20,
              name: 'medium',
              color: '#128FD9'
            },
            {
              from: 21,
              to: 45,
              name: 'high',
              color: '#FFB200'
            },
            {
              from: 46,
              to: 55,
              name: 'extreme',
              color: '#FF0000'
            }
          ]
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: 1
    },
    title: {
      text: 'HeatMap Chart with Color Range'
    },
  }

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
            type="heatmap"
            height={chartHeight}
          />
        </div>
      </CardContent>
    </Card>
  );
}
