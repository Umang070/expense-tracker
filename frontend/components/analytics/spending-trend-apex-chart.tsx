"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { TrendGranularity } from "@/lib/analytics";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center text-sm text-muted-foreground"
      style={{ minHeight: 350 }}
    >
      Loading chart…
    </div>
  ),
});

type SpendingTrendApexChartProps = {
  categories: string[];
  seriesData: number[];
  granularity: TrendGranularity;
  height?: number;
};

export function SpendingTrendApexChart({
  categories,
  seriesData,
  granularity,
  height = 350,
}: SpendingTrendApexChartProps) {
  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        height,
        type: "line",
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: true,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "straight",
      },
      // title: {
      //   text: "Spending trend (ApexCharts)",
      //   align: "left",
      // },
      grid: {
        row: {
          colors: ["#f3f3f3", "transparent"],
          opacity: 0.5,
        },
      },
      xaxis: {
        categories,
        labels: {
          rotate: granularity === "day" ? -45 : 0,
          rotateAlways: granularity === "day",
        },
      },
      yaxis: {
        labels: {
          formatter: (val: number) =>
            new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(val),
        },
      },
      tooltip: {
        y: {
          formatter: (val: number) =>
            new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(val),
        },
      },
      colors: ["#0f172a"],
    }),
    [categories, height, granularity]
  );

  const series = useMemo(
    () => [
      {
        name: "Spending",
        data: seriesData,
      },
    ],
    [seriesData]
  );

  return (
    <div className="w-full">
      <ReactApexChart
        options={options}
        series={series}
        type="line"
        height={height}
      />
    </div>
  );
}
