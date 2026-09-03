"use client";

import Link from "next/link";
import { useAuth } from "../lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "company") {
        router.push("/recruiter");
      } else if (user.role === "placement") {
        router.push("/placement");
      } else {
        router.push("/student");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-r-transparent"></div>
      </div>
    );
  }

  // If user is already logged in, they will be redirected by the useEffect above
  if (user) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="text-2xl font-bold tracking-tight text-slate-900">PlaceKaro</span>
            </Link>
          </div>
          <div className="flex flex-1 justify-end items-center gap-x-6">
            <Link href="/auth" className="text-sm font-semibold leading-6 text-slate-900 hover:text-indigo-600 transition">
              Log in
            </Link>
            <Link
              href="/auth"
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition"
            >
              Sign up
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-4xl py-32 sm:py-48 lg:py-56 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            The Ultimate Placement Intelligence Platform
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto">
            Bridge the gap between campus and corporate. PlaceKaro provides an end-to-end ecosystem for students to build profiles, recruiters to hire top talent via Placement Intelligence Scores (PIS), and Placement Cells to orchestrate it all.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/auth"
              className="rounded-md bg-indigo-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition"
            >
              Get Started
            </Link>
            <Link href="/demo" className="text-base font-semibold leading-6 text-slate-900 hover:text-indigo-600 transition flex items-center gap-2">
              Generate Demo Data <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Role sections */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-32">
        <div className="grid md:grid-cols-3 gap-8">
          
          <div className="bg-white p-8 rounded-3xl shadow-sm ring-1 ring-slate-200 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-6">
              🎓
            </div>
            <h3 className="text-xl font-bold text-slate-900">For Students</h3>
            <p className="mt-4 text-slate-500 text-sm flex-1">
              Build a verified portfolio, take custom recruiter assessments, and track your applications in real-time. Boost your Placement Intelligence Score to stand out.
            </p>
            <Link href="/auth" className="mt-8 text-sm font-semibold text-blue-600 hover:text-blue-500">Student Portal &rarr;</Link>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm ring-1 ring-slate-200 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-3xl mb-6">
              🏢
            </div>
            <h3 className="text-xl font-bold text-slate-900">For Recruiters</h3>
            <p className="mt-4 text-slate-500 text-sm flex-1">
              Publish jobs, set eligibility criteria, and create custom assessments. Use our PIS leaderboard to instantly identify and shortlist the absolute best candidates.
            </p>
            <Link href="/auth" className="mt-8 text-sm font-semibold text-purple-600 hover:text-purple-500">Recruiter Portal &rarr;</Link>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm ring-1 ring-slate-200 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl mb-6">
              📊
            </div>
            <h3 className="text-xl font-bold text-slate-900">For Placement Cells</h3>
            <p className="mt-4 text-slate-500 text-sm flex-1">
              Maintain complete control. Verify student credentials, approve company job postings before they go live, and track college-wide placement statistics.
            </p>
            <Link href="/auth" className="mt-8 text-sm font-semibold text-emerald-600 hover:text-emerald-500">TPO Portal &rarr;</Link>
          </div>

        </div>
      </div>
    </div>
  );
}