import { NavShell } from "@/components/nav-shell";

const stats = [
  { label: "Draft receipts", value: "12" },
  { label: "Confirmed expenses", value: "48" },
  { label: "This month spend", value: "IDR 4.8M" }
];

export default function DashboardPage() {
  return (
    <NavShell title="Dashboard">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-3xl border border-slate-200 bg-white/85 p-6">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{stat.value}</p>
          </article>
        ))}
      </div>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white/85 p-6">
          <h2 className="text-xl font-semibold text-slate-900">OCR review queue</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Use this area for pending scans that still need human confirmation before they become
            finance entries.
          </p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white/85 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Offline-first notes</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Local IndexedDB stores `raw_document`, `ocr_result`, and `finance_entry` so your core
            workflow survives intermittent connectivity.
          </p>
        </article>
      </section>
    </NavShell>
  );
}

