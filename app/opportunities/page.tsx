"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  equalTo,
  get,
  orderByChild,
  query,
  ref,
} from "firebase/database";

import { RoleGuard } from "../../lib/components/RoleGuard";
import { StudentSidebar } from "../../lib/components/StudentSidebar";
import { useAuth } from "../../lib/context/AuthContext";
import { database } from "../../lib/firebase/database";

import type { Application, Job } from "../../types/database";

interface Opportunity {
  job: Job;
  application: Application | null;
}

function OpportunitiesContent() {
  const { firebaseUser } = useAuth();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOpportunities() {
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

        const applications = applicationsSnapshot.exists()
          ? Object.entries(
              applicationsSnapshot.val() as Record<string, Application>
            ).map(([key, val]) => ({
              ...val,
              id: val.id || key,
            }))
          : [];

        const applicationByJobId = new Map(
          applications.map((application) => [
            application.jobId,
            application,
          ])
        );

        const loadedOpportunities: Opportunity[] = jobs
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((job) => ({
            job,
            application: applicationByJobId.get(job.id) ?? null,
          }));

        setOpportunities(loadedOpportunities);
      } catch (loadError) {
        console.error("Failed to load opportunities:", loadError);
        setError("Unable to load opportunities right now.");
      } finally {
        setLoading(false);
      }
    }

    loadOpportunities();
  }, [firebaseUser?.uid]);

  return (
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
        <section>
          <p className="text-sm font-medium text-slate-500">
            Student workspace
          </p>

          <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Opportunities
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Explore published roles and review the opportunities available
                to you on PlaceKaro.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Available
              </p>

              <p className="mt-1 text-xl font-bold text-slate-950">
                {loading ? "—" : opportunities.length}
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-medium text-slate-700">
              Loading opportunities...
            </p>
          </section>
        ) : opportunities.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <p className="text-base font-semibold text-slate-800">
              No published opportunities yet
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              New opportunities will appear here when companies publish roles
              on PlaceKaro.
            </p>
          </section>
        ) : (
          <section className="mt-8 space-y-5">
            {opportunities.map(({ job, application }, index) => (
              <article
                key={`${job.id || job.title || "opportunity"}-${index}`}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-7"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
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

                    <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
                      {job.title}
                    </h2>

                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      Opportunity
                    </p>

                    <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
                      {job.description}
                    </p>
                  </div>

                  <div className="shrink-0 lg:w-44">
                    {application?.assessmentUnlocked ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                          Assessment
                        </p>

                        <p className="mt-1 text-sm font-semibold text-emerald-800">
                          Available
                        </p>
                      </div>
                    ) : job.assessmentId ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Assessment
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          Included
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Assessment
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          Not required
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Status
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-800">
                      Published
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Application
                    </p>

                    <p className="mt-1 text-sm font-medium capitalize text-slate-800">
                      {application?.status ?? "Not applied"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Assessment
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {application?.assessmentUnlocked
                        ? "Unlocked"
                        : job.assessmentId
                          ? "Included"
                          : "Not required"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    {application?.assessmentUnlocked ? (
                      <p className="text-sm font-medium text-emerald-700">
                        Your assessment is unlocked for this opportunity.
                      </p>
                    ) : application ? (
                      <p className="text-sm font-medium text-slate-600">
                        Your application status:{" "}
                        <span className="capitalize">
                          {application.status}
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Review the opportunity details before applying.
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/opportunities/${job.id}`}
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    View details
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function OpportunitiesPage() {
  return (
    <RoleGuard allowedRoles={["student"]}>
      <OpportunitiesContent />
    </RoleGuard>
  );
}
