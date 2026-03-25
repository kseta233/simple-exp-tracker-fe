"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/expenses", label: "List Transactions", icon: ExpensesIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon }
] as const;

function ExpensesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M4 12a8 8 0 1 1 16 0" />
      <path d="M12 12l4-3" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function AddIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M10.3 3.9c.6-1.2 2.3-1.2 2.9 0l.5 1.1c.3.6 1 .9 1.6.8l1.3-.2c1.3-.2 2.3 1 2 2.3l-.2 1.3c-.1.6.2 1.3.8 1.6l1.1.5c1.2.6 1.2 2.3 0 2.9l-1.1.5c-.6.3-.9 1-.8 1.6l.2 1.3c.2 1.3-1 2.3-2.3 2l-1.3-.2c-.6-.1-1.3.2-1.6.8l-.5 1.1c-.6 1.2-2.3 1.2-2.9 0l-.5-1.1c-.3-.6-1-.9-1.6-.8l-1.3.2c-1.3.2-2.5-.8-2.3-2l.2-1.3c.1-.6-.2-1.3-.8-1.6l-1.1-.5c-1.2-.6-1.2-2.3 0-2.9l1.1-.5c.6-.3.9-1 .8-1.6l-.2-1.3c-.2-1.3.8-2.5 2-2.3l1.3.2c.6.1 1.3-.2 1.6-.8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

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

      <Link
        href="/chat-add"
        aria-label="Add expense"
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-lg transition-transform hover:scale-105 sm:right-6"
      >
        <AddIcon className="h-6 w-6" />
      </Link>

      <nav className="safe-bottom floating-bar fixed bottom-0 left-0 right-0 z-30 px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3">
        <ul className="mx-auto grid w-full max-w-xl grid-cols-3 gap-2 sm:gap-3">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-label={item.label}
                  title={item.label}
                  className={cn(
                    "flex min-h-14 items-center justify-center rounded-lg border px-2 text-center transition-all sm:min-h-16 sm:px-3",
                    active
                      ? "-translate-y-0.5 border-blue-200 bg-[var(--primary-soft)] text-[var(--primary)] shadow-sm"
                      : "border-transparent text-[var(--ink-muted)] hover:bg-[var(--surface)]"
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="sr-only">{item.label}</span>
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
