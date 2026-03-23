import { NavShell } from "@/components/nav-shell";

const expenses = [
  { merchant: "Example Coffee Roasters", category: "Food", amount: "IDR 78,000", status: "draft" },
  { merchant: "Office Mart", category: "Supplies", amount: "IDR 240,000", status: "confirmed" },
  { merchant: "Ride Hailing", category: "Transport", amount: "IDR 56,000", status: "confirmed" }
];

export default function ExpensesPage() {
  return (
    <NavShell title="Expenses">
      <section className="rounded-3xl border border-slate-200 bg-white/85 p-4 shadow-sm">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr] gap-4 border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500">
          <span>Merchant</span>
          <span>Category</span>
          <span>Amount</span>
          <span>Status</span>
        </div>
        {expenses.map((expense) => (
          <div
            key={`${expense.merchant}-${expense.amount}`}
            className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr] gap-4 px-4 py-4 text-sm text-slate-800"
          >
            <span>{expense.merchant}</span>
            <span>{expense.category}</span>
            <span>{expense.amount}</span>
            <span className="capitalize">{expense.status}</span>
          </div>
        ))}
      </section>
    </NavShell>
  );
}

