"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/context/AuthContext";
import { get, ref, query, orderByChild, equalTo } from "firebase/database";
import { database } from "../../lib/firebase/database";
import type { CompanyRecruiter, Job, Application } from "../../types/database";
import Link from "next/link";

export default function RecruiterDashboard() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [recruiterInfo, setRecruiterInfo] = useState<CompanyRecruiter | null>(null);
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [totalApplications, setTotalApplications] = useState(0);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.uid) return;
      
      try {
        setLoading(true);
        
        // 1. Get Recruiter Profile to find companyId
        const recruiterQuery = query(
          ref(database, "companyRecruiters"),
          orderByChild("userId"),
          equalTo(user.uid)
        );
        
        const recruiterSnap = await get(recruiterQuery);
        let currentRecruiter: CompanyRecruiter | null = null;
        
        if (recruiterSnap.exists()) {
          const recruiters = recruiterSnap.val() as Record<string, CompanyRecruiter>;
          currentRecruiter = Object.values(recruiters)[0];
          setRecruiterInfo(currentRecruiter);
        }

        if (currentRecruiter) {
          // 2. Fetch Jobs for this company
          const jobsQuery = query(
            ref(database, "jobs"),
            orderByChild("companyId"),
            equalTo(currentRecruiter.companyId)
          );
          
          const jobsSnap = await get(jobsQuery);
          const companyJobs: Job[] = [];
          
          if (jobsSnap.exists()) {
            const rawJobs = jobsSnap.val() as Record<string, Job>;
            Object.values(rawJobs).forEach(job => companyJobs.push(job));
            
            // Filter to only active/published jobs for the metric
            const active = companyJobs.filter(j => j.status === "published");
            setActiveJobs(active);
          }

          // 3. Fetch applications for these jobs
          if (companyJobs.length > 0) {
            const applicationsSnap = await get(ref(database, "applications"));
            if (applicationsSnap.exists()) {
              const allApps = applicationsSnap.val() as Record<string, Application>;
              const jobIds = companyJobs.map(j => j.id);
              
              const relevantApps = Object.values(allApps).filter(app => 
                jobIds.includes(app.jobId)
              );
              
              setTotalApplications(relevantApps.length);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load recruiter dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          <p className="text-sm text-slate-500 font-medium">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-5 sm:px-8">
        <div className="flex h-20 items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Recruiter Workspace</p>
            <h1 className="text-lg font-semibold text-slate-950">
              Overview
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {recruiterInfo?.name ?? user?.displayName ?? "Recruiter"}
              </p>
              <p className="text-xs text-slate-500">
                {recruiterInfo?.designation ?? "Talent Acquisition"}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {((recruiterInfo?.name || user?.displayName || "R").charAt(0)).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <section>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            Welcome back, {recruiterInfo?.name?.split(" ")[0] || "there"}!
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Here's what's happening with your job postings and applicants today.
          </p>
        </section>

        {/* High Level Metrics */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Job Postings
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {activeJobs.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">Currently published and accepting applications</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Applications
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {totalApplications}
            </p>
            <p className="mt-1 text-xs text-slate-500">Across all active and past jobs</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-950 text-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Quick Actions
              </p>
              <p className="mt-2 text-sm font-medium">
                Need to hire for a new role?
              </p>
            </div>
            <button className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-100 transition text-center">
              Create New Job (Coming Soon)
            </button>
          </div>
        </section>

        {/* Recent Active Jobs Summary */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-950">Your Active Roles</h3>
            <Link href="/recruiter/jobs" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition">
              View all jobs &rarr;
            </Link>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeJobs.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-white">
                <p className="text-sm font-medium text-slate-700">No active jobs found</p>
                <p className="mt-1 text-xs text-slate-500">Publish a job to start receiving applications.</p>
              </div>
            ) : (
              activeJobs.map(job => (
                <div key={job.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-slate-900">{job.title}</h4>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">{job.description}</p>
                  <Link 
                    href={`/recruiter/jobs/${job.id}`}
                    className="inline-flex items-center justify-center w-full rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-200 transition"
                  >
                    View Applicants
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
