"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { signOutUser } from "../services/authService";

export function PlacementSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { name: "Dashboard", href: "/placement" },
    { name: "Student Directory", href: "/placement/students" },
  ];

  async function handleLogout() {
    try {
      await signOutUser();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  return (
    <aside className="hidden w-64 flex-col border-r border-indigo-100 bg-indigo-950 lg:flex">
      <div className="flex h-20 items-center border-b border-indigo-900 px-6">
        <div>
          <Link href="/placement" className="text-xl font-bold tracking-tight text-white hover:opacity-80">
            PlaceKaro
          </Link>
          <div className="text-xs text-indigo-300">Institutional Portal</div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6">
        <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-indigo-400">
          Intelligence
        </div>

        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === "/placement" 
              ? pathname === "/placement"
              : pathname.startsWith(item.href);
              
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-indigo-950"
                    : "text-indigo-200 hover:bg-indigo-900"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isActive ? "bg-indigo-900" : "bg-indigo-500"
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-indigo-900 p-4 space-y-3">
        <div className="rounded-2xl bg-indigo-900/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Placement Cell
          </p>
          <p className="mt-1 text-xs text-indigo-200 leading-relaxed">
            Monitor batch readiness and student employability visibility.
          </p>
        </div>

        {user && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-indigo-800 py-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-900 hover:text-white transition"
          >
            Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}

export function PlacementMobileNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/placement" },
    { name: "Student Directory", href: "/placement/students" },
  ];

  return (
    <nav className="flex gap-2 overflow-x-auto pb-4 lg:hidden">
      {navItems.map((item) => {
        const isActive = item.href === "/placement" 
          ? pathname === "/placement"
          : pathname.startsWith(item.href);
          
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition ${
              isActive
                ? "bg-indigo-950 text-white"
                : "border border-indigo-100 bg-white text-indigo-900 hover:bg-indigo-50"
            }`}
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
