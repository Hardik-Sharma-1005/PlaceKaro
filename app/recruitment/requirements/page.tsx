"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  getRecruitmentData,
  saveRecruitmentData,
} from "../../../lib/recruitmentStore";

import type { Requirement } from "../../../lib/recruitmentStore";

export default function RequirementsPage() {
  const router = useRouter();

  const [requirements, setRequirements] = useState<Requirement[]>(
    getRecruitmentData().requirements
  );

  function toggleMandatory(id: number) {
    setRequirements((current) =>
      current.map((requirement) =>
        requirement.id === id
          ? {
              ...requirement,
              mandatory: !requirement.mandatory,
            }
          : requirement
      )
    );
  }

  function removeRequirement(id: number) {
    setRequirements((current) =>
      current.filter((requirement) => requirement.id !== id)
    );
  }

  function continueToEligibility() {
    const currentData = getRecruitmentData();

    saveRecruitmentData({
      ...currentData,
      requirements,
    });

    router.push("/recruitment/eligibility");
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
          Requirement Review
        </h1>

        <p className="mt-2 text-gray-600">
          Review the requirements extracted from the job description.
        </p>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="font-semibold text-blue-900">
            Review Job Requirements
          </h2>

          <p className="mt-2 text-sm text-blue-800">
            Mark requirements as mandatory or optional. Mandatory requirements
            will be used for hard eligibility.
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="font-semibold text-gray-900">
              Requirements
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {requirements.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No requirements available.
              </div>
            ) : (
              requirements.map((requirement) => (
                <div
                  key={requirement.id}
                  className="flex items-center gap-6 px-6 py-5"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-900">
                        {requirement.name}
                      </h3>

                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        {requirement.category}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      {requirement.value}
                    </p>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={requirement.mandatory}
                      onChange={() => toggleMandatory(requirement.id)}
                      className="h-4 w-4"
                    />

                    Mandatory
                  </label>

                  <button
                    type="button"
                    onClick={() => removeRequirement(requirement.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={continueToEligibility}
            className="rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800"
          >
            Continue to Eligibility →
          </button>
        </div>
      </div>
    </main>
  );
}