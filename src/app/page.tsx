import Link from "next/link";
import { NavShell } from "@/components/nav-shell";

const cards = [
  {
    title: "Upload receipts",
    description: "Capture receipts or invoices, then send them to the OCR backend for parsing."
  },
  {
    title: "Review extracted data",
    description: "Treat OCR output as a draft and confirm merchant, date, amount, and category."
  },
  {
    title: "Save locally first",
    description: "Keep finance records on-device in IndexedDB so the app works even before cloud sync exists."
  }
];

export default function HomePage() {
  return (
    <NavShell title="Simple Expense Tracker">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-3xl border border-slate-200 bg-white/85 p-8 shadow-sm">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">
            MVP starter
          </p>
          <h2 className="max-w-2xl text-4xl font-semibold leading-tight text-slate-950">
            Scan, review, and save expenses without making the backend your source of truth.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
            This starter maps the TSD into a concrete workspace: frontend PWA, OCR API, and DevOps
            assets for Vercel, Railway, and Supabase.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/upload"
              className="rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Start Upload Flow
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900"
            >
              View Dashboard
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-orange-200 bg-orange-50/70 p-6">
          <h3 className="text-lg font-semibold text-slate-900">Recommended next steps</h3>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            <li>Fill in frontend and backend `.env` files.</li>
            <li>Install dependencies with `npm install` in the repo root.</li>
            <li>Run `npm run dev:be` and `npm run dev:fe` in separate terminals.</li>
          </ul>
        </section>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card.title} className="rounded-3xl border border-slate-200 bg-white/80 p-6">
            <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">{card.description}</p>
          </article>
        ))}
      </section>
    </NavShell>
  );
}

