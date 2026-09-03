"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/context/AuthContext";
import { RoleGuard } from "../../lib/components/RoleGuard";
import { StudentSidebar, StudentMobileNav } from "../../lib/components/StudentNavigation";
import { get, ref, query, orderByChild, equalTo } from "firebase/database";
import { database } from "../../lib/firebase/database";
import type { Application, Assessment, Job, AssessmentResult } from "../../types/database";
import Link from "next/link";

interface EnrichedAssessment {
  applicationId: string;
  jobTitle: string;
  companyName: string;
  assessment: Assessment;
  result?: AssessmentResult;
}

function AssessmentHubContent() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [pendingAssessments, setPendingAssessments] = useState<EnrichedAssessment[]>([]);
  const [completedAssessments, setCompletedAssessments] = useState<EnrichedAssessment[]>([]);

  useEffect(() => {
    async function loadAssessments() {
      if (!user?.uid) return;
      try {
        setLoading(true);

        // 1. Fetch user's applications
        const appsQuery = query(ref(database, "applications"), orderByChild("studentId"), equalTo(user.uid));
        const appsSnap = await get(appsQuery);
        const apps = appsSnap.exists() ? Object.values(appsSnap.val() as Record<string, Application>) : [];
        const unlockedApps = apps.filter(app => app.assessmentUnlocked);

        // 2. Fetch Jobs
        const jobsSnap = await get(ref(database, "jobs"));
        const allJobs = jobsSnap.exists() ? (jobsSnap.val() as Record<string, Job>) : {};

        // 3. Fetch Assessments
        const assmSnap = await get(ref(database, "assessments"));
        const allAssessments = assmSnap.exists() ? (assmSnap.val() as Record<string, Assessment>) : {};

        // 4. Fetch Results
        const resQuery = query(ref(database, "assessmentResults"), orderByChild("studentId"), equalTo(user.uid));
        const resSnap = await get(resQuery);
        const userResults = resSnap.exists() ? Object.values(resSnap.val() as Record<string, AssessmentResult>) : [];

        const pending: EnrichedAssessment[] = [];
        const completed: EnrichedAssessment[] = [];

        unlockedApps.forEach(app => {
          const job = allJobs[app.jobId];
          if (!job || !job.assessmentId) return;
          
          const assessment = allAssessments[job.assessmentId];
          if (!assessment || !assessment.published) return;

          const result = userResults.find(r => r.assessmentId === assessment.id);

          const enriched: EnrichedAssessment = {
            applicationId: app.id,
            jobTitle: job.title,
            companyName: "TechCorp Solutions",
            assessment,
            result
          };

          if (result) {
            completed.push(enriched);
          } else {
            pending.push(enriched);
          }
        });

        if (pending.length === 0 && completed.length === 0) {
          // Provide accessible mock assessment for testing
          setPendingAssessments([{
            applicationId: "app-default-1",
            jobTitle: "Software Engineer (Full Stack)",
            companyName: "TechCorp Solutions",
            assessment: {
              id: "mock-assessment-123",
              jobId: "mock-job",
              title: "Core Technical & Problem Solving Assessment",
              durationMinutes: 30,
              totalMarks: 10,
              published: true,
              createdAt: Date.now()
            }
          }]);
        } else {
          setPendingAssessments(pending);
          setCompletedAssessments(completed);
        }

      } catch (err) {
        console.warn("Could not load assessments due to permissions:", err);
        // MOCK DATA FOR DEMO
        setPendingAssessments([{
          applicationId: "mock-app",
          jobTitle: "Software Engineer",
          companyName: "TechCorp Solutions",
          assessment: {
            id: "mock-assessment-123",
            jobId: "mock-job",
            title: "Mock Technical Assessment",
            durationMinutes: 30,
            totalMarks: 10,
            published: true,
            createdAt: Date.now()
          }
        }]);
      } finally {
        setLoading(false);
      }
    }

    loadAssessments();
  }, [user?.uid]);

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">My Assessments</h1>
        <p className="mt-1 text-sm text-slate-500">
          Complete mandatory assessments for your job applications to get shortlisted.
        </p>
      </header>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* Pending Assessments */}
          <section>
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              Pending Actions <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{pendingAssessments.length}</span>
            </h2>

            {pendingAssessments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm font-semibold text-slate-700">No pending assessments.</p>
                <p className="mt-1 text-xs text-slate-500">You will be notified when a recruiter unlocks a test for you.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {pendingAssessments.map(item => (
                  <div key={item.assessment.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-900">{item.assessment.title}</h3>
                        <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 border border-amber-100">
                          Requires Action
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700">{item.jobTitle}</p>
                      <p className="text-xs text-slate-500">{item.companyName}</p>
                      
                      <div className="mt-4 flex items-center gap-4 text-xs font-medium text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {item.assessment.durationMinutes} mins
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {item.assessment.totalMarks} Marks
                        </div>
                      </div>
                    </div>

                    <Link 
                      href={`/assessments/${item.assessment.id}`}
                      className="mt-6 w-full inline-flex justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
                    >
                      Start Assessment
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Completed Assessments */}
          <section>
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              Completed <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">{completedAssessments.length}</span>
            </h2>

            {completedAssessments.length === 0 ? (
              <p className="text-sm text-slate-500">You haven't completed any assessments yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {completedAssessments.map(item => (
                  <div key={item.assessment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 opacity-80">
                    <h3 className="font-bold text-slate-900">{item.assessment.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{item.jobTitle}</p>
                    
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Your Result</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-slate-900">
                          {item.result?.percentage}%
                        </span>
                        <span className={`rounded-lg px-2.5 py-1 text-xs font-bold capitalize ${
                          item.result?.status === "qualified" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                        }`}>
                          {item.result?.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      )}
    </div>
  );
}

export default function StudentAssessmentsPage() {
  return (
    <RoleGuard allowedRoles={["student"]}>
      <div className="flex min-h-screen bg-slate-50 lg:flex-row flex-col">
        <StudentSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex flex-col border-b border-slate-200 bg-white px-5 pt-4 lg:hidden">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-950">PlaceKaro</h1>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Student Portal</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                Me
              </div>
            </div>
            <StudentMobileNav />
          </header>
          <main className="flex-1 overflow-y-auto">
            <AssessmentHubContent />
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
