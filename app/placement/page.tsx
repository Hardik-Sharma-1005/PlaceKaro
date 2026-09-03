"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../lib/context/AuthContext";
import { RoleGuard } from "../../lib/components/RoleGuard";
import { placementService } from "../../lib/services/placementService";
import { NotificationBell } from "../../lib/components/NotificationBell";

function PlacementDashboardContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalStudents: 0, publishedJobs: 0, pendingJobs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const dashboardStats = await placementService.getDashboardStats();
        setStats(dashboardStats);
      } catch (error) {
        console.error("Failed to load TPO stats:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm font-bold tracking-widest text-slate-900">
                PLACEKARO <span className="text-slate-400 font-normal ml-2">| Placement Cell</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <button
                onClick={async () => {
                  const { signOutUser } = await import("../../lib/services/authService");
                  await signOutUser();
                  window.location.href = "/auth";
                }}
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Training & Placement Officer (TPO)</h1>
          <p className="mt-1 text-sm text-slate-500">Manage student verifications and approve job listings.</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-r-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white overflow-hidden rounded-xl shadow-sm ring-1 ring-slate-200 p-6 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-xl mb-4">
                  👥
                </div>
                <h3 className="text-lg font-bold text-slate-900">Students Overview</h3>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.totalStudents}</p>
                <p className="text-sm text-slate-500 mt-1">Total registered students</p>
              </div>
              <div className="mt-6">
                <Link 
                  href="/placement/students"
                  className="flex justify-center w-full rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                >
                  View Students
                </Link>
              </div>
            </div>

            <div className="bg-white overflow-hidden rounded-xl shadow-sm ring-1 ring-slate-200 p-6 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-xl mb-4">
                  🏢
                </div>
                <h3 className="text-lg font-bold text-slate-900">Active Jobs</h3>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.publishedJobs}</p>
                <p className="text-sm text-slate-500 mt-1">Currently published jobs</p>
              </div>
            </div>

            <div className="bg-white overflow-hidden rounded-xl shadow-sm ring-1 ring-slate-200 p-6 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center text-xl mb-4">
                  ⏳
                </div>
                <h3 className="text-lg font-bold text-slate-900">Pending Approvals</h3>
                <p className="mt-2 text-3xl font-semibold text-amber-600">{stats.pendingJobs}</p>
                <p className="text-sm text-slate-500 mt-1">Jobs awaiting your approval</p>
              </div>
              <div className="mt-6">
                <Link 
                  href="/placement/jobs"
                  className="flex justify-center w-full rounded-md bg-amber-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-500"
                >
                  Review Jobs
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function PlacementDashboardPage() {
  return (
    <RoleGuard allowedRoles={["placement"]}>
      <PlacementDashboardContent />
    </RoleGuard>
  );
}
