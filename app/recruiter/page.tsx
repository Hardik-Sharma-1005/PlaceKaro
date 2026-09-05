"use client";

import Link from "next/link";
import { useAuth } from "../../lib/context/AuthContext";
import { RoleGuard } from "../../lib/components/RoleGuard";

function RecruiterDashboardContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <Link href="/" className="text-sm font-bold tracking-widest text-slate-900 hover:text-slate-700 transition">
                PLACEKARO <span className="text-slate-400 font-normal ml-2">| Recruiter</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                  <span className="text-xs font-semibold text-slate-600">
                    {user?.displayName?.charAt(0)?.toUpperCase() || "R"}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-slate-900">{user?.displayName}</p>
                  <p className="text-xs text-slate-500">Recruiter</p>
                </div>
              </div>

              <button
                onClick={async () => {
                  const { signOutUser } = await import("../../lib/services/authService");
                  await signOutUser();
                  window.location.href = "/auth";
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of your candidate discovery and recruitment pipelines.
          </p>
        </div>

        {/* Placeholder Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          
          {/* Candidate Search Card */}
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Candidate Search</h3>
              <p className="mt-2 text-sm text-slate-500">
                Discover suitable candidates using natural language or structured filters.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/recruiter/pis"
                className="flex justify-center w-full rounded-md bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                Search Candidates
              </Link>
            </div>
          </div>

          {/* Bookmarks Card */}
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Bookmarked Profiles</h3>
              <p className="mt-2 text-sm text-slate-500">
                View candidates you've saved for further review.
              </p>
            </div>
            <div className="mt-6">
              <Link 
                href="/recruiter/bookmarks"
                className="flex justify-center w-full rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
              >
                View Bookmarks
              </Link>
            </div>
          </div>

          {/* Active Jobs Card */}
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Active Jobs</h3>
              <p className="mt-2 text-sm text-slate-500">
                Manage your published job postings and candidate pipelines.
              </p>
            </div>
            <div className="mt-6">
              <Link 
                href="/recruiter/jobs"
                className="flex justify-center w-full rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
              >
                Manage Jobs
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function RecruiterPage() {
  return (
    <RoleGuard allowedRoles={["company"]}>
      <RecruiterDashboardContent />
    </RoleGuard>
  );
}
