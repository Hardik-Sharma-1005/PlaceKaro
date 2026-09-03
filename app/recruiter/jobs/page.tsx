"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../lib/context/AuthContext";
import { get, ref, query, orderByChild, equalTo } from "firebase/database";
import { database } from "../../../lib/firebase/database";
import type { CompanyRecruiter, Job, Application } from "../../../types/database";
import Link from "next/link";

interface JobWithStats extends Job {
  applicantCount: number;
}

export default function RecruiterJobsList() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobWithStats[]>([]);

  useEffect(() => {
    async function loadJobs() {
      if (!user?.uid) return;
      
      try {
        setLoading(true);
        
        // 1. Get Recruiter Profile
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
        }

        if (currentRecruiter) {
          // 2. Fetch Jobs
          const jobsQuery = query(
            ref(database, "jobs"),
            orderByChild("companyId"),
            equalTo(currentRecruiter.companyId)
          );
          
          const jobsSnap = await get(jobsQuery);
          const companyJobs: JobWithStats[] = [];
          
          if (jobsSnap.exists()) {
            const rawJobs = jobsSnap.val() as Record<string, Job>;
            
            // 3. Fetch applications to count applicants per job
            const applicationsSnap = await get(ref(database, "applications"));
            const allApps = applicationsSnap.exists() 
              ? (applicationsSnap.val() as Record<string, Application>)
              : {};
              
            Object.values(rawJobs).forEach(job => {
              const count = Object.values(allApps).filter(app => app.jobId === job.id).length;
              companyJobs.push({ ...job, applicantCount: count });
            });
            
            // Sort by most recent
            companyJobs.sort((a, b) => b.createdAt - a.createdAt);
            setJobs(companyJobs);
          }
        }
      } catch (err) {
        console.warn("Could not load jobs due to Firebase permissions:", err);
        // MOCK DATA FOR DEMO PURPOSES
        setJobs([{
          id: "mock-job-123",
          companyId: "mock-company",
          recruiterId: "mock-recruiter",
          title: "Mock Software Engineer (Test Data)",
          description: "This is a dummy job for testing the assessment flow without Firebase permissions.",
          status: "published",
          assessmentAccessModel: "all_eligible",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          applicantCount: 5
        }]);
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, [user?.uid]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-5 sm:px-8">
        <div className="flex h-20 items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Recruiter Workspace</p>
            <h1 className="text-lg font-semibold text-slate-950">
              My Job Postings
            </h1>
          </div>
          <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition">
            + Post New Job
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-base font-semibold text-slate-900">No jobs posted yet</p>
            <p className="mt-1 text-sm text-slate-500">Create your first job posting to attract candidates.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Job Title</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Applicants</th>
                    <th className="px-6 py-4">Date Posted</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {job.title}
                        <p className="text-xs text-slate-500 font-normal mt-0.5 line-clamp-1 max-w-sm">
                          {job.description}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                          job.status === "published" 
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{job.applicantCount}</span>
                          <span className="text-xs text-slate-500">candidates</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/recruiter/jobs/${job.id}`}
                          className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-200 transition"
                        >
                          View ATS &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
