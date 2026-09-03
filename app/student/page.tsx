"use client";

import Link from "next/link";
import { useAuth } from "../../lib/context/AuthContext";
import { RoleGuard } from "../../lib/components/RoleGuard";
import { NotificationBell } from "../../lib/components/NotificationBell";
import { signOutUser } from "../../lib/services/authService";

function StudentDashboardContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <p className="text-sm font-bold tracking-widest text-slate-900">
              PLACEKARO <span className="text-slate-400 font-normal ml-2">| Student Hub</span>
            </p>
            <button 
              onClick={() => signOutUser()}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.displayName || "Student"}</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your profile, browse jobs, and take assessments.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white overflow-hidden rounded-xl shadow-sm ring-1 ring-slate-200 p-6 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-xl mb-4">
                💼
              </div>
              <h3 className="text-lg font-bold text-slate-900">Job Board</h3>
              <p className="mt-2 text-sm text-slate-500">
                Browse open roles, check your eligibility, and apply to companies.
              </p>
            </div>
            <div className="mt-6">
              <Link 
                href="/student/jobs"
                className="flex justify-center w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Browse Jobs
              </Link>
            </div>
          </div>

          <div className="bg-white overflow-hidden rounded-xl shadow-sm ring-1 ring-slate-200 p-6 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-xl mb-4">
                👤
              </div>
              <h3 className="text-lg font-bold text-slate-900">My Profile</h3>
              <p className="mt-2 text-sm text-slate-500">
                Update your academics, skills, and projects to improve your Placement Intelligence Score (PIS).
              </p>
            </div>
            <div className="mt-6">
              <Link 
                href="/profile"
                className="flex justify-center w-full rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
              >
                Edit Profile
              </Link>
            </div>
          </div>

          <div className="bg-white overflow-hidden rounded-xl shadow-sm ring-1 ring-slate-200 p-6 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center text-xl mb-4">
                📅
              </div>
              <h3 className="text-lg font-bold text-slate-900">My Applications</h3>
              <p className="mt-2 text-sm text-slate-500">
                Track your job applications, view status updates, and check scheduled interviews.
              </p>
            </div>
            <div className="mt-6">
              <Link 
                href="/student/applications"
                className="flex justify-center w-full rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
              >
                View Applications
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <RoleGuard allowedRoles={["student"]}>
      <StudentDashboardContent />
    </RoleGuard>
  );
}
