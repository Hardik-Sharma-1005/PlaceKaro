"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../lib/context/AuthContext";
import { RoleGuard } from "../../../lib/components/RoleGuard";
import { applicationService } from "../../../lib/services/applicationService";
import { jobService } from "../../../lib/services/jobService";
import { interviewService } from "../../../lib/services/interviewService";
import { Application, Job, Interview } from "../../../types/database";

type AppData = {
  application: Application;
  job: Job | null;
  interviews: Interview[];
};

function StudentApplicationsContent() {
  const { user } = useAuth();
  
  const [apps, setApps] = useState<AppData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApps() {
      if (!user) return;
      try {
        const applications = await applicationService.getApplicationsForStudent(user.uid);
        
        const appsData = await Promise.all(applications.map(async (app) => {
          const job = await jobService.getJobById(app.jobId);
          const interviews = await interviewService.getInterviewsForApplication(app.id);
          return { application: app, job, interviews };
        }));

        // Sort by most recent application first
        appsData.sort((a, b) => (b.application.appliedAt || 0) - (a.application.appliedAt || 0));
        
        setApps(appsData);
      } catch (error) {
        console.error("Failed to load applications:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadApps();
  }, [user]);

  const getStatusBadge = (status: Application['status']) => {
    switch (status) {
      case 'applied': return <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">Applied</span>;
      case 'under_review': return <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">Under Review</span>;
      case 'shortlisted': return <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Shortlisted</span>;
      case 'rejected': return <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Not Selected</span>;
      case 'hired': return <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">Hired!</span>;
      default: return <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10 capitalize">{status}</span>;
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
              PLACEKARO <span className="text-slate-400 font-normal ml-2">| My Applications</span>
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
          <p className="mt-1 text-sm text-slate-500">Track your job applications and upcoming interviews.</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-r-transparent"></div>
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm ring-1 ring-slate-200">
            <p className="text-slate-500">You haven't applied to any jobs yet.</p>
            <Link href="/student/jobs" className="mt-4 inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-500">Browse Jobs &rarr;</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {apps.map(({ application, job, interviews }) => (
              <div key={application.id} className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{job?.title || "Unknown Job"}</h2>
                    <p className="text-sm text-slate-500 mt-1">Applied on {new Date(application.appliedAt || Date.now()).toLocaleDateString()}</p>
                  </div>
                  <div>
                    {getStatusBadge(application.status)}
                  </div>
                </div>
                
                {interviews.length > 0 && (
                  <div className="bg-slate-50 p-6">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Scheduled Interviews</h3>
                    <div className="space-y-3">
                      {interviews.map(interview => (
                        <div key={interview.id} className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
                          <div>
                            <p className="font-semibold text-slate-900">{interview.roundName}</p>
                            <p className="text-sm text-slate-500">{new Date(interview.scheduledAt).toLocaleString()}</p>
                          </div>
                          <div className="flex flex-col items-start sm:items-end gap-1">
                            {interview.meetingLink && (
                              <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                Join Meeting &rarr;
                              </a>
                            )}
                            {interview.location && (
                              <p className="text-sm text-slate-500">📍 {interview.location}</p>
                            )}
                            <span className="text-xs font-medium text-slate-400 capitalize">{interview.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {interviews.length === 0 && application.status === "shortlisted" && (
                  <div className="bg-emerald-50 p-6">
                    <p className="text-sm text-emerald-800">Congratulations on being shortlisted! The recruiter will schedule an interview soon.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function StudentApplicationsPage() {
  return (
    <RoleGuard allowedRoles={["student"]}>
      <StudentApplicationsContent />
    </RoleGuard>
  );
}
