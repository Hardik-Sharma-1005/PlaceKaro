import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { signOutUser } from "../services/authService";

export function StudentSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { name: "Dashboard", href: "/" },
    { name: "Opportunities", href: "/opportunities" },
    { name: "Assessments", href: "/assessments" },
    { name: "My Profile", href: "/profile" },
  ];

  async function handleLogout() {
    try {
      await signOutUser();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-20 items-center border-b border-slate-200 px-6">
        <div>
          <Link href="/" className="text-xl font-bold tracking-tight text-slate-950 hover:opacity-80">
            PlaceKaro
          </Link>
          <div className="text-xs text-slate-500">Placement Intelligence</div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6">
        <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </div>

        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isActive ? "bg-white" : "bg-slate-300"
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-200 p-4 space-y-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Profile Status
          </p>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Keep your skills and evidence up-to-date for better job matches.
          </p>
        </div>

        {user && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-red-600 transition"
          >
            Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}

export function StudentMobileNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/" },
    { name: "Opportunities", href: "/opportunities" },
    { name: "Assessments", href: "/assessments" },
    { name: "My Profile", href: "/profile" },
  ];

  return (
    <nav className="flex gap-2 overflow-x-auto pb-4 lg:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
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
