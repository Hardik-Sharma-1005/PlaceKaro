"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculatePIS,
} from "../../../lib/pis/engine";
import type {
  PISInput,
  PISParameter,
  PISResult,
} from "../../../lib/pis/types";

const JOB_ID = "job-001";

const DEMO_CANDIDATES = [
  {
    id: "demo-student-001",
    name: "Aarav Mehta",
  },
  {
    id: "demo-student-002",
    name: "Priya Sharma",
  },
  {
    id: "demo-student-003",
    name: "Rohan Verma",
  },
];

const PARAMETER_OPTIONS: {
  key: PISParameter;
  label: string;
  defaultWeight: number;
}[] = [
  {
    key: "academicPerformance",
    label: "Academic Performance",
    defaultWeight: 25,
  },
  {
    key: "attendance",
    label: "Attendance",
    defaultWeight: 0,
  },
  {
    key: "backlogs",
    label: "Backlogs",
    defaultWeight: 0,
  },
  {
    key: "graduationYear",
    label: "Graduation Year",
    defaultWeight: 0,
  },
  {
    key: "technicalSkills",
    label: "Technical Skills",
    defaultWeight: 35,
  },
  {
    key: "domainSkills",
    label: "Domain Skills",
    defaultWeight: 0,
  },
  {
    key: "projects",
    label: "Projects",
    defaultWeight: 20,
  },
  {
    key: "internships",
    label: "Internships / Experience",
    defaultWeight: 20,
  },
  {
    key: "certifications",
    label: "Certifications",
    defaultWeight: 0,
  },
  {
    key: "achievements",
    label: "Achievements",
    defaultWeight: 0,
  },
  {
    key: "evidenceQuality",
    label: "Evidence / Verification Quality",
    defaultWeight: 0,
  },
  {
    key: "preferredQualifications",
    label: "JD-specific Preferred Qualifications",
    defaultWeight: 0,
  },
];

type CandidateView = {
  id: string;
  name: string;
  result: PISResult | null;
  error: string | null;
};

type RecruiterPISResponse = {
  inputs?: PISInput[];
  error?: string;
};

function formatScore(score: number): string {
  return score.toFixed(2);
}

function createDefaultWeights(): Record<
  PISParameter,
  number
> {
  const initial =
    {} as Record<PISParameter, number>;

  for (const option of PARAMETER_OPTIONS) {
    initial[option.key] =
      option.defaultWeight;
  }

  return initial;
}

function createWeightsFromConfiguration(
  parameters: Partial<
    Record<PISParameter, number>
  >
): Record<PISParameter, number> {
  const weights = createDefaultWeights();

  for (const option of PARAMETER_OPTIONS) {
    weights[option.key] =
      typeof parameters[option.key] === "number"
        ? parameters[option.key]!
        : 0;
  }

  return weights;
}

function buildConfiguration(
  weights: Record<PISParameter, number>
) {
  const parameters: Partial<
    Record<PISParameter, number>
  > = {};

  for (const option of PARAMETER_OPTIONS) {
    const weight = weights[option.key];

    if (weight > 0) {
      parameters[option.key] = weight;
    }
  }

  return {
    jobId: JOB_ID,
    parameters,
    confirmed: true,
    updatedAt: Date.now(),
  };
}

export default function RecruiterPISPage() {
  const [weights, setWeights] = useState<
    Record<PISParameter, number>
  >(createDefaultWeights);

  const [candidateInputs, setCandidateInputs] =
    useState<PISInput[] | null>(null);

  const [candidates, setCandidates] =
    useState<CandidateView[]>(
      DEMO_CANDIDATES.map((candidate) => ({
        ...candidate,
        result: null,
        error: null,
      }))
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [saveMessage, setSaveMessage] =
    useState("");

  const [loadError, setLoadError] =
    useState("");

  const totalWeight = useMemo(
    () =>
      Object.values(weights).reduce(
        (sum, weight) => sum + weight,
        0
      ),
    [weights]
  );

  const selectedParameterCount = useMemo(
    () =>
      Object.values(weights).filter(
        (weight) => weight > 0
      ).length,
    [weights]
  );

  const isValidConfiguration =
    Math.abs(totalWeight - 100) < 0.0001 &&
    selectedParameterCount > 0;

  async function loadCandidateInputs(): Promise<
    PISInput[]
  > {
    const response = await fetch(
      `/api/recruiter/pis?jobId=${encodeURIComponent(
        JOB_ID
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
          "Unable to load recruiter PIS data."
      );
    }

    if (
      !data.inputs ||
      data.inputs.length === 0
    ) {
      throw new Error(
        "No recruiter PIS candidate data was returned."
      );
    }

    return data.inputs;
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData(): Promise<void> {
      try {
        setIsLoading(true);
        setLoadError("");

        const inputs =
          await loadCandidateInputs();

        if (cancelled) {
          return;
        }

        const savedConfiguration =
          inputs[0]?.configuration;

        if (savedConfiguration) {
          setWeights(
            createWeightsFromConfiguration(
              savedConfiguration.parameters
            )
          );
        }

        setCandidateInputs(inputs);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load recruiter PIS data."
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateWeight(
    parameter: PISParameter,
    value: string
  ): void {
    const parsed = Number(value);

    setSaveMessage("");

    setWeights((current) => ({
      ...current,
      [parameter]:
        Number.isFinite(parsed) && parsed >= 0
          ? Math.min(parsed, 100)
          : 0,
    }));
  }

  async function saveConfiguration(): Promise<boolean> {
    if (!isValidConfiguration) {
      setSaveMessage(
        "Weights must total exactly 100%."
      );
      return false;
    }

    try {
      setIsSaving(true);
      setSaveMessage("");

      const configuration =
        buildConfiguration(weights);

      const response = await fetch(
        "/api/recruiter/pis",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            jobId: JOB_ID,
            parameters:
              configuration.parameters,
          }),
        }
      );

      const data =
        (await response.json()) as {
          success?: boolean;
          error?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Unable to save PIS configuration."
        );
      }

      setSaveMessage(
        "Configuration saved successfully."
      );

      return true;
    } catch (error) {
      setSaveMessage(
        error instanceof Error
          ? error.message
          : "Unable to save PIS configuration."
      );

      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveAndCalculate(): Promise<void> {
    if (!isValidConfiguration) {
      return;
    }

    const saved =
      await saveConfiguration();

    if (!saved) {
      return;
    }

    try {
      const inputs =
        candidateInputs ??
        (await loadCandidateInputs());

      const configuration =
        buildConfiguration(weights);

      const updatedCandidates: CandidateView[] =
        inputs.map((input) => {
          try {
            const result = calculatePIS({
              ...input,
              configuration,
            });

            const candidate =
              DEMO_CANDIDATES.find(
                (item) =>
                  item.id === result.studentId
              );

            return {
              id: result.studentId,
              name:
                candidate?.name ??
                result.studentId,
              result,
              error: null,
            };
          } catch (error) {
            return {
              id:
                input.candidate.profile.userId,
              name:
                DEMO_CANDIDATES.find(
                  (item) =>
                    item.id ===
                    input.candidate.profile.userId
                )?.name ??
                input.candidate.profile.fullName,
              result: null,
              error:
                error instanceof Error
                  ? error.message
                  : "Unable to calculate PIS.",
            };
          }
        });

      setCandidateInputs(inputs);
      setCandidates(updatedCandidates);
    } catch (error) {
      setCandidates((current) =>
        current.map((candidate) => ({
          ...candidate,
          result: null,
          error:
            error instanceof Error
              ? error.message
              : "Unable to load PIS data.",
        }))
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Recruiter PIS
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Placement Intelligence Score
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Configure the parameters that matter
            for this role, assign their weights,
            save the configuration, and calculate
            deterministic candidate PIS scores.
          </p>
        </div>

        {loadError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Job
              </p>

              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                Software Engineer Intern
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Job ID: {JOB_ID}
              </p>
            </div>

            <div
              className={`rounded-xl px-4 py-3 ${
                isValidConfiguration
                  ? "bg-emerald-50"
                  : "bg-amber-50"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Weight
              </p>

              <p
                className={`mt-1 text-xl font-bold ${
                  isValidConfiguration
                    ? "text-emerald-700"
                    : "text-amber-700"
                }`}
              >
                {formatScore(totalWeight)}%
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  PIS Configuration
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Set a weight greater than 0% to
                  select a parameter.
                </p>
              </div>

              <p
                className={`text-sm font-medium ${
                  isValidConfiguration
                    ? "text-emerald-600"
                    : "text-amber-600"
                }`}
              >
                {isValidConfiguration
                  ? "Configuration valid"
                  : "Weights must total exactly 100%"}
              </p>
            </div>

            {isLoading ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Loading saved PIS configuration...
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {PARAMETER_OPTIONS.map(
                    (option) => {
                      const weight =
                        weights[option.key];

                      return (
                        <div
                          key={option.key}
                          className={`rounded-xl border p-4 transition ${
                            weight > 0
                              ? "border-blue-200 bg-blue-50/50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {option.label}
                              </p>

                              {weight > 0 && (
                                <p className="mt-1 text-xs text-blue-600">
                                  Selected
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                value={weight}
                                onChange={(event) =>
                                  updateWeight(
                                    option.key,
                                    event.target.value
                                  )
                                }
                                className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-right text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              />

                              <span className="text-sm text-slate-500">
                                %
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all"
                              style={{
                                width: `${Math.min(
                                  Math.max(
                                    weight,
                                    0
                                  ),
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Selected parameters:{" "}
                      {selectedParameterCount}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Weights are saved to the
                      recruiter PIS configuration
                      for this job.
                    </p>

                    {saveMessage && (
                      <p className="mt-2 text-sm font-medium text-slate-700">
                        {saveMessage}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={
                      handleSaveAndCalculate
                    }
                    disabled={
                      !isValidConfiguration ||
                      isSaving ||
                      isLoading
                    }
                    className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
                      isValidConfiguration &&
                      !isSaving &&
                      !isLoading
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "cursor-not-allowed bg-slate-200 text-slate-400"
                    }`}
                  >
                    {isSaving
                      ? "Saving..."
                      : "Save & Calculate PIS"}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Candidate PIS
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Results are calculated using the
              saved recruiter configuration.
            </p>
          </div>

          <div className="space-y-5">
            {candidates.map((candidate) => (
              <article
                key={candidate.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {candidate.name}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {candidate.id}
                    </p>
                  </div>

                  {candidate.result ? (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 px-6 py-4 text-center">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        PIS
                      </p>

                      <p className="mt-1 text-4xl font-bold text-blue-600">
                        {formatScore(
                          candidate.result.score
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        out of 100
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      {candidate.error ??
                        "Save a valid configuration and calculate PIS."}
                    </div>
                  )}
                </div>

                {candidate.result && (
                  <div className="mt-6">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900">
                        PIS Breakdown
                      </h4>

                      <span className="text-xs text-slate-500">
                        {candidate.result.status}
                      </span>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <div className="hidden grid-cols-5 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
                        <span>Parameter</span>
                        <span>Score</span>
                        <span>Original</span>
                        <span>Effective</span>
                        <span>Contribution</span>
                      </div>

                      <div className="divide-y divide-slate-200">
                        {candidate.result.components.map(
                          (component) => (
                            <div
                              key={component.parameter}
                              className="grid gap-2 px-4 py-4 md:grid-cols-5 md:items-center"
                            >
                              <div>
                                <p className="text-sm font-medium text-slate-900">
                                  {component.parameter}
                                </p>

                                <p className="mt-1 text-xs text-slate-500 md:hidden">
                                  {component.status}
                                </p>
                              </div>

                              <p className="text-sm text-slate-700">
                                {formatScore(
                                  component.score
                                )}
                              </p>

                              <p className="text-sm text-slate-700">
                                {formatScore(
                                  component.originalWeight
                                )}
                                %
                              </p>

                              <p className="text-sm text-slate-700">
                                {formatScore(
                                  component.effectiveWeight
                                )}
                                %
                              </p>

                              <p className="text-sm font-semibold text-slate-900">
                                {formatScore(
                                  component.contribution
                                )}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>
                        Original weights:{" "}
                        {formatScore(
                          candidate.result
                            .originalWeightTotal
                        )}
                        %
                      </span>

                      <span>
                        Effective weights:{" "}
                        {formatScore(
                          candidate.result
                            .effectiveWeightTotal
                        )}
                        %
                      </span>

                      {candidate.result
                        .missingParameters
                        .length > 0 && (
                        <span>
                          Missing:{" "}
                          {candidate.result.missingParameters.join(
                            ", "
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}