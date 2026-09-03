"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { signOutUser } from "../services/authService";

export function RecruiterSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { name: "Dashboard", href: "/recruiter" },
    { name: "My Jobs", href: "/recruiter/jobs" },
  ];

  async function handleLogout() {
    try {
      await signOutUser();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200 bg-slate-950 lg:flex">
      <div className="flex h-20 items-center border-b border-white/10 px-6">
        <div>
          <Link href="/recruiter" className="text-xl font-bold tracking-tight text-white hover:opacity-80">
            PlaceKaro
          </Link>
          <div className="text-xs text-slate-400">Recruiter Portal</div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6">
        <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Workspace
        </div>

        <div className="space-y-1">
          {navItems.map((item) => {
            // Exact match for /recruiter, startsWith for /recruiter/jobs
            const isActive = item.href === "/recruiter" 
              ? pathname === "/recruiter"
              : pathname.startsWith(item.href);
              
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-slate-900"
                    : "text-slate-300 hover:bg-white/10"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isActive ? "bg-slate-900" : "bg-slate-600"
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 p-4 space-y-3">
        <div className="rounded-2xl bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Company Access
          </p>
          <p className="mt-1 text-xs text-slate-300 leading-relaxed">
            Manage your opportunities and view AI-backed candidate intelligence.
          </p>
        </div>

        {user && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}

export function RecruiterMobileNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/recruiter" },
    { name: "My Jobs", href: "/recruiter/jobs" },
  ];

  return (
    <nav className="flex gap-2 overflow-x-auto pb-4 lg:hidden">
      {navItems.map((item) => {
        const isActive = item.href === "/recruiter" 
          ? pathname === "/recruiter"
          : pathname.startsWith(item.href);
          
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition ${
              isActive
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
