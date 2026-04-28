import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function AnalyticsPage() {
  return (
    <DashboardShell
      title="Analytics"
      description="Visualize your spending trends and category split."
    >
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-600">
          Charts and analytics widgets will be implemented in the next step.
        </p>
      </section>
    </DashboardShell>
  );
}
