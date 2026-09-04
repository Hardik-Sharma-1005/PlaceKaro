"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../lib/context/AuthContext";
import { RoleGuard } from "../../../../lib/components/RoleGuard";
import { jobService } from "../../../../lib/services/jobService";
import type {
  AssessmentAccessModel,
  PISConfiguration,
} from "../../../../types/database";

const AVAILABLE_BRANCHES = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Mechanical",
  "Civil",
  "Electrical",
];

const PIS_PARAMETERS: Array<{
  key: keyof PISConfiguration["parameters"];
  label: string;
}> = [
  {
    key: "academicPerformance",
    label: "Academic Performance",
  },
  {
    key: "attendance",
    label: "Attendance",
  },
  {
    key: "backlogs",
    label: "Backlogs",
  },
  {
    key: "graduationYear",
    label: "Graduation Year",
  },
  {
    key: "technicalSkills",
    label: "Technical Skills",
  },
  {
    key: "domainSkills",
    label: "Domain Skills",
  },
  {
    key: "projects",
    label: "Projects",
  },
  {
    key: "internships",
    label: "Internships / Experience",
  },
  {
    key: "certifications",
    label: "Certifications",
  },
  {
    key: "achievements",
    label: "Achievements",
  },
  {
    key: "evidenceQuality",
    label: "Evidence / Verification Quality",
  },
  {
    key: "preferredQualifications",
    label: "JD-specific Preferred Qualifications",
  },
];

const createEmptyWeights = (): PISConfiguration["parameters"] => ({
  academicPerformance: 0,
  attendance: 0,
  backlogs: 0,
  graduationYear: 0,
  technicalSkills: 0,
  domainSkills: 0,
  projects: 0,
  internships: 0,
  certifications: 0,
  achievements: 0,
  evidenceQuality: 0,
  preferredQualifications: 0,
});

function JobCreationWizard() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [minCgpa, setMinCgpa] = useState("7.0");
  const [maxBacklogs, setMaxBacklogs] = useState("0");
  const [graduationYears, setGraduationYears] = useState<string[]>([
    "2029",
  ]);

  const [accessModel, setAccessModel] =
    useState<AssessmentAccessModel>("all_eligible");

  const [weights, setWeights] =
    useState<PISConfiguration["parameters"]>(createEmptyWeights);

  const toggleBranch = (branch: string) => {
    setSelectedBranches((previous) =>
      previous.includes(branch)
        ? previous.filter((item) => item !== branch)
        : [...previous, branch]
    );
  };

  const toggleYear = (year: string) => {
    setGraduationYears((previous) =>
      previous.includes(year)
        ? previous.filter((item) => item !== year)
        : [...previous, year]
    );
  };

  const handleWeightChange = (
    parameter: keyof PISConfiguration["parameters"],
    value: string
  ) => {
    const numericValue = Number.parseInt(value, 10);

    setWeights((previous) => ({
      ...previous,
      [parameter]:
        Number.isFinite(numericValue) && numericValue >= 0
          ? Math.min(100, numericValue)
          : 0,
    }));
  };

  const totalWeight = Object.values(weights).reduce(
    (total, weight) => total + (weight ?? 0),
    0
  );

  const canContinueFromEligibility =
    Number.isFinite(Number.parseFloat(minCgpa)) &&
    Number.parseFloat(minCgpa) >= 0 &&
    Number.parseFloat(minCgpa) <= 10 &&
    Number.isInteger(Number.parseInt(maxBacklogs, 10)) &&
    Number.parseInt(maxBacklogs, 10) >= 0 &&
    graduationYears.length > 0;

  const handlePublish = async () => {
    if (!user) {
      return;
    }

    if (!title.trim()) {
      alert("Please enter a job title.");
      return;
    }

    if (!canContinueFromEligibility) {
      alert("Please provide valid eligibility criteria.");
      return;
    }

    if (totalWeight !== 100) {
      alert("PIS weights must exactly total 100%.");
      return;
    }

    setIsSubmitting(true);

    try {
      const jobId = await jobService.createJob({
        companyId: user.uid,
        recruiterId: user.uid,
        title: title.trim(),
        description: description.trim(),
        status: "draft",
        assessmentAccessModel: accessModel,
      });

      await jobService.updateJobRequirements(jobId, {
        hardEligibility: {
          branches: selectedBranches,
          graduationYears: graduationYears
            .map((year) => Number.parseInt(year, 10))
            .filter((year) => Number.isInteger(year)),
          minimumCGPA: Number.parseFloat(minCgpa),
          maximumBacklogs: Number.parseInt(maxBacklogs, 10),
        },
        competencies: {},
        confirmedByCompany: true,
      });

      await jobService.updateJobPISConfig(jobId, weights);

      await jobService.requestJobApproval(jobId);

      router.push("/recruiter/jobs");
    } catch (error) {
      console.error("Failed to create job:", error);
      alert(
        "The job could not be submitted for approval. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-4">
            <Link
              href="/recruiter/jobs"
              className="text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              &larr; Cancel
            </Link>

            <div className="h-4 w-px bg-slate-300" />

            <p className="text-sm font-bold tracking-widest text-slate-900">
              Create New Job
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="relative flex items-center justify-between">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded" />

            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-900 -z-10 rounded transition-all duration-300"
              style={{
                width: `${((step - 1) / 3) * 100}%`,
              }}
            />

            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ring-4 ring-slate-50 transition-colors ${
                  item <= step
                    ? "bg-slate-900 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {item}
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-2 text-xs font-medium text-slate-500 px-1">
            <span>Basics</span>
            <span>Eligibility</span>
            <span>PIS Config</span>
            <span>Submit</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6 sm:p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Job Details & JD
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Provide the basic information for this opening.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Job Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Software Engineer Intern"
                  className="mt-1 block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Job Description (JD)
                </label>
                <textarea
                  rows={7}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe the role, responsibilities, required skills, and preferred qualifications..."
                  className="mt-1 block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Hard Eligibility
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Set strict cut-offs. Students failing these criteria are
                  not eligible for the role.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Allowed Branches
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABLE_BRANCHES.map((branch) => (
                    <label
                      key={branch}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedBranches.includes(branch)
                          ? "bg-slate-50 border-slate-900"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedBranches.includes(branch)}
                        onChange={() => toggleBranch(branch)}
                        className="h-4 w-4 text-slate-900 focus:ring-slate-900 border-slate-300 rounded"
                      />

                      <span className="text-sm font-medium text-slate-700">
                        {branch}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Minimum CGPA
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={minCgpa}
                    onChange={(event) => setMinCgpa(event.target.value)}
                    className="mt-1 block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Maximum Backlogs
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={maxBacklogs}
                    onChange={(event) =>
                      setMaxBacklogs(event.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Graduation Year
                </label>

                <div className="flex flex-wrap gap-2">
                  {["2027", "2028", "2029", "2030", "2031"].map(
                    (year) => (
                      <label
                        key={year}
                        className={`flex items-center gap-2 p-2 px-4 rounded-full border cursor-pointer ${
                          graduationYears.includes(year)
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-700 border-slate-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={graduationYears.includes(year)}
                          onChange={() => toggleYear(year)}
                        />

                        <span className="text-sm font-medium">
                          {year}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Placement Intelligence Score (PIS)
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Select the factors you want to use and assign recruiter
                  weightage. Selected weights must total exactly 100%.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Assessment Access Model
                </label>

                <select
                  value={accessModel}
                  onChange={(event) =>
                    setAccessModel(
                      event.target.value as AssessmentAccessModel
                    )
                  }
                  className="mt-1 block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6"
                >
                  <option value="all_eligible">
                    All Eligible — everyone passing hard eligibility
                  </option>
                  <option value="role_fit">
                    Role Fit — access based on recruiter-defined fit
                  </option>
                  <option value="custom">
                    Custom — manual invitation
                  </option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-900">
                      PIS Weightage Configuration
                    </h3>

                    <p className="text-xs text-slate-500">
                      Set a weight above 0% to select a parameter.
                    </p>
                  </div>

                  <span
                    className={`text-sm font-bold ${
                      totalWeight === 100
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    Total: {totalWeight}%
                  </span>
                </div>

                <div className="space-y-4">
                  {PIS_PARAMETERS.map(({ key, label }) => {
                    const weight = weights[key] ?? 0;

                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-slate-700 font-medium">
                            {label}
                          </span>

                          <span className="text-sm font-medium text-slate-900 w-12 text-right">
                            {weight}%
                          </span>
                        </div>

                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={weight}
                          onChange={(event) =>
                            handleWeightChange(
                              key,
                              event.target.value
                            )
                          }
                          className="mt-2 w-full accent-slate-900"
                        />
                      </div>
                    );
                  })}
                </div>

                {totalWeight !== 100 && (
                  <p className="text-xs text-red-600 mt-3">
                    Weights must exactly total 100% to proceed.
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Confirm & Submit
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Review the job before sending it to the placement cell
                  for approval.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-5 ring-1 ring-inset ring-slate-200 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500">
                    Job Title
                  </h3>

                  <p className="text-base font-semibold text-slate-900">
                    {title || "Untitled Job"}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-500">
                    Description
                  </h3>

                  <p className="text-sm text-slate-700 whitespace-pre-wrap mt-1">
                    {description || "No description provided."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-xs font-medium text-slate-500">
                      Branches
                    </h3>

                    <p className="text-sm font-medium text-slate-900 mt-1">
                      {selectedBranches.length === 0
                        ? "All branches"
                        : `${selectedBranches.length} selected`}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-slate-500">
                      Minimum CGPA
                    </h3>

                    <p className="text-sm font-medium text-slate-900 mt-1">
                      {minCgpa}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-slate-500">
                      Max Backlogs
                    </h3>

                    <p className="text-sm font-medium text-slate-900 mt-1">
                      {maxBacklogs}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-slate-500">
                    Graduation Years
                  </h3>

                  <p className="text-sm font-medium text-slate-900 mt-1">
                    {graduationYears.join(", ")}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-slate-500">
                    Assessment Access
                  </h3>

                  <p className="text-sm font-medium text-slate-900 mt-1 capitalize">
                    {accessModel.replace("_", " ")}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-slate-500 mb-2">
                    PIS Configuration
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {PIS_PARAMETERS.filter(
                      ({ key }) => (weights[key] ?? 0) > 0
                    ).map(({ key, label }) => (
                      <span
                        key={key}
                        className="inline-flex items-center rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200"
                      >
                        {label}: {weights[key]}%
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-blue-600 mt-0.5">ℹ</span>

                  <div>
                    <h4 className="text-sm font-semibold text-blue-900">
                      Submission flow
                    </h4>

                    <p className="text-xs text-blue-700 mt-1">
                      The job will be saved with its eligibility criteria
                      and recruiter PIS configuration, then submitted to
                      the placement cell for approval.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-center">
            <button
              onClick={() =>
                setStep((previous) => Math.max(1, previous - 1))
              }
              disabled={step === 1 || isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-50"
            >
              Back
            </button>

            {step < 4 ? (
              <button
                onClick={() => setStep((previous) => previous + 1)}
                disabled={
                  (step === 1 && !title.trim()) ||
                  (step === 2 && !canContinueFromEligibility) ||
                  (step === 3 && totalWeight !== 100)
                }
                className="rounded-md bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={isSubmitting || totalWeight !== 100}
                className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && (
                  <div className="h-4 w-4 rounded-full border-2 border-white border-r-transparent animate-spin" />
                )}

                Submit for Approval
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function JobCreationPage() {
  return (
    <RoleGuard allowedRoles={["company"]}>
      <JobCreationWizard />
    </RoleGuard>
  );
}