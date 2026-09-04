"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../lib/context/AuthContext";
import { RoleGuard } from "../../../lib/components/RoleGuard";
import { jobService } from "../../../lib/services/jobService";
import { Job } from "../../../types/database";

function JobsDashboardContent() {
  const { user } = useAuth();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      if (!user || user.role !== "company") return;
      
      try {
        // For MVP, user.uid represents the companyId since we don't have separate company accounts fully wired up
        const companyJobs = await jobService.getJobsByCompany(user.uid);
        setJobs(companyJobs);
      } catch (error) {
        console.error("Failed to load jobs", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadJobs();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/recruiter" className="text-sm font-medium text-slate-500 hover:text-slate-900">
                &larr; Back to Dashboard
              </Link>
              <div className="h-4 w-px bg-slate-300"></div>
              <p className="text-sm font-bold tracking-widest text-slate-900">
                PLACEKARO <span className="text-slate-400 font-normal ml-2">| Jobs</span>
              </p>
            </div>
            <div>
              <Link 
                href="/recruiter/jobs/create" 
                className="rounded-md bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                + Create New Job
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Job Listings</h1>
            <p className="mt-1 text-sm text-slate-500">
              {loading ? "Loading jobs..." : `Manage your ${jobs.length} active and draft job postings.`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em]"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-12 text-center max-w-2xl mx-auto">
            <h3 className="text-base font-semibold text-slate-900">No jobs posted yet</h3>
            <p className="mt-2 text-sm text-slate-500 mb-6">
              Get started by creating your first job posting and setting up requirements.
            </p>
            <Link 
              href="/recruiter/jobs/create"
              className="rounded-md bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Create New Job
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Title</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Access Model</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Created</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">
                      {job.title}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        job.status === 'published' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 
                        job.status === 'draft' ? 'bg-slate-50 text-slate-600 ring-slate-500/10' : 
                        'bg-red-50 text-red-700 ring-red-600/10'
                      }`}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                      {job.assessmentAccessModel.replace("_", " ")}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <Link href={`/recruiter/jobs/${job.id}`} className="text-slate-600 hover:text-slate-900">
                        View <span className="sr-only">, {job.title}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default function JobsPage() {
  return (
    <RoleGuard allowedRoles={["company"]}>
      <JobsDashboardContent />
    </RoleGuard>
  );
}
