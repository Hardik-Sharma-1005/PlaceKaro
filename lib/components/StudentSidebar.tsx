"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface StudentSidebarProps {
  activeTabOverride?: "dashboard" | "profile" | "opportunities" | "assessments" | "activity";
}

export function StudentSidebar({ activeTabOverride }: StudentSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("placekaro_student_sidebar_collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("placekaro_student_sidebar_collapsed", String(next));
      } catch {
        // Ignore localStorage errors
      }
      return next;
    });
  }

  const isDashboard =
    activeTabOverride === "dashboard" ||
    (pathname === "/" && !activeTabOverride);

  const isProfile =
    activeTabOverride === "profile" ||
    (pathname.startsWith("/profile") && !activeTabOverride);

  const isOpportunities =
    activeTabOverride === "opportunities" ||
    (pathname.startsWith("/opportunities") && !activeTabOverride);

  const isAssessments = activeTabOverride === "assessments";
  const isActivity = activeTabOverride === "activity";

  return (
    <aside
      className={`hidden flex-col border-r border-slate-200 bg-white transition-all duration-300 lg:flex shrink-0 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div className={`flex h-20 items-center border-b border-slate-200 px-4 ${collapsed ? "justify-center" : ""}`}>
        <button
          type="button"
          onClick={toggleCollapse}
          className="flex items-center gap-3 overflow-hidden text-left cursor-pointer group focus:outline-none"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Image
            src="/placekaro-logo.png"
            alt="PlaceKaro Logo"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full object-cover transition-transform duration-200 group-hover:scale-105"
          />

          {!collapsed && (
            <div className="min-w-0">
              <div className="text-lg font-bold tracking-tight text-slate-950 truncate transition-colors duration-200 group-hover:text-slate-700">
                Place<span className="text-[#F5B900]">Karo</span>
              </div>

              <div className="text-[10px] uppercase tracking-wider text-slate-500 truncate">
                Placement Intelligence
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-6">
        {!collapsed && (
          <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </div>
        )}

        <div className="space-y-1">
          <Link
            href="/"
            title="Dashboard"
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
              collapsed ? "justify-center" : ""
            } ${
              isDashboard
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                isDashboard ? "bg-white" : "bg-slate-300"
              }`}
            />
            {!collapsed && <span>Dashboard</span>}
          </Link>

          <Link
            href="/profile"
            title="My Profile"
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
              collapsed ? "justify-center" : ""
            } ${
              isProfile
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                isProfile ? "bg-white" : "bg-slate-300"
              }`}
            />
            {!collapsed && <span>My Profile</span>}
          </Link>

          <Link
            href="/opportunities"
            title="Opportunities"
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
              collapsed ? "justify-center" : ""
            } ${
              isOpportunities
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                isOpportunities ? "bg-white" : "bg-slate-300"
              }`}
            />
            {!collapsed && <span>Opportunities</span>}
          </Link>

          <button
            type="button"
            title="Assessments"
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
              collapsed ? "justify-center" : ""
            } ${
              isAssessments
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                isAssessments ? "bg-white" : "bg-slate-300"
              }`}
            />
            {!collapsed && <span>Assessments</span>}
          </button>

          <button
            type="button"
            title="Activity"
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
              collapsed ? "justify-center" : ""
            } ${
              isActivity
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                isActivity ? "bg-white" : "bg-slate-300"
              }`}
            />
            {!collapsed && <span>Activity</span>}
          </button>
        </div>
      </nav>

      {/* Footer / Profile hint card */}
      {!collapsed && (
        <div className="border-t border-slate-200 p-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Profile
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-900">
              Keep your evidence updated
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              A stronger verified profile helps you become more discoverable.
            </p>

            <Link
              href="/profile"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:underline"
            >
              <span>Edit Portfolio & Evidence</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
