import type { ReactNode } from "react";
import { RoleGuard } from "../../lib/components/RoleGuard";

import { RecruiterSidebar, RecruiterMobileNav } from "../../lib/components/RecruiterNavigation";

export default function RecruiterLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={["company"]}>
      <div className="flex min-h-screen bg-slate-50 lg:flex-row flex-col">
        {/* Sidebar for Desktop */}
        <RecruiterSidebar />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile Header & Nav */}
          <header className="flex flex-col border-b border-slate-200 bg-white px-5 pt-4 lg:hidden">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-950">PlaceKaro</h1>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Recruiter Portal</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                RC
              </div>
            </div>
            <RecruiterMobileNav />
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
