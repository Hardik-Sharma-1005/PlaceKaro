"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { get, ref, update, query, orderByChild, equalTo } from "firebase/database";
import { database } from "../../../../lib/firebase/database";
import { useAuth } from "../../../../lib/context/AuthContext";
import type { 
  Job, 
  Application, 
  StudentProfile, 
  PISScore,
  AssessmentResult 
} from "../../../../types/database";
import Link from "next/link";

interface CandidatePipelineItem {
  applicationId: string;
  studentId: string;
  status: string;
  appliedAt?: number;
  assessmentUnlocked: boolean;
  studentProfile?: StudentProfile;
  pisScore?: PISScore;
  assessmentResult?: AssessmentResult;
}

export default function RecruiterJobDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<CandidatePipelineItem[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Shortlisting / Cutoff Filters
  const [filterMode, setFilterMode] = useState<"all" | "qualified" | "top_n">("all");
  const [topNCount, setTopNCount] = useState<number>(5);

  useEffect(() => {
    async function loadJobData() {
      if (!jobId || !user?.uid) return;

      try {
        setLoading(true);

        // 1. Fetch Job
        const jobRef = ref(database, `jobs/${jobId}`);
        const jobSnap = await get(jobRef);

        if (!jobSnap.exists()) {
          setJob(null);
          setLoading(false);
          return;
        }

        const jobData = jobSnap.val() as Job;
        setJob(jobData);

        // 2. Fetch Applications for this job
        const appsQuery = query(
          ref(database, "applications"),
          orderByChild("jobId"),
          equalTo(jobId)
        );
        const appsSnap = await get(appsQuery);

        if (!appsSnap.exists()) {
          setApplicants([]);
          setLoading(false);
          return;
        }

        const rawApps = appsSnap.val() as Record<string, Application>;
        const appsList = Object.entries(rawApps).map(([id, app]) => ({
          ...app,
          id,
        }));

        // 3. Fetch Student Profiles
        const profilesSnap = await get(ref(database, "studentProfiles"));
        const profilesData = profilesSnap.exists()
          ? (profilesSnap.val() as Record<string, StudentProfile>)
          : {};

        // 4. Fetch PIS Scores
        const pisQuery = query(
          ref(database, "pisScores"),
          orderByChild("jobId"),
          equalTo(jobId)
        );
        const pisSnap = await get(pisQuery);
        const pisList = pisSnap.exists()
          ? Object.values(pisSnap.val() as Record<string, PISScore>)
          : [];

        // 5. Fetch Assessment Results
        const resQuery = query(
          ref(database, "assessmentResults"),
          orderByChild("jobId"),
          equalTo(jobId)
        );
        const resSnap = await get(resQuery);
        const resList = resSnap.exists()
          ? Object.values(resSnap.val() as Record<string, AssessmentResult>)
          : [];

        // 6. Combine data
        const pipeline: CandidatePipelineItem[] = appsList.map((app) => {
          const profile = profilesData[app.studentId];
          const pis = pisList.find((p) => p.studentId === app.studentId);
          const assessmentResult = resList.find((r) => r.studentId === app.studentId);

          return {
            applicationId: app.id,
            studentId: app.studentId,
            status: app.status,
            appliedAt: app.appliedAt,
            assessmentUnlocked: Boolean(app.assessmentUnlocked),
            studentProfile: profile,
            pisScore: pis,
            assessmentResult,
          };
        });

        // Default Sort by PIS descending
        pipeline.sort((a, b) => (b.pisScore?.score || 0) - (a.pisScore?.score || 0));

        setApplicants(pipeline);
      } catch (err) {
        console.error("Failed to load ATS data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadJobData();
  }, [user?.uid, jobId]);

  const updateApplicationStatus = async (appId: string, newStatus: string) => {
    try {
      setActionLoading(appId);
      await update(ref(database, `applications/${appId}`), {
        status: newStatus,
      });

      setApplicants((prev) =>
        prev.map((app) =>
          app.applicationId === appId ? { ...app, status: newStatus } : app
        )
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleUnlockAssessment = async (appId: string, currentUnlocked: boolean) => {
    try {
      setActionLoading(appId);
      await update(ref(database, `applications/${appId}`), {
        assessmentUnlocked: !currentUnlocked,
      });

      setApplicants((prev) =>
        prev.map((app) =>
          app.applicationId === appId
            ? { ...app, assessmentUnlocked: !currentUnlocked }
            : app
        )
      );
    } catch (err) {
      console.error("Failed to toggle assessment unlock:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Bulk Shortlist Qualified
  const handleBulkShortlist = async () => {
    const qualifiedApps = applicants.filter(
      (app) => app.assessmentResult?.status === "qualified" && app.status !== "invited"
    );

    if (qualifiedApps.length === 0) return;

    try {
      setActionLoading("bulk");
      const updates: Record<string, any> = {};
      qualifiedApps.forEach((app) => {
        updates[`applications/${app.applicationId}/status`] = "invited";
      });

      await update(ref(database), updates);

      setApplicants((prev) =>
        prev.map((app) =>
          app.assessmentResult?.status === "qualified"
            ? { ...app, status: "invited" }
            : app
        )
      );
    } catch (err) {
      console.error("Failed to bulk shortlist:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered applicants based on cutoff controls
  const displayedApplicants = useMemo(() => {
    let list = [...applicants];

    if (filterMode === "qualified") {
      return list.filter((app) => app.assessmentResult?.status === "qualified");
    }

    if (filterMode === "top_n") {
      // Sort primarily by assessment percentage desc, then PIS
      list.sort((a, b) => {
        const scoreA = a.assessmentResult?.percentage ?? -1;
        const scoreB = b.assessmentResult?.percentage ?? -1;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return (b.pisScore?.score || 0) - (a.pisScore?.score || 0);
      });
      return list.slice(0, topNCount);
    }

    return list;
  }, [applicants, filterMode, topNCount]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Job not found</h2>
        <button
          onClick={() => router.push("/recruiter/jobs")}
          className="mt-4 text-sm font-semibold text-blue-600 hover:underline"
        >
          &larr; Back to jobs
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ATS Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
          <Link
            href="/recruiter/jobs"
            className="mb-4 inline-flex items-center text-xs font-semibold text-slate-500 transition hover:text-slate-900"
          >
            &larr; Back to all jobs
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-950">{job.title}</h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                    job.status === "published"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {job.status}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 max-w-3xl text-sm text-slate-500">
                {job.description}
              </p>
            </div>

            <div className="flex shrink-0 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button className="rounded-md bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow-sm">
                Applicants
              </button>
              <Link
                href={`/recruiter/jobs/${jobId}/assessment`}
                className="rounded-md px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:text-slate-900"
              >
                Assessments
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Applicant Tracking System View */}
      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        {/* Shortlisting / Cutoff Bar */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-2">
              Filter by Assessment:
            </span>
            <button
              onClick={() => setFilterMode("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filterMode === "all"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              All Applicants ({applicants.length})
            </button>
            <button
              onClick={() => setFilterMode("qualified")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filterMode === "qualified"
                  ? "bg-emerald-700 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Qualified Only (≥ 60%)
            </button>
            <button
              onClick={() => setFilterMode("top_n")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filterMode === "top_n"
                  ? "bg-indigo-700 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Top-N by Score
            </button>

            {filterMode === "top_n" && (
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-xs text-slate-500">N =</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={topNCount}
                  onChange={(e) => setTopNCount(Number(e.target.value))}
                  className="w-16 rounded-md border border-slate-300 px-2 py-1 text-xs outline-none"
                />
              </div>
            )}
          </div>

          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            <button
              onClick={handleBulkShortlist}
              disabled={actionLoading === "bulk"}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
            >
              {actionLoading === "bulk" ? "Shortlisting..." : "Bulk Shortlist Qualified"}
            </button>
          </div>
        </section>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Candidate Pipeline{" "}
            <span className="font-normal text-slate-500">
              ({displayedApplicants.length})
            </span>
          </h2>
          <div className="text-xs font-medium text-slate-500">
            Evaluations: <span className="font-bold text-slate-900">PIS (Role Fit)</span> &amp;{" "}
            <span className="font-bold text-slate-900">Assessment (Test)</span>
          </div>
        </div>

        {displayedApplicants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-base font-semibold text-slate-900">No applicants found</p>
            <p className="mt-1 text-sm text-slate-500">
              {filterMode !== "all"
                ? "No candidates match the selected assessment cutoff."
                : "No candidates have applied to this role yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedApplicants.map((applicant) => {
              const profile = applicant.studentProfile;
              const pis = applicant.pisScore;
              const result = applicant.assessmentResult;

              return (
                <div
                  key={applicant.applicationId}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 md:flex-row md:items-center"
                >
                  {/* Candidate Info */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-base font-bold text-slate-700">
                      {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : "S"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900">
                          {profile?.fullName || "Candidate"}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            applicant.status === "invited"
                              ? "bg-emerald-50 text-emerald-700"
                              : applicant.status === "withdrawn"
                              ? "bg-red-50 text-red-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {applicant.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {profile?.degree || "Engineering"} &bull; {profile?.branch || "Computer Science"} &bull; Class of {profile?.graduationYear || "2025"}
                      </p>
                      {applicant.appliedAt && (
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          Applied on {new Date(applicant.appliedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dual Intelligence Scores: PIS + Assessment */}
                  <div className="flex flex-wrap items-center gap-6">
                    {/* PIS Score (Hardik's engine) */}
                    <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 px-4 py-2 border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        PIS Score
                      </span>
                      <span className="text-lg font-black text-slate-900">
                        {pis?.score !== undefined ? pis.score : "—"}
                      </span>
                    </div>

                    {/* Assessment Result (Harshita's system) */}
                    <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 px-4 py-2 border border-slate-100 min-w-[110px]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Assessment
                      </span>
                      {result ? (
                        <div className="text-center">
                          <span className="text-base font-black text-slate-900">
                            {result.percentage}%
                          </span>
                          <p
                            className={`text-[9px] font-bold uppercase tracking-wider ${
                              result.status === "qualified"
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {result.status.replace("_", " ")}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 mt-1">
                          Not Taken
                        </span>
                      )}
                    </div>

                    {/* Actions: Unlock Assessment & Pipeline Decision */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() =>
                          toggleUnlockAssessment(
                            applicant.applicationId,
                            applicant.assessmentUnlocked
                          )
                        }
                        disabled={actionLoading === applicant.applicationId}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition border ${
                          applicant.assessmentUnlocked
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {applicant.assessmentUnlocked ? "✓ Assessment Unlocked" : "Unlock Assessment"}
                      </button>

                      <button
                        onClick={() =>
                          updateApplicationStatus(applicant.applicationId, "invited")
                        }
                        disabled={
                          actionLoading === applicant.applicationId ||
                          applicant.status === "invited"
                        }
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                      >
                        Shortlist
                      </button>
                      <button
                        onClick={() =>
                          updateApplicationStatus(applicant.applicationId, "withdrawn")
                        }
                        disabled={
                          actionLoading === applicant.applicationId ||
                          applicant.status === "withdrawn"
                        }
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
