"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  getRecruitmentData,
  saveRecruitmentData,
} from "../../../lib/recruitmentStore";

import type { PISParameter } from "../../../lib/recruitmentStore";

export default function PISPage() {
  const router = useRouter();

  const [parameters, setParameters] = useState<PISParameter[]>(
    getRecruitmentData().pisParameters
  );

  const totalWeight = parameters
    .filter((parameter) => parameter.enabled)
    .reduce((total, parameter) => total + parameter.weight, 0);

  function updateWeight(id: number, weight: number) {
    setParameters((current) =>
      current.map((parameter) =>
        parameter.id === id
          ? {
              ...parameter,
              weight,
            }
          : parameter
      )
    );
  }

  function toggleParameter(id: number) {
    setParameters((current) =>
      current.map((parameter) =>
        parameter.id === id
          ? {
              ...parameter,
              enabled: !parameter.enabled,
            }
          : parameter
      )
    );
  }

  function continueToReview() {
    if (totalWeight !== 100) {
      alert("PIS weights must total exactly 100%.");
      return;
    }

    const currentData = getRecruitmentData();

    saveRecruitmentData({
      ...currentData,
      pisParameters: parameters,
    });

    router.push("/recruitment/review");
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
          PIS Configuration
        </h1>

        <p className="mt-2 text-gray-600">
          Configure how different candidate factors contribute to the
          Placement Intelligence Score.
        </p>

        <div className="mt-6 rounded-xl border border-purple-200 bg-purple-50 p-5">
          <h2 className="font-semibold text-purple-900">
            Placement Intelligence Score
          </h2>

          <p className="mt-2 text-sm text-purple-800">
            Select the parameters that should contribute to the score and
            assign a weight to each one. The total weight must equal 100%.
          </p>
        </div>

        <div className="mt-6 rounded-xl bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="font-semibold text-gray-900">
                Scoring Parameters
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Configure the importance of each parameter.
              </p>
            </div>

            <div
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                totalWeight === 100
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              Total: {totalWeight}%
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {parameters.map((parameter) => (
              <div
                key={parameter.id}
                className="flex items-center gap-6 px-6 py-5"
              >
                <input
                  type="checkbox"
                  checked={parameter.enabled}
                  onChange={() => toggleParameter(parameter.id)}
                  className="h-4 w-4"
                />

                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    {parameter.name}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {parameter.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={parameter.weight}
                    disabled={!parameter.enabled}
                    onChange={(event) =>
                      updateWeight(
                        parameter.id,
                        Number(event.target.value)
                      )
                    }
                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-right outline-none focus:border-black disabled:bg-gray-100 disabled:text-gray-400"
                  />

                  <span className="text-gray-600">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">
            Important
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            PlaceKaro controls the actual scoring formula. This screen only
            allows the recruiter to select parameters and assign their
            relative weights.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={continueToReview}
            className="rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800"
          >
            Continue to Review →
          </button>
        </div>
      </div>
    </main>
  );
}