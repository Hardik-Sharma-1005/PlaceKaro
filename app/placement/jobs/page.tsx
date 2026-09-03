"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "../../../lib/components/RoleGuard";
import { placementService } from "../../../lib/services/placementService";
import { Job } from "../../../types/database";

function PlacementJobsContent() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    setLoading(true);
    try {
      const pendingJobs = await placementService.getPendingJobs();
      setJobs(pendingJobs);
    } catch (error) {
      console.error("Failed to load pending jobs:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleApprove = async (jobId: string) => {
    try {
      await placementService.approveJob(jobId);
      // Remove from list
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (error) {
      console.error("Failed to approve job", error);
    }
  };

  const handleReject = async (jobId: string) => {
    try {
      await placementService.rejectJob(jobId);
      // Remove from list
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (error) {
      console.error("Failed to reject job", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-4">
            <Link href="/placement" className="text-sm font-medium text-slate-500 hover:text-slate-900">
              &larr; Back to Dashboard
            </Link>
            <div className="h-4 w-px bg-slate-300"></div>
            <p className="text-sm font-bold tracking-widest text-slate-900">
              PLACEKARO <span className="text-slate-400 font-normal ml-2">| Job Approvals</span>
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Job Approvals</h1>
            <p className="mt-1 text-sm text-slate-500">Review and approve company job postings before they go live.</p>
          </div>
          <span className="inline-flex items-center rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
            {jobs.length} Pending
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-r-transparent"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm ring-1 ring-slate-200">
            <p className="text-slate-500">No jobs currently pending approval.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map(job => (
              <div key={job.id} className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6 flex flex-col sm:flex-row gap-6 justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{job.title}</h2>
                  <p className="text-sm text-slate-500 mt-1">Submitted on {new Date(job.createdAt).toLocaleDateString()}</p>
                  
                  <div className="mt-4">
                    <p className="text-sm text-slate-700 font-medium">Description</p>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-3">{job.description}</p>
                  </div>
                </div>

                <div className="flex shrink-0 gap-3">
                  <button 
                    onClick={() => handleReject(job.id)}
                    className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleApprove(job.id)}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
                  >
                    Approve & Publish
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function PlacementJobsPage() {
  return (
    <RoleGuard allowedRoles={["placement"]}>
      <PlacementJobsContent />
    </RoleGuard>
  );
}
