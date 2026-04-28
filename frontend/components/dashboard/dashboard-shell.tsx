"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

type DashboardShellProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/expenses", label: "Expenses", icon: "💰" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
];

export function DashboardShell({
  title,
  description,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("user_token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  const onLogout = () => {
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_details");

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("user_")) {
        localStorage.removeItem(key);
      }
    });

    router.replace("/login");
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen w-full bg-white md:grid-cols-[280px_1fr]">
        <aside className="border-b border-slate-200 bg-white p-6 md:border-b-0 md:border-r">
          <Link href="/dashboard" className="block">
            <Image
              src="/logo.png"
              alt="Expense Tracker"
              width={520}
              height={160}
              priority
              className="h-auto w-full max-w-[240px]"
            />
          </Link>
          <div className="mt-4 h-px w-full bg-slate-200" />
          <p className="mt-3 text-sm text-slate-500">
            Track smarter, spend better
          </p>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span aria-hidden>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={onLogout}
            className="mt-8 inline-flex w-full items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            Logout
          </button>
        </aside>

        <section className="p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
          <div className="mt-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
