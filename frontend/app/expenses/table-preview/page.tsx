import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ExpensesTable, type ExpenseRow } from "@/components/expenses/expenses-table";

const previewRows: ExpenseRow[] = [
  {
    id: "1",
    amount: 159,
    category: "Food",
    paymentMethod: "UPI",
    description: "Frozen yoghurt and snacks for office meeting.",
    date: "2026-04-28",
    receiptName: "food-receipt.pdf",
  },
  {
    id: "2",
    amount: 237,
    category: "Restaurant",
    paymentMethod: "Credit Card",
    description:
      "Team dinner at downtown restaurant. This is intentionally long to demonstrate truncation behavior in table cells.",
    date: "2026-04-27",
  },
];

export default function ExpenseTablePreviewPage() {
  return (
    <DashboardShell
      title="Expenses Table Preview"
      description="MUI table component preview with truncation and pagination."
    >
      <ExpensesTable rows={previewRows} />
    </DashboardShell>
  );
}
