import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function DashboardPage() {
  return (
    <DashboardShell
      title="Dashboard"
      description="Welcome back. Your expense summary and insights will appear here."
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            This Month
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">$0.00</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            This Year
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">$0.00</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Top Category
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">-</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Total Expense
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">$0.00</p>
        </article>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-slate-900">
          Recent transactions
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          No transactions yet. Add your first expense to get started.
        </p>
      </section>
    </DashboardShell>
  );
}
