"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { RoleGuard } from "../../../../lib/components/RoleGuard";
import { jobService } from "../../../../lib/services/jobService";
import { calculatePIS } from "../../../../lib/pis/engine";

import type {
  Job,
  JobRequirements,
} from "../../../../types/database";

import type {
  PISInput,
  PISResult,
} from "../../../../lib/pis/types";

type RecruiterPISResponse = {
  inputs?: PISInput[];
  error?: string;
};

type PISState = {
  results: PISResult[];
  error: string | null;
  loading: boolean;
};

function JobDetailsContent() {
  const params = useParams();
  const router = useRouter();

  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [requirements, setRequirements] =
    useState<JobRequirements | null>(null);

  const [activeTab, setActiveTab] = useState<
    "overview" | "pis" | "applicants"
  >("overview");

  const [loading, setLoading] = useState(true);
  const [jobError, setJobError] = useState<string | null>(null);

  const [pisState, setPisState] = useState<PISState>({
    results: [],
    error: null,
    loading: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadJobData(): Promise<void> {
      try {
        setLoading(true);
        setJobError(null);

        const [fetchedJob, fetchedRequirements] =
          await Promise.all([
            jobService.getJobById(jobId),
            jobService.getJobRequirements(jobId),
          ]);

        if (cancelled) {
          return;
        }

        if (!fetchedJob) {
          router.push("/recruiter/jobs");
          return;
        }

        setJob(fetchedJob);
        setRequirements(fetchedRequirements);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setJobError(
          error instanceof Error
            ? error.message
            : "Failed to load job details."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadJobData();

    return () => {
      cancelled = true;
    };
  }, [jobId, router]);

  async function loadPIS(): Promise<void> {
    try {
      setPisState({
        results: [],
        error: null,
        loading: true,
      });

      const response = await fetch(
        `/api/recruiter/pis?jobId=${encodeURIComponent(
          jobId
        )}`,
        {
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as RecruiterPISResponse;

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Unable to load PIS candidate data."
        );
      }

      if (!data.inputs || data.inputs.length === 0) {
        throw new Error(
          "No PIS candidate data is available for this job."
        );
      }

      const results = data.inputs.map((input) =>
        calculatePIS(input)
      );

      results.sort((a, b) => b.score - a.score);

      setPisState({
        results,
        error: null,
        loading: false,
      });
    } catch (error) {
      setPisState({
        results: [],
        error:
          error instanceof Error
            ? error.message
            : "Unable to calculate PIS.",
        loading: false,
      });
    }
  }

  useEffect(() => {
    if (activeTab !== "pis") {
      return;
    }

    if (
      pisState.results.length > 0 ||
      pisState.loading ||
      pisState.error
    ) {
      return;
    }

    void loadPIS();
  }, [
    activeTab,
    jobId,
    pisState.results.length,
    pisState.loading,
    pisState.error,
  ]);

  async function handleRequestApproval(): Promise<void> {
    if (!job) {
      return;
    }

    try {
      await jobService.requestJobApproval(job.id);

      setJob({
        ...job,
        status: "pending_approval",
      });
    } catch (error) {
      setJobError(
        error instanceof Error
          ? error.message
          : "Unable to request approval."
      );
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-r-transparent" />
      </div>
    );
  }

  if (jobError && !job) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Unable to load job
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            {jobError}
          </p>

          <Link
            href="/recruiter/jobs"
            className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const averagePIS =
    pisState.results.length > 0
      ? pisState.results.reduce(
          (total, result) => total + result.score,
          0
        ) / pisState.results.length
      : 0;

  const topScore =
    pisState.results.length > 0
      ? pisState.results[0].score
      : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 items-center gap-4">
            <Link
              href="/recruiter/jobs"
              className="text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              ← Back to Jobs
            </Link>

            <div className="h-4 w-px bg-slate-300" />

            <p className="truncate text-sm font-bold tracking-widest text-slate-900">
              {job.title.toUpperCase()}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {jobError && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {jobError}
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {job.title}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                  job.status === "published"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                    : job.status === "pending_approval"
                    ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                    : job.status === "draft"
                    ? "bg-slate-50 text-slate-600 ring-slate-500/10"
                    : "bg-red-50 text-red-700 ring-red-600/10"
                }`}
              >
                {job.status.replace("_", " ").toUpperCase()}
              </span>

              <span className="text-sm text-slate-500">
                Created on{" "}
                {new Date(
                  job.createdAt
                ).toLocaleDateString()}
              </span>
            </div>
          </div>

          {job.status === "draft" && (
            <button
              type="button"
              onClick={handleRequestApproval}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
            >
              Request Approval
            </button>
          )}
        </div>

        <div className="mb-8 border-b border-slate-200">
          <nav className="-mb-px flex gap-8 overflow-x-auto">
            <button
              type="button"
              onClick={() =>
                setActiveTab("overview")
              }
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === "overview"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              Overview
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab("pis")
              }
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === "pis"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              PIS Intelligence
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab("applicants")
              }
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === "applicants"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              Applicants
            </button>
          </nav>
        </div>

        {activeTab === "overview" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="space-y-8">
              <section>
                <h2 className="text-lg font-bold text-slate-900">
                  Job Description
                </h2>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {job.description}
                </p>
              </section>

              {requirements && (
                <section className="border-t border-slate-100 pt-6">
                  <h2 className="mb-4 text-lg font-bold text-slate-900">
                    Hard Eligibility
                  </h2>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-500">
                        Minimum CGPA
                      </p>

                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {requirements.hardEligibility
                          .minimumCGPA ?? "N/A"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-500">
                        Maximum Backlogs
                      </p>

                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {requirements.hardEligibility
                          .maximumBacklogs ?? "N/A"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 sm:col-span-2">
                      <p className="text-xs font-medium text-slate-500">
                        Allowed Branches
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {requirements.hardEligibility
                          .branches &&
                        requirements.hardEligibility
                          .branches.length > 0 ? (
                          requirements.hardEligibility.branches.map(
                            (branch) => (
                              <span
                                key={branch}
                                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600"
                              >
                                {branch}
                              </span>
                            )
                          )
                        ) : (
                          <span className="text-sm text-slate-500">
                            All branches
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              <section className="border-t border-slate-100 pt-6">
                <div className="flex flex-col gap-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-indigo-950">
                      Placement Intelligence Score
                    </h3>

                    <p className="mt-1 text-sm text-indigo-700">
                      This job can use the recruiter-configured PIS
                      engine for candidate evaluation.
                    </p>
                  </div>

                  <Link
                    href="/recruiter/pis"
                    className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    Configure PIS
                  </Link>
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === "pis" && (
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Candidates Evaluated
                </p>

                <p className="mt-3 text-3xl font-extrabold text-slate-950">
                  {pisState.results.length}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Average PIS
                </p>

                <p className="mt-3 text-3xl font-extrabold text-indigo-600">
                  {pisState.results.length > 0
                    ? averagePIS.toFixed(2)
                    : "—"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Canonical scale: 0–100
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Highest PIS
                </p>

                <p className="mt-3 text-3xl font-extrabold text-emerald-600">
                  {pisState.results.length > 0
                    ? topScore.toFixed(2)
                    : "—"}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    PIS Candidate Intelligence
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Scores are generated by the canonical Placement
                    Intelligence engine. No client-side mock formula is
                    used here.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void loadPIS()}
                  disabled={pisState.loading}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pisState.loading
                    ? "Calculating..."
                    : "Refresh PIS"}
                </button>
              </div>

              {pisState.error && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">
                    PIS data unavailable
                  </p>

                  <p className="mt-1 text-sm text-amber-800">
                    {pisState.error}
                  </p>
                </div>
              )}

              {pisState.loading && (
                <div className="mt-8 flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent" />
                </div>
              )}

              {!pisState.loading &&
                !pisState.error &&
                pisState.results.length === 0 && (
                  <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      No PIS candidate data is available for this job.
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Configure a confirmed PIS configuration and
                      connect candidate data before using this view.
                    </p>
                  </div>
                )}

              {!pisState.loading &&
                pisState.results.length > 0 && (
                  <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Candidate ID
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            PIS
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Status
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Missing Parameters
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 bg-white">
                        {pisState.results.map(
                          (result) => (
                            <tr key={result.studentId}>
                              <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-900">
                                {result.studentId}
                              </td>

                              <td className="whitespace-nowrap px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                                    <div
                                      className="h-full rounded-full bg-indigo-600"
                                      style={{
                                        width: `${result.score}%`,
                                      }}
                                    />
                                  </div>

                                  <span className="text-sm font-bold text-slate-900">
                                    {result.score.toFixed(2)}
                                  </span>
                                </div>
                              </td>

                              <td className="whitespace-nowrap px-4 py-4">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    result.status ===
                                    "calculated"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : result.status ===
                                        "no_applicable_parameters"
                                      ? "bg-amber-50 text-amber-700"
                                      : "bg-red-50 text-red-700"
                                  }`}
                                >
                                  {result.status.replace(
                                    "_",
                                    " "
                                  )}
                                </span>
                              </td>

                              <td className="px-4 py-4 text-sm text-slate-500">
                                {result.missingParameters
                                  .length > 0
                                  ? result.missingParameters.join(
                                      ", "
                                    )
                                  : "None"}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
            </section>
          </div>
        )}

        {activeTab === "applicants" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto max-w-lg">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl">
                👥
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-900">
                Applicant workflow is not integrated yet
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Candidate-wide application reads, assessment services,
                shortlisting, and interview actions are deliberately
                not exposed here until a secure server-side access
                architecture is established.
              </p>

              <p className="mt-3 text-xs text-slate-500">
                The existing PIS engine and job workflow remain fully
                separate from those deferred recruiter features.
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default function RecruiterJobDetailsPage() {
  return (
    <RoleGuard allowedRoles={["company"]}>
      <JobDetailsContent />
    </RoleGuard>
  );
}