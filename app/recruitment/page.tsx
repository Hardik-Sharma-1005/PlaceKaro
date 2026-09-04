"use client";

import { useRouter } from "next/navigation";

export default function RecruitmentDashboard() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900">
          Recruitment Workflow
        </h1>

        <p className="mt-2 text-gray-600">
          Create, configure, and publish a job posting.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Create Job */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-xl">
              1
            </div>

            <h2 className="mt-5 text-xl font-semibold text-gray-900">
              Create Job
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Enter the basic details and job description for the position.
            </p>

            <button
              type="button"
              onClick={() => router.push("/recruitment/create-job")}
              className="mt-6 w-full rounded-lg bg-black px-4 py-3 font-medium text-white hover:bg-gray-800"
            >
              Continue →
            </button>
          </div>

          {/* Requirement Review */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-xl">
              2
            </div>

            <h2 className="mt-5 text-xl font-semibold text-gray-900">
              Requirement Review
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Review extracted requirements and mark them as mandatory or
              optional.
            </p>

            <button
              type="button"
              onClick={() => router.push("/recruitment/requirements")}
              className="mt-6 w-full rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-900 hover:bg-gray-50"
            >
              Review Requirements →
            </button>
          </div>

          {/* Hard Eligibility */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-xl">
              3
            </div>

            <h2 className="mt-5 text-xl font-semibold text-gray-900">
              Hard Eligibility
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Configure minimum CGPA, backlog limits, degree, branch, and
              internship conditions.
            </p>

            <button
              type="button"
              onClick={() => router.push("/recruitment/eligibility")}
              className="mt-6 w-full rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-900 hover:bg-gray-50"
            >
              Configure Eligibility →
            </button>
          </div>

          {/* PIS Configuration */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-xl">
              4
            </div>

            <h2 className="mt-5 text-xl font-semibold text-gray-900">
              PIS Configuration
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Select scoring parameters and assign their weights for the
              Placement Intelligence Score.
            </p>

            <button
              type="button"
              onClick={() => router.push("/recruitment/pis")}
              className="mt-6 w-full rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-900 hover:bg-gray-50"
            >
              Configure PIS →
            </button>
          </div>

          {/* Review & Publish */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-xl">
              5
            </div>

            <h2 className="mt-5 text-xl font-semibold text-gray-900">
              Review & Publish
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Review the complete job configuration and publish the job.
            </p>

            <button
              type="button"
              onClick={() => router.push("/recruitment/review")}
              className="mt-6 w-full rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-900 hover:bg-gray-50"
            >
              Review Job →
            </button>
          </div>
        </div>

        {/* Workflow */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Recruitment Workflow
          </h2>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-gray-100 px-4 py-2">
              Create Job
            </span>

            <span className="text-gray-400">→</span>

            <span className="rounded-full bg-gray-100 px-4 py-2">
              Requirement Review
            </span>

            <span className="text-gray-400">→</span>

            <span className="rounded-full bg-gray-100 px-4 py-2">
              Hard Eligibility
            </span>

            <span className="text-gray-400">→</span>

            <span className="rounded-full bg-purple-100 px-4 py-2">
              PIS Configuration
            </span>

            <span className="text-gray-400">→</span>

            <span className="rounded-full bg-green-100 px-4 py-2">
              Review & Publish
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}