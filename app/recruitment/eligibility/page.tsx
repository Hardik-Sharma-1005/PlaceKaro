"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  getRecruitmentData,
  saveRecruitmentData,
} from "../../../lib/recruitmentStore";

export default function EligibilityPage() {
  const router = useRouter();

  const existingData = getRecruitmentData();

  const [minCGPA, setMinCGPA] = useState(existingData.eligibility.minCGPA);
  const [maxBacklogs, setMaxBacklogs] = useState(
    existingData.eligibility.maxBacklogs
  );
  const [degreeRequired, setDegreeRequired] = useState(
    existingData.eligibility.degreeRequired
  );
  const [branchRequired, setBranchRequired] = useState(
    existingData.eligibility.branchRequired
  );
  const [internshipRequired, setInternshipRequired] = useState(
    existingData.eligibility.internshipRequired
  );

  function continueToPIS() {
    const currentData = getRecruitmentData();

    saveRecruitmentData({
      ...currentData,
      eligibility: {
        minCGPA,
        maxBacklogs,
        degreeRequired,
        branchRequired,
        internshipRequired,
      },
    });

    router.push("/recruitment/pis");
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 text-sm text-gray-600 hover:text-black"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold text-gray-900">
          Hard Eligibility
        </h1>

        <p className="mt-2 text-gray-600">
          Configure the minimum conditions a candidate must satisfy.
        </p>

        <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-5">
          <h2 className="font-semibold text-yellow-900">
            Hard Eligibility Rules
          </h2>

          <p className="mt-2 text-sm text-yellow-800">
            These conditions determine whether a candidate is eligible for
            the job. They are separate from the PIS score.
          </p>
        </div>

        <div className="mt-6 space-y-6 rounded-xl bg-white p-6 shadow-sm">
          <div>
            <label className="block font-medium text-gray-900">
              Minimum CGPA
            </label>

            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={minCGPA}
              onChange={(event) => setMinCGPA(Number(event.target.value))}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />

            <p className="mt-1 text-sm text-gray-500">
              Candidates below this CGPA will not meet the hard eligibility
              requirement.
            </p>
          </div>

          <div>
            <label className="block font-medium text-gray-900">
              Maximum Allowed Backlogs
            </label>

            <input
              type="number"
              min="0"
              value={maxBacklogs}
              onChange={(event) => setMaxBacklogs(Number(event.target.value))}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />

            <p className="mt-1 text-sm text-gray-500">
              Candidates with more backlogs than this limit will not be
              eligible.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="font-semibold text-gray-900">
              Required Conditions
            </h2>

            <div className="mt-4 space-y-4">
              <label className="flex items-center gap-3 text-gray-700">
                <input
                  type="checkbox"
                  checked={degreeRequired}
                  onChange={(event) =>
                    setDegreeRequired(event.target.checked)
                  }
                  className="h-4 w-4"
                />

                Required Degree
              </label>

              <label className="flex items-center gap-3 text-gray-700">
                <input
                  type="checkbox"
                  checked={branchRequired}
                  onChange={(event) =>
                    setBranchRequired(event.target.checked)
                  }
                  className="h-4 w-4"
                />

                Required Branch
              </label>

              <label className="flex items-center gap-3 text-gray-700">
                <input
                  type="checkbox"
                  checked={internshipRequired}
                  onChange={(event) =>
                    setInternshipRequired(event.target.checked)
                  }
                  className="h-4 w-4"
                />

                Internship Experience Required
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={continueToPIS}
            className="rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800"
          >
            Continue to PIS →
          </button>
        </div>
      </div>
    </main>
  );
}