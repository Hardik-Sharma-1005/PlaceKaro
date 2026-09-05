"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  equalTo,
  get,
  orderByChild,
  query,
  ref,
} from "firebase/database";

import { RoleGuard } from "../../../lib/components/RoleGuard";
import { StudentSidebar } from "../../../lib/components/StudentSidebar";
import { useAuth } from "../../../lib/context/AuthContext";
import { database } from "../../../lib/firebase/database";

import type { Application, Job } from "../../../types/database";

function OpportunityDetailsContent({
  jobId,
}: {
  jobId: string;
}) {
  const { firebaseUser } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOpportunity() {
      if (!firebaseUser?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const jobsQuery = query(
          ref(database, "jobs"),
          orderByChild("status"),
          equalTo("published")
        );

        const applicationsQuery = query(
          ref(database, "applications"),
          orderByChild("studentId"),
          equalTo(firebaseUser.uid)
        );

        const [jobsSnapshot, applicationsSnapshot] = await Promise.all([
          get(jobsQuery),
          get(applicationsQuery),
        ]);

        const jobs = jobsSnapshot.exists()
          ? Object.entries(
              jobsSnapshot.val() as Record<string, Job>
            ).map(([key, val]) => ({
              ...val,
              id: val.id || key,
            }))
          : [];

        const selectedJob = jobs.find((item) => item.id === jobId);

        if (!selectedJob) {
          setError("This opportunity could not be found.");
          setJob(null);
          setApplication(null);
          return;
        }

        const applications = applicationsSnapshot.exists()
          ? Object.entries(
              applicationsSnapshot.val() as Record<string, Application>
            ).map(([key, val]) => ({
              ...val,
              id: val.id || key,
            }))
          : [];

        const selectedApplication =
          applications.find(
            (item) => item.jobId === selectedJob.id
          ) ?? null;

        setJob(selectedJob);
        setApplication(selectedApplication);
      } catch (loadError) {
        console.error("Failed to load opportunity:", loadError);
        setError("Unable to load this opportunity right now.");
      } finally {
        setLoading(false);
      }
    }

    loadOpportunity();
  }, [firebaseUser?.uid, jobId]);

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-slate-700">
          Loading opportunity...
        </p>
      </section>
    );
  }

  if (error || !job) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-8">
        <p className="text-sm font-semibold text-red-700">
          {error ?? "Opportunity not found."}
        </p>

        <Link
          href="/opportunities"
          className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Back to Opportunities
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <Link
        href="/opportunities"
        className="inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-slate-950"
      >
        ← Back to Opportunities
      </Link>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Open
              </span>

              {application?.status === "applied" && (
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                  Applied
                </span>
              )}

              {application?.status === "invited" && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Invited
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {job.title}
            </h1>

            <p className="mt-2 text-sm font-semibold text-slate-600">
              Published opportunity on PlaceKaro
            </p>
          </div>

          <div className="shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 lg:w-52">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Assessment
            </p>

            <p className="mt-1 text-base font-bold text-emerald-800">
              {application?.assessmentUnlocked
                ? "Available"
                : job.assessmentId
                  ? "Included"
                  : "Not required"}
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-7">
          <h2 className="text-lg font-bold text-slate-950">
            About this opportunity
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            {job.description}
          </p>
        </div>

        <div className="mt-8 grid gap-4 border-t border-slate-100 pt-7 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Opportunity status
            </p>

            <p className="mt-2 text-sm font-semibold capitalize text-slate-800">
              {job.status}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Application
            </p>

            <p className="mt-2 text-sm font-semibold capitalize text-slate-800">
              {application?.status ?? "Not applied"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Assessment
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-800">
              {application?.assessmentUnlocked
                ? "Unlocked"
                : job.assessmentId
                  ? "Included"
                  : "Not required"}
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-7">
          {application?.assessmentUnlocked ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-sm font-semibold text-emerald-800">
                Your assessment is unlocked.
              </p>

              <p className="mt-1 text-sm leading-6 text-emerald-700">
                You can continue to the assessment from your recruitment
                workflow.
              </p>

              <button
                type="button"
                disabled
                className="mt-4 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white opacity-60"
                title="Assessment entry will be connected in the next step."
              >
                Continue to Assessment
              </button>
            </div>
          ) : application ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-800">
                Application status:{" "}
                <span className="capitalize">{application.status}</span>
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Your application is already recorded for this opportunity.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-800">
                Ready to apply?
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Application submission will be connected to the recruitment
                workflow in the next step.
              </p>

              <button
                type="button"
                disabled
                className="mt-4 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white opacity-60"
                title="Application workflow will be connected in the next step."
              >
                Apply Now
              </button>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}

export default function OpportunityDetailsPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;

  return (
    <RoleGuard allowedRoles={["student"]}>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="flex min-h-screen">
          <StudentSidebar />
          <div className="min-w-0 flex-1">
            <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex min-h-20 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
            <div>
              <p className="text-xl font-bold tracking-tight text-slate-950">
                PlaceKaro
              </p>

              <p className="text-xs text-slate-500">
                Placement Intelligence
              </p>
            </div>

            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
          <p className="mb-6 text-sm font-medium text-slate-500">
            Student workspace
          </p>

          <OpportunityDetailsContent jobId={jobId} />
            </main>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}