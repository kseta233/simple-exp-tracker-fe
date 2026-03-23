import type { Route } from "next";
import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/upload", label: "Upload" },
  { href: "/expenses", label: "Expenses" },
  { href: "/sign-in", label: "Sign In" }
] satisfies Array<{ href: Route; label: string }>;

export function NavShell({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6">
      <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-orange-200 bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">
              Local-first finance
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm font-medium text-slate-700">
            {links.map((link) => (
              <Link
                className="rounded-full border border-slate-200 px-4 py-2 transition hover:border-orange-300 hover:bg-orange-50"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <section className="flex-1">{children}</section>
    </main>
  );
}
