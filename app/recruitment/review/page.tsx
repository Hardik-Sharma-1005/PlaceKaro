"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { getRecruitmentData } from "../../../lib/recruitmentStore";

export default function ReviewPage() {
  const router = useRouter();
  const data = getRecruitmentData();

  const [published, setPublished] = useState(false);

  const totalWeight = data.pisParameters
    .filter((parameter) => parameter.enabled)
    .reduce((total, parameter) => total + parameter.weight, 0);

  function publishJob() {
    setPublished(true);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 text-sm text-gray-600 hover:text-black"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold text-gray-900">
          Review & Publish
        </h1>

        <p className="mt-2 text-gray-600">
          Review the job configuration before publishing it to candidates.
        </p>

        {published && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
            <h2 className="font-semibold text-green-900">
              Job Published Successfully
            </h2>

            <p className="mt-2 text-sm text-green-800">
              This demo job has been published and is ready for candidates.
            </p>
          </div>
        )}

        <div className="mt-6 space-y-6">
          {/* Job Details */}
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Job Details
              </h2>

              <button
                type="button"
                onClick={() => router.push("/recruitment/create-job")}
                className="text-sm text-gray-600 hover:text-black"
              >
                Edit
              </button>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Job Title</p>
                <p className="mt-1 font-medium text-gray-900">
                  {data.job.jobTitle}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Company</p>
                <p className="mt-1 font-medium text-gray-900">
                  {data.job.companyName}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="mt-1 font-medium text-gray-900">
                  {data.job.location}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Job Type</p>
                <p className="mt-1 font-medium text-gray-900">
                  {data.job.jobType}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm text-gray-500">Description</p>
              <p className="mt-1 text-gray-700">
                {data.job.description}
              </p>
            </div>
          </section>

          {/* Requirements */}
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Requirements
              </h2>

              <button
                type="button"
                onClick={() => router.push("/recruitment/requirements")}
                className="text-sm text-gray-600 hover:text-black"
              >
                Edit
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {data.requirements.map((requirement) => (
                <div
                  key={requirement.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {requirement.name}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {requirement.value}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      requirement.mandatory
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {requirement.mandatory ? "Mandatory" : "Optional"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Hard Eligibility */}
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Hard Eligibility
              </h2>

              <button
                type="button"
                onClick={() => router.push("/recruitment/eligibility")}
                className="text-sm text-gray-600 hover:text-black"
              >
                Edit
              </button>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">
                  Minimum CGPA
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {data.eligibility.minCGPA}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Maximum Backlogs
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {data.eligibility.maxBacklogs}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Degree Required
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {data.eligibility.degreeRequired ? "Yes" : "No"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Branch Required
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {data.eligibility.branchRequired ? "Yes" : "No"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Internship Required
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {data.eligibility.internshipRequired ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </section>

          {/* PIS Configuration */}
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                PIS Configuration
              </h2>

              <button
                type="button"
                onClick={() => router.push("/recruitment/pis")}
                className="text-sm text-gray-600 hover:text-black"
              >
                Edit
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {data.pisParameters
                .filter((parameter) => parameter.enabled)
                .map((parameter) => (
                  <div
                    key={parameter.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {parameter.name}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {parameter.description}
                      </p>
                    </div>

                    <span className="font-semibold text-gray-900">
                      {parameter.weight}%
                    </span>
                  </div>
                ))}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-gray-200 pt-5">
              <span className="font-semibold text-gray-900">
                Total Weight
              </span>

              <span
                className={`font-bold ${
                  totalWeight === 100
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {totalWeight}%
              </span>
            </div>
          </section>
        </div>

        {/* Publish */}
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={publishJob}
            disabled={published || totalWeight !== 100}
            className="rounded-lg bg-black px-8 py-3 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {published ? "Published ✓" : "Publish Job"}
          </button>
        </div>
      </div>
    </main>
  );
}