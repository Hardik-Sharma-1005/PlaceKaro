"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../lib/context/AuthContext";
import { RoleGuard } from "../../../lib/components/RoleGuard";
import { jobService } from "../../../lib/services/jobService";
import { candidateService } from "../../../lib/services/candidateService";
import { applicationService } from "../../../lib/services/applicationService";
import { Job, JobRequirements, StudentProfile, Application } from "../../../types/database";

// Needs to load ALL jobs for now (MVP). Later, we'd query by status.
import { get, ref, query, orderByChild, equalTo } from "firebase/database";
import { database } from "../../../lib/firebase/database";

type JobWithStatus = Job & {
  isEligible: boolean;
  application: Application | null;
  requirements: JobRequirements | null;
};

function StudentJobsBoard() {
  const { user } = useAuth();
  
  const [jobs, setJobs] = useState<JobWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        // 1. Fetch Student Profile
        const profile = await candidateService.getCandidateById(user.uid);
        
        // 2. Fetch Published Jobs
        const q = query(ref(database, "jobs"), orderByChild("status"), equalTo("published"));
        const snapshot = await get(q);
        
        if (!snapshot.exists()) {
          setJobs([]);
          setLoading(false);
          return;
        }

        const jobsData = snapshot.val();
        const activeJobs: Job[] = Object.keys(jobsData).map(key => ({ ...jobsData[key], id: key }));

        // 3. Evaluate each job
        const evaluatedJobs = await Promise.all(activeJobs.map(async (job) => {
          const requirements = await jobService.getJobRequirements(job.id);
          const application = await applicationService.getApplication(user.uid, job.id);
          
          let isEligible = true;
          if (profile && requirements) {
            const hard = requirements.hardEligibility;
            if (hard.minimumCGPA && profile.cgpa < hard.minimumCGPA) isEligible = false;
            if (hard.maximumBacklogs !== undefined && hard.maximumBacklogs !== null && profile.backlogCount > hard.maximumBacklogs) isEligible = false;
            if (hard.branches && hard.branches.length > 0 && !hard.branches.includes(profile.branch)) isEligible = false;
            if (hard.graduationYears && hard.graduationYears.length > 0 && !hard.graduationYears.includes(profile.graduationYear)) isEligible = false;
          }

          return {
            ...job,
            requirements,
            application,
            isEligible
          };
        }));

        setJobs(evaluatedJobs.sort((a, b) => b.createdAt - a.createdAt));
      } catch (error) {
        console.error("Failed to load job board:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [user]);

  const handleApply = async (jobId: string) => {
    if (!user) return;
    setApplyingTo(jobId);
    try {
      await applicationService.applyToJob(user.uid, jobId);
      // Refresh local state
      const application = await applicationService.getApplication(user.uid, jobId);
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, application } : j));
    } catch (error) {
      console.error("Failed to apply", error);
    } finally {
      setApplyingTo(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-4">
            <Link href="/student" className="text-sm font-medium text-slate-500 hover:text-slate-900">
              &larr; Back to Dashboard
            </Link>
            <div className="h-4 w-px bg-slate-300"></div>
            <p className="text-sm font-bold tracking-widest text-slate-900">
              PLACEKARO <span className="text-slate-400 font-normal ml-2">| Job Board</span>
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Available Opportunities</h1>
          <p className="mt-1 text-sm text-slate-500">Apply to jobs matching your profile to unlock assessments.</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-r-transparent"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm ring-1 ring-slate-200">
            <p className="text-slate-500">No active job postings right now. Check back later!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6 flex flex-col sm:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-slate-900">{job.title}</h2>
                      {job.application ? (
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                          Applied
                        </span>
                      ) : job.isEligible ? (
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          Eligible
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                          Not Eligible
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{job.description}</p>
                  </div>
                  
                  {job.requirements && (
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                        CGPA {job.requirements.hardEligibility.minimumCGPA}+
                      </span>
                      {job.requirements.hardEligibility.maximumBacklogs !== undefined && (
                        <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                          Max Backlogs: {job.requirements.hardEligibility.maximumBacklogs}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="sm:w-48 flex flex-col justify-end gap-3 shrink-0">
                  {job.application && job.application.assessmentUnlocked ? (
                    <Link 
                      href={`/student/jobs/${job.id}/assessment`}
                      className="w-full text-center rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                      Take Assessment
                    </Link>
                  ) : job.application ? (
                    <button disabled className="w-full rounded-md bg-slate-100 px-3.5 py-2.5 text-sm font-semibold text-slate-400">
                      Application Pending
                    </button>
                  ) : job.isEligible ? (
                    <button 
                      onClick={() => handleApply(job.id)}
                      disabled={applyingTo === job.id}
                      className="w-full rounded-md bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
                    >
                      {applyingTo === job.id ? "Applying..." : "Apply Now"}
                    </button>
                  ) : (
                    <button disabled className="w-full rounded-md bg-slate-100 px-3.5 py-2.5 text-sm font-semibold text-slate-400">
                      Does Not Meet Criteria
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function StudentJobsPage() {
  return (
    <RoleGuard allowedRoles={["student"]}>
      <StudentJobsBoard />
    </RoleGuard>
  );
}
