import type { ReactNode } from "react";
import { RoleGuard } from "../../lib/components/RoleGuard";
import { PlacementSidebar, PlacementMobileNav } from "../../lib/components/PlacementNavigation";

export default function PlacementLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={["placement"]}>
      <div className="flex min-h-screen bg-slate-50 lg:flex-row flex-col">
        {/* Sidebar for Desktop */}
        <PlacementSidebar />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile Header & Nav */}
          <header className="flex flex-col border-b border-indigo-100 bg-white px-5 pt-4 lg:hidden">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-indigo-950">PlaceKaro</h1>
                <p className="text-[10px] uppercase tracking-wider text-indigo-400">Institutional Portal</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-indigo-950 text-white flex items-center justify-center text-xs font-bold">
                PC
              </div>
            </div>
            <PlacementMobileNav />
          </header>

          {/* Scrollable Page Content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
