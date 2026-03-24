"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/expenses", label: "Expenses", short: "List" },
  { href: "/dashboard", label: "Dashboard", short: "Stats" },
  { href: "/categories", label: "Categories", short: "Tags" }
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
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[rgba(247,249,251,0.85)] px-4 py-3 backdrop-blur-xl sm:px-5">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="h-9 w-9 rounded-full text-[var(--primary)] transition hover:bg-white"
              aria-label="Menu"
            >
              <span className="text-xl">≡</span>
            </button>
            <h1 className="font-heading text-lg font-bold tracking-[-0.01em] text-[var(--ink)] sm:text-xl">Precision Finance</h1>
          </div>
          <button
            type="button"
            className="h-9 w-9 rounded-full text-[var(--primary)] transition hover:bg-white"
            aria-label="Settings"
          >
            <span className="text-lg">⚙</span>
          </button>
        </div>
      </header>

      <section className="mx-auto w-full max-w-xl px-4 pt-5 sm:px-5 sm:pt-6">
        <div className="mb-5 flex flex-col items-start gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            {eyebrow ? (
              <p className="type-label font-semibold uppercase tracking-[0.22em] text-[var(--ink-muted)]">{eyebrow}</p>
            ) : null}
            <h2 className="type-headline mt-2 text-[var(--primary)]">
              {title}
            </h2>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>

        <section className="space-y-5 sm:space-y-6">{children}</section>
      </section>

      <nav className="safe-bottom floating-bar fixed bottom-0 left-0 right-0 z-30 rounded-t-[28px] px-3 pb-3 pt-2 shadow-[0_-8px_22px_rgba(0,11,96,0.06)] sm:px-4 sm:pb-4 sm:pt-3">
        <ul className="mx-auto grid w-full max-w-xl grid-cols-3 gap-2 sm:gap-3">
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center rounded-2xl px-2 text-center transition sm:min-h-16 sm:px-3",
                    active
                      ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "text-[var(--ink-muted)] hover:bg-white"
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
  return <section className={cn("panel rounded-3xl p-4", className)}>{children}</section>;
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
    <div className="flex min-h-56 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-10 text-center">
      <div className="icon-circle">
        <span className="text-lg">•</span>
      </div>
      <h2 className="type-headline mt-4 text-[var(--ink)]">{title}</h2>
      <p className="type-body mt-2 max-w-sm text-[var(--ink-muted)]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
