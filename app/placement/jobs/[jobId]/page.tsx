"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { assessmentStore } from "../../../../lib/store/assessmentStore";
import type {
  Job,
  JobRequirements,
  Assessment,
  Application,
  AssessmentResult,
} from "../../../../types/database";

/* ─────────────────────────── MOCK DATA ─────────────────────────── */

const MOCK_JOB: Job = {
  id: "job-001",
  companyId: "comp-001",
  recruiterId: "rec-001",
  title: "Associate Software Engineer – Infosys",
  description:
    "We are looking for enthusiastic graduates to join our software engineering team. You will work on enterprise-scale applications using Java, Spring Boot, and React.\n\nKey Responsibilities:\n• Design and develop scalable server-side applications\n• Collaborate with cross-functional teams to define and implement features\n• Participate in code reviews and maintain code quality\n• Debug and resolve application issues\n\nTraining and mentorship provided for all selected candidates.",
  status: "published",
  assessmentAccessModel: "all_eligible",
  createdAt: Date.now() - 86400000 * 10,
  updatedAt: Date.now(),
};

const MOCK_REQUIREMENTS: JobRequirements = {
  jobId: "job-001",
  hardEligibility: {
    minimumCGPA: 7.0,
    maximumBacklogs: 0,
    branches: ["Computer Science", "Information Technology", "Electronics & Communication"],
    graduationYears: [2024, 2025, 2026],
  },
  competencies: {
    technicalSkills: ["Java", "SQL", "Data Structures", "OOP Concepts"],
    domainSkills: ["Problem Solving", "Analytical Thinking"],
    preferredQualifications: ["Spring Boot", "React", "AWS Basics"],
  },
  confirmedByCompany: true,
};

// Basic student name/branch info for display (not academic scoring)
const STUDENT_INFO: Record<string, { fullName: string; branch: string; rollNo: string }> = {
  "stu-001": { fullName: "Aarav Sharma",  branch: "Computer Science",          rollNo: "CS2025001" },
  "stu-002": { fullName: "Priya Patel",   branch: "Information Technology",    rollNo: "IT2025002" },
  "stu-003": { fullName: "Rohan Verma",   branch: "Electronics & Communication", rollNo: "EC2024003" },
  "stu-004": { fullName: "Ananya Iyer",   branch: "Computer Science",          rollNo: "CS2026004" },
};

type ApplicantRow = {
  appId: string;
  studentId: string;
  status: Application["status"];
  info: { fullName: string; branch: string; rollNo: string };
  result: AssessmentResult | null;
};

/* ────────────────────────────────────────────────────────────────── */

