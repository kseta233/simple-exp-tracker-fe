"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/expenses", label: "Expenses", short: "List" },
  { href: "/dashboard", label: "Dashboard", short: "Stats" },
  { href: "/categories", label: "Categories", short: "Tags" },
  { href: "/settings", label: "Settings", short: "Cloud" }
] as const;

export function AppShell({
  title,
  eyebrow,
  actions,
  children
}: {
  title: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-[var(--background)] pb-32">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-white px-4 py-3 sm:px-5">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="h-9 w-9 rounded-md text-[var(--primary)]"
              aria-label="Menu"
            >
              <span className="text-xl">≡</span>
            </button>
            <h1 className="font-heading text-3xl font-semibold text-[var(--ink)] sm:text-2xl">Precision Finance</h1>
          </div>
          <Link href="/settings" className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--primary)]" aria-label="Settings">
            <span className="text-lg">⚙</span>
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-xl px-4 pt-5 sm:px-5 sm:pt-6">
        <div className="mb-5 flex flex-col items-start gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            {eyebrow ? (
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--ink-muted)]">{eyebrow}</p>
            ) : null}
            <h2 className="mt-1 text-4xl font-semibold text-[var(--ink)] sm:text-3xl">
              {title}
            </h2>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>

        <section className="space-y-5 sm:space-y-6">{children}</section>
      </section>

      <nav className="safe-bottom floating-bar fixed bottom-0 left-0 right-0 z-30 px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3">
        <ul className="mx-auto grid w-full max-w-xl grid-cols-4 gap-2 sm:gap-3">
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center rounded-lg border px-2 text-center sm:min-h-16 sm:px-3",
                    active
                      ? "border-blue-200 bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "border-transparent text-[var(--ink-muted)]"
                  )}
                >
                  <span className="text-sm font-semibold leading-tight sm:text-base">{item.label}</span>
                  <span className="mt-0.5 text-[10px] uppercase tracking-[0.16em] opacity-80 sm:text-[11px]">{item.short}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </main>
  );
}

export function SectionCard({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <section className={cn("panel rounded-xl p-4", className)}>{children}</section>;
}

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-10 text-center">
      <div className="icon-circle">
        <span className="text-lg">•</span>
      </div>
      <h2 className="type-headline mt-4 text-[var(--ink)]">{title}</h2>
      <p className="type-body mt-2 max-w-sm text-[var(--ink-muted)]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
