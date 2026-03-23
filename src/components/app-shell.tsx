"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/expenses", label: "Expenses", short: "List" },
  { href: "/dashboard", label: "Dashboard", short: "Stats" },
  { href: "/chat-add", label: "Add", short: "Capture" },
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
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      <section className="panel-hero relative overflow-hidden rounded-[32px] border border-white/70 p-6 shadow-[0_18px_80px_rgba(56,39,25,0.12)] sm:p-8">
        <div className="absolute inset-y-0 right-0 w-32 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.7),transparent_70%)]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-strong)]">{eyebrow}</p> : null}
            <div>
              <h1 className="font-heading text-3xl tracking-[-0.04em] text-[var(--ink-strong)] sm:text-5xl">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-soft)] sm:text-base">
                Local-first, draft-first, confirmation-first.
              </p>
            </div>
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </section>

      <section className="mt-6 flex-1 space-y-6">{children}</section>

      <nav className="safe-bottom fixed bottom-4 left-1/2 z-20 w-[min(720px,calc(100vw-1.5rem))] -translate-x-1/2 rounded-[28px] border border-white/70 bg-[rgba(255,252,247,0.86)] p-2 shadow-[0_18px_80px_rgba(56,39,25,0.16)] backdrop-blur-xl">
        <ul className="grid grid-cols-4 gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-16 flex-col items-center justify-center rounded-[22px] px-3 py-2 text-center transition",
                    active
                      ? "bg-[var(--accent)] text-white shadow-[0_10px_30px_rgba(194,91,52,0.32)]"
                      : "text-[var(--ink-soft)] hover:bg-white hover:text-[var(--ink-strong)]"
                  )}
                >
                  <span className="text-sm font-semibold">{item.label}</span>
                  <span className="text-[11px] uppercase tracking-[0.18em] opacity-75">{item.short}</span>
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
  return <section className={cn("panel rounded-[28px] p-5 sm:p-6", className)}>{children}</section>;
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
    <div className="panel-muted flex min-h-56 flex-col items-center justify-center rounded-[28px] border border-dashed px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-[0_10px_30px_rgba(56,39,25,0.12)]">
        +
      </div>
      <h2 className="mt-4 font-heading text-2xl text-[var(--ink-strong)]">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--ink-soft)]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