export default function DriveDetailsPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [requirements, setRequirements] = useState<JobRequirements | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "applicants" | "assessment">("applicants");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const buildApplicants = useCallback((): ApplicantRow[] => {
    const apps = assessmentStore.getApplicationsForJob(jobId);
    const results = assessmentStore.getResultsByJob(jobId);

    return apps
      .map((app) => {
        const info = STUDENT_INFO[app.studentId];
        if (!info) return null;
        const result = results.find((r) => r.studentId === app.studentId) ?? null;
        return {
          appId: app.id,
          studentId: app.studentId,
          status: app.status,
          info,
          result,
        } as ApplicantRow;
      })
      .filter(Boolean as unknown as <T>(v: T | null) => v is T)
      // Rank by assessment percentage descending; pending students go to bottom
      .sort((a, b) => (b.result?.percentage ?? -1) - (a.result?.percentage ?? -1));
  }, [jobId]);

  useEffect(() => {
    assessmentStore.init();
    setJob(MOCK_JOB);
    setRequirements(MOCK_REQUIREMENTS);
    setAssessment(assessmentStore.getAssessmentByJobId(jobId));
    setApplicants(buildApplicants());
    setLoading(false);
  }, [jobId, buildApplicants]);

  const handleUpdateStatus = (appId: string, status: Application["status"]) => {
    assessmentStore.updateApplicationStatus(appId, status);
    setApplicants((prev) =>
      prev.map((a) => (a.appId === appId ? { ...a, status } : a))
    );
    showToast(status === "shortlisted" ? "✓ Student shortlisted!" : "Student rejected.");
  };

  /* ── Refresh applicants to pick up new results ── */
  const handleRefresh = () => {
    setAssessment(assessmentStore.getAssessmentByJobId(jobId));
    setApplicants(buildApplicants());
    showToast("Refreshed!");
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-semibold text-indigo-900">Loading drive details…</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-5">
        <p className="text-5xl">🏢</p>
        <h2 className="text-lg font-bold text-slate-900">Drive Not Found</h2>
        <Link href="/placement/jobs" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition">
          ← Back to Campus Drives
        </Link>
      </div>
    );
  }

  const qualifiedCount = applicants.filter((a) => a.result?.status === "qualified").length;
  const shortlistedCount = applicants.filter((a) => a.status === "shortlisted").length;
  const pendingCount = applicants.filter((a) => !a.result).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 space-y-6">
        {/* Back */}
        <Link href="/placement/jobs" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition">
          ← Campus Drives Monitor
        </Link>

        {/* Drive Header */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-950">{job.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold border ${
                  job.status === "published" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : job.status === "draft" ? "bg-slate-100 text-slate-600 border-slate-200"
                  : "bg-red-50 text-red-700 border-red-200"
                }`}>
                  {job.status.toUpperCase()}
                </span>
                <span className="text-xs text-slate-400">
                  Posted {new Date(job.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleRefresh}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                ↻ Refresh Scores
              </button>
              <Link
                href={`/placement/jobs/${jobId}/assessment`}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
              >
                📝 {assessment ? "Manage Assessment" : "Create Assessment"}
              </Link>
            </div>
          </div>

          {/* KPI strip */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Applicants", value: applicants.length, color: "text-slate-900" },
              { label: "Assessment Qualified", value: qualifiedCount, color: "text-emerald-600" },
              { label: "Shortlisted", value: shortlistedCount, color: "text-indigo-600" },
              { label: "Pending Assessment", value: pendingCount, color: "text-amber-600" },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{kpi.label}</p>
                <p className={`mt-1 text-2xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-6">
            {(["applicants", "overview", "assessment"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-semibold capitalize transition ${
                  activeTab === tab
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                {tab}
                {tab === "applicants" && (
                  <span className={`ml-2 rounded-full py-0.5 px-2 text-[10px] font-bold ${
                    activeTab === tab ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {applicants.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">

          {/* ── APPLICANTS TAB ── */}
          {activeTab === "applicants" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Applicant Leaderboard</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ranked by Assessment Score (highest score = Rank #1). Shortlist or reject applicants.
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-[11px] rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 font-semibold text-emerald-700">
                    {qualifiedCount} Qualified
                  </span>
                  <span className="text-[11px] rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 font-semibold text-amber-700">
                    {pendingCount} Pending
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 w-12">Rank</th>
                      <th className="px-4 py-3">Applicant</th>
                      <th className="px-4 py-3">Assessment Score</th>
                      <th className="px-4 py-3">Result</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {applicants.map((row, i) => (
                      <tr key={row.appId} className="hover:bg-slate-50/50 transition">
                        {/* Rank */}
                        <td className="px-4 py-4">
                          <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${
                            i === 0 ? "bg-amber-100 text-amber-800"
                            : i === 1 ? "bg-slate-200 text-slate-700"
                            : i === 2 ? "bg-orange-100 text-orange-700"
                            : "bg-slate-100 text-slate-500"
                          }`}>
                            {i + 1}
                          </span>
                        </td>

                        {/* Applicant info */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700">
                              {row.info.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{row.info.fullName}</p>
                              <p className="text-[10px] text-slate-400">
                                {row.info.branch} · {row.info.rollNo}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Assessment Score */}
                        <td className="px-4 py-4">
                          {row.result ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${row.result.percentage}%` }} />
                              </div>
                              <span className="text-sm font-extrabold text-slate-900">{row.result.percentage}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Assessment result */}
                        <td className="px-4 py-4">
                          {row.result ? (
                            <div>
                              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                row.result.status === "qualified"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}>
                                {row.result.status === "qualified" ? "✓ Qualified" : "✗ Failed"}
                              </span>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {row.result.score}/{row.result.totalMarks} · {row.result.percentage}%
                              </p>
                            </div>
                          ) : (
                            <span className="rounded-full bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold">
                              ⏳ Pending
                            </span>
                          )}
                        </td>

                        {/* Application status */}
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                            row.status === "shortlisted" ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : row.status === "rejected" ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}>
                            {row.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-right">
                          {row.status === "applied" && (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleUpdateStatus(row.appId, "shortlisted")}
                                className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition"
                              >
                                ✓ Shortlist
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(row.appId, "rejected")}
                                className="rounded-lg bg-red-50 border border-red-200 px-2.5 py-1 text-[11px] font-bold text-red-700 hover:bg-red-100 transition"
                              >
                                ✗ Reject
                              </button>
                            </div>
                          )}
                          {row.status === "shortlisted" && (
                            <div className="flex gap-2 justify-end">
                              <span className="text-[11px] font-bold text-emerald-600">✓ Shortlisted</span>
                              <button
                                onClick={() => handleUpdateStatus(row.appId, "applied")}
                                className="text-[10px] text-slate-400 hover:text-slate-600"
                              >
                                Undo
                              </button>
                            </div>
                          )}
                          {row.status === "rejected" && (
                            <div className="flex gap-2 justify-end items-center">
                              <span className="text-[11px] font-bold text-red-500">Rejected</span>
                              <button
                                onClick={() => handleUpdateStatus(row.appId, "applied")}
                                className="text-[10px] text-slate-400 hover:text-slate-600"
                              >
                                Undo
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {applicants.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-sm text-slate-500">No applicants yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-3">Job Description</h3>
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{job.description}</p>
              </div>
              {requirements && (
                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 mb-4">Eligibility Criteria</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Min CGPA</p>
                      <p className="mt-1 text-xl font-bold text-slate-900">{requirements.hardEligibility.minimumCGPA ?? "—"}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Max Backlogs</p>
                      <p className="mt-1 text-xl font-bold text-slate-900">{requirements.hardEligibility.maximumBacklogs ?? "—"}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 col-span-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Branches</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {requirements.hardEligibility.branches?.map((b) => (
                          <span key={b} className="rounded-lg bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">{b}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {requirements.competencies?.technicalSkills?.length && (
                    <div className="mt-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Required Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {requirements.competencies.technicalSkills.map((sk) => (
                          <span key={sk} className="rounded-lg bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">{sk}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── ASSESSMENT TAB ── */}
          {activeTab === "assessment" && (
            <div className="text-center py-10">
              <div className="mx-auto h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 text-3xl">
                📝
              </div>
              {assessment ? (
                <>
                  <h3 className="text-base font-bold text-slate-900">{assessment.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {assessment.durationMinutes} mins · {assessment.totalMarks} marks ·{" "}
                    <span className={assessment.published ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                      {assessment.published ? "● Live" : "● Draft"}
                    </span>
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-4 max-w-sm mx-auto">
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Taken</p>
                      <p className="text-xl font-extrabold text-slate-900">{applicants.filter((a) => a.result).length}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Qualified</p>
                      <p className="text-xl font-extrabold text-emerald-700">{qualifiedCount}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending</p>
                      <p className="text-xl font-extrabold text-amber-700">{pendingCount}</p>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3 justify-center">
                    <Link
                      href={`/placement/jobs/${jobId}/assessment`}
                      className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition"
                    >
                      Manage Assessment
                    </Link>
                    <Link
                      href={`/student/jobs/${jobId}/assessment`}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Preview as Student
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-base font-bold text-slate-900">No Assessment Yet</h3>
                  <p className="mt-2 text-sm text-slate-500 mb-6">
                    Create an MCQ assessment to test applicants and auto-rank them by score.
                  </p>
                  <Link
                    href={`/placement/jobs/${jobId}/assessment`}
                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition"
                  >
                    Create Assessment →
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
