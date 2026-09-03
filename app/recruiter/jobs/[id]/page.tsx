"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { RoleGuard } from "../../../../lib/components/RoleGuard";
import { jobService } from "../../../../lib/services/jobService";
import { candidateService } from "../../../../lib/services/candidateService";
import { assessmentService } from "../../../../lib/services/assessmentService";
import { applicationService } from "../../../../lib/services/applicationService";
import { Job, JobRequirements, StudentProfile, Assessment, Application, AssessmentResult } from "../../../../types/database";

type ApplicantData = {
  application: Application;
  profile: StudentProfile;
  assessmentResult: AssessmentResult | null;
  pisScore: number;
};

function JobDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [requirements, setRequirements] = useState<JobRequirements | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [applicants, setApplicants] = useState<ApplicantData[]>([]);
  
  const [activeTab, setActiveTab] = useState<"overview" | "applicants" | "assessment">("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobData() {
      try {
        const [fetchedJob, fetchedReqs, fetchedAssessment, apps] = await Promise.all([
          jobService.getJobById(jobId),
          jobService.getJobRequirements(jobId),
          assessmentService.getAssessmentByJobId(jobId),
          applicationService.getApplicationsForJob(jobId)
        ]);

        if (fetchedJob) {
          setJob(fetchedJob);
          setRequirements(fetchedReqs);
          setAssessment(fetchedAssessment);
          
          const applicantsData: ApplicantData[] = await Promise.all(
            apps.map(async (app) => {
              const profile = await candidateService.getCandidateById(app.studentId);
              const result = fetchedAssessment 
                ? await applicationService.getAssessmentResult(app.studentId, fetchedAssessment.id)
                : null;
              
              // Mock PIS Calculation (0-100) based on CGPA and Backlogs
              let pis = 50;
              if (profile) {
                pis += (profile.cgpa - 6) * 10;
                pis -= profile.backlogCount * 5;
                if (result) pis += (result.percentage / 2);
              }
              pis = Math.max(0, Math.min(100, Math.round(pis)));

              return {
                application: app,
                profile: profile!,
                assessmentResult: result,
                pisScore: pis
              };
            })
          );
          
          // Sort by PIS descending
          applicantsData.sort((a, b) => b.pisScore - a.pisScore);
          setApplicants(applicantsData);
        } else {
          router.push("/recruiter/jobs");
        }
      } catch (error) {
        console.error("Failed to load job details:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadJobData();
  }, [jobId, router]);

  const handleUpdateStatus = async (appId: string, status: Application["status"]) => {
    try {
      await applicationService.updateApplicationStatus(appId, status);
      setApplicants(prev => prev.map(a => 
        a.application.id === appId ? { ...a, application: { ...a.application, status } } : a
      ));
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-r-transparent"></div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-4">
            <Link href="/recruiter/jobs" className="text-sm font-medium text-slate-500 hover:text-slate-900">
              &larr; Back to Jobs
            </Link>
            <div className="h-4 w-px bg-slate-300"></div>
            <p className="text-sm font-bold tracking-widest text-slate-900 truncate">
              {job.title.toUpperCase()}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Job Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
            <div className="mt-2 flex items-center gap-3">
              <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                job.status === 'published' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 
                job.status === 'draft' ? 'bg-slate-50 text-slate-600 ring-slate-500/10' : 
                'bg-red-50 text-red-700 ring-red-600/10'
              }`}>
                {job.status.toUpperCase()}
              </span>
              <span className="text-sm text-slate-500">
                Created on {new Date(job.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div>
            {job.status === "draft" && (
              <button 
                onClick={async () => {
                  await jobService.requestJobApproval(job.id);
                  setJob({ ...job, status: "pending_approval" });
                }}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
              >
                Request Approval
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {["overview", "applicants", "assessment"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`
                  whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium capitalize
                  ${activeTab === tab 
                    ? "border-slate-900 text-slate-900" 
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"}
                `}
              >
                {tab}
                {tab === "applicants" && (
                  <span className={`ml-2 rounded-full py-0.5 px-2.5 text-xs font-medium ${
                    activeTab === tab ? "bg-slate-100 text-slate-900" : "bg-slate-100 text-slate-600"
                  }`}>
                    {applicants.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6 sm:p-8">
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Job Description</h3>
                <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{job.description}</p>
              </div>

              {requirements && (
                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Hard Eligibility</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <p className="text-xs font-medium text-slate-500">Minimum CGPA</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{requirements.hardEligibility.minimumCGPA || "N/A"}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <p className="text-xs font-medium text-slate-500">Max Backlogs</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{requirements.hardEligibility.maximumBacklogs ?? "N/A"}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 col-span-2 md:col-span-2">
                      <p className="text-xs font-medium text-slate-500">Allowed Branches</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {requirements.hardEligibility.branches?.map(b => (
                          <span key={b} className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600 border border-slate-200">
                            {b}
                          </span>
                        )) || "All"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "applicants" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Applicant Leaderboard</h3>
                  <p className="text-sm text-slate-500">Candidates sorted by their Placement Intelligence Score (PIS).</p>
                </div>
              </div>
              
              <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-slate-300">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Applicant</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">PIS Score</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Assessment</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {applicants.map(app => (
                      <tr key={app.application.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="font-medium text-slate-900">{app.profile.fullName}</div>
                          <div className="text-slate-500">{app.profile.branch} • CGPA: {app.profile.cgpa}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                          <div className="flex items-center">
                            <div className="w-16 bg-slate-200 rounded-full h-2.5 mr-2">
                              <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${app.pisScore}%` }}></div>
                            </div>
                            <span className="font-medium text-slate-900">{app.pisScore}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {app.assessmentResult ? (
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                              app.assessmentResult.status === 'qualified' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-red-50 text-red-700 ring-red-600/10'
                            }`}>
                              {app.assessmentResult.percentage}% - {app.assessmentResult.status}
                            </span>
                          ) : (
                            <span className="text-slate-400">Pending</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 capitalize">
                          {app.application.status.replace("_", " ")}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                          {app.application.status === "applied" && (
                            <>
                              <button onClick={() => handleUpdateStatus(app.application.id, "shortlisted")} className="text-emerald-600 hover:text-emerald-900">Shortlist</button>
                              <button onClick={() => handleUpdateStatus(app.application.id, "rejected")} className="text-red-600 hover:text-red-900">Reject</button>
                            </>
                          )}
                          {app.application.status === "shortlisted" && (
                            <Link href={`/recruiter/jobs/${job.id}/applications/${app.application.id}/schedule`} className="text-indigo-600 hover:text-indigo-900">
                              Schedule Interview
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                    {applicants.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                          No applicants yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "assessment" && (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {assessment ? assessment.title : "No Assessment Configured"}
              </h3>
              <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto mb-6">
                {assessment 
                  ? `This job has an assessment configured (${assessment.totalMarks} marks, ${assessment.durationMinutes} mins).`
                  : "Create a custom multiple-choice assessment to test candidates' technical and domain skills."}
              </p>
              <Link
                href={`/recruiter/jobs/${job.id}/assessment`}
                className="inline-flex justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                {assessment ? "Manage Assessment" : "Create Assessment"}
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function JobDetailsPage() {
  return (
    <RoleGuard allowedRoles={["company"]}>
      <JobDetailsContent />
    </RoleGuard>
  );
}
