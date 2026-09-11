"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../lib/context/AuthContext";
import { RoleGuard } from "../../../../lib/components/RoleGuard";
import { jobService } from "../../../../lib/services/jobService";
import {
  extractRequirementsFromJD,
  type ExtractedRequirement,
  type ProvisionalEligibility,
  type RequirementCategory,
} from "../../../../lib/services/requirementService";
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

const ALL_GRADUATION_YEARS = ["2027", "2028", "2029", "2030", "2031"];

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
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Step 1: Basics
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Step 2: Requirements (extracted & manually adjusted)
  const [requirements, setRequirements] = useState<ExtractedRequirement[]>([]);
  const [provisionalEligibility, setProvisionalEligibility] =
    useState<ProvisionalEligibility | null>(null);
  const [newReqName, setNewReqName] = useState("");
  const [newReqCategory, setNewReqCategory] =
    useState<RequirementCategory>("technical_skill");
  const [newReqMandatory, setNewReqMandatory] = useState(true);

  // Step 3: Hard Eligibility
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [minCgpa, setMinCgpa] = useState("7.0");
  const [noMinCgpa, setNoMinCgpa] = useState(false);
  const [maxBacklogs, setMaxBacklogs] = useState("0");
  const [noMaxBacklogs, setNoMaxBacklogs] = useState(false);
  const [graduationYears, setGraduationYears] = useState<string[]>([
    "2029",
  ]);

  // Step 4: Assessment & PIS Config
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

  const handleSelectAllBranches = () => {
    setSelectedBranches([...AVAILABLE_BRANCHES]);
  };

  const handleClearAllBranches = () => {
    setSelectedBranches([]);
  };

  const toggleYear = (year: string) => {
    setGraduationYears((previous) =>
      previous.includes(year)
        ? previous.filter((item) => item !== year)
        : [...previous, year]
    );
  };

  const handleSelectAllYears = () => {
    setGraduationYears([...ALL_GRADUATION_YEARS]);
  };

  const handleClearAllYears = () => {
    setGraduationYears([]);
  };

  const handleWeightChange = (
    parameter: keyof PISConfiguration["parameters"],
    value: string
  ) => {
    if (value === "") {
      setWeights((previous) => ({
        ...previous,
        [parameter]: 0,
      }));
      return;
    }

    const numericValue = Number.parseInt(value, 10);

    setWeights((previous) => ({
      ...previous,
      [parameter]:
        Number.isFinite(numericValue) && numericValue >= 0
          ? Math.min(100, Math.floor(numericValue))
          : 0,
    }));
  };

  const handleResetWeight = (
    parameter: keyof PISConfiguration["parameters"]
  ) => {
    setWeights((previous) => ({
      ...previous,
      [parameter]: 0,
    }));
  };

  const applyPreset = (
    presetType: "balanced" | "tech" | "academic" | "experience" | "reset"
  ) => {
    if (presetType === "reset") {
      setWeights(createEmptyWeights());
      return;
    }

    const empty = createEmptyWeights();
    if (presetType === "balanced") {
      setWeights({
        ...empty,
        academicPerformance: 25,
        technicalSkills: 35,
        projects: 20,
        internships: 20,
      });
    } else if (presetType === "tech") {
      setWeights({
        ...empty,
        technicalSkills: 50,
        projects: 25,
        domainSkills: 15,
        evidenceQuality: 10,
      });
    } else if (presetType === "academic") {
      setWeights({
        ...empty,
        academicPerformance: 35,
        technicalSkills: 30,
        projects: 20,
        certifications: 15,
      });
    } else if (presetType === "experience") {
      setWeights({
        ...empty,
        technicalSkills: 40,
        internships: 30,
        projects: 20,
        domainSkills: 10,
      });
    }
  };

  const totalWeight = Object.values(weights).reduce(
    (total, weight) => total + (weight ?? 0),
    0
  );

  // Field-level validation states for Step 3
  const isCgpaValid =
    noMinCgpa ||
    (minCgpa.trim() !== "" &&
      Number.isFinite(Number(minCgpa)) &&
      Number(minCgpa) >= 0 &&
      Number(minCgpa) <= 10);

  const isBacklogsValid =
    noMaxBacklogs ||
    (maxBacklogs.trim() !== "" &&
      Number.isInteger(Number(maxBacklogs)) &&
      Number(maxBacklogs) >= 0);

  const isGradYearsValid = graduationYears.length > 0;

  const canContinueFromEligibility =
    isCgpaValid && isBacklogsValid && isGradYearsValid;

  // Requirement Handlers for Step 2
  const handleToggleMandatory = (id: string) => {
    setRequirements((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, mandatory: !req.mandatory } : req
      )
    );
  };

  const handleDeleteRequirement = (id: string) => {
    setRequirements((prev) => prev.filter((req) => req.id !== id));
  };

  const handleAddCustomRequirement = () => {
    if (!newReqName.trim()) return;

    const newReq: ExtractedRequirement = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newReqName.trim(),
      category: newReqCategory,
      mandatory: newReqMandatory,
    };

    setRequirements((prev) => [...prev, newReq]);
    setNewReqName("");
    setNewReqMandatory(true);
  };

  const handleStep1Continue = () => {
    if (!title.trim()) {
      alert("Please enter a job title.");
      return;
    }

    // Deterministically extract requirements
    const extraction = extractRequirementsFromJD(description);
    setRequirements(extraction.requirements);
    setProvisionalEligibility(extraction.provisionalEligibility);

    // Populate provisional suggestions for Step 3 if available
    if (extraction.provisionalEligibility.minimumCGPA !== undefined) {
      setMinCgpa(extraction.provisionalEligibility.minimumCGPA.toString());
      setNoMinCgpa(false);
    }
    if (extraction.provisionalEligibility.maximumBacklogs !== undefined) {
      setMaxBacklogs(extraction.provisionalEligibility.maximumBacklogs.toString());
      setNoMaxBacklogs(false);
    }
    if (
      extraction.provisionalEligibility.branches &&
      extraction.provisionalEligibility.branches.length > 0
    ) {
      setSelectedBranches(extraction.provisionalEligibility.branches);
    }
    if (
      extraction.provisionalEligibility.graduationYears &&
      extraction.provisionalEligibility.graduationYears.length > 0
    ) {
      setGraduationYears(
        extraction.provisionalEligibility.graduationYears.map((y) => y.toString())
      );
    }

    setStep(2);
  };

  const handlePublish = async () => {
    if (isSubmitting) {
      return;
    }

    if (!user) {
      setSubmitError(
        "Authentication required. Please log in as an authorized recruiter."
      );
      return;
    }

    if (user.role !== "company") {
      setSubmitError(
        "Unauthorized: Only company recruiter accounts are permitted to post jobs."
      );
      return;
    }

    if (!title.trim()) {
      setSubmitError("Please enter a valid job title before submitting.");
      return;
    }

    if (!canContinueFromEligibility) {
      setSubmitError(
        "Please ensure all hard eligibility cut-offs (CGPA, backlogs, batches) are properly configured."
      );
      return;
    }

    if (graduationYears.length === 0) {
      setSubmitError(
        "Please select at least one eligible graduation batch."
      );
      return;
    }

    if (totalWeight !== 100) {
      setSubmitError(
        `PIS parameter weights must total exactly 100%. Current total is ${totalWeight}%.`
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const jobId = await jobService.createJob({
        companyId: user.uid,
        recruiterId: user.uid,
        title: title.trim(),
        description: description.trim(),
        status: "draft",
        assessmentAccessModel: accessModel,
      });

      // Filter and de-duplicate requirements
      const technicalSkills = Array.from(
        new Set(
          requirements
            .filter((r) => r.category === "technical_skill")
            .map((r) => r.name.trim())
            .filter(Boolean)
        )
      );

      const domainSkills = Array.from(
        new Set(
          requirements
            .filter((r) => r.category === "domain_skill")
            .map((r) => r.name.trim())
            .filter(Boolean)
        )
      );

      const preferredQualifications = Array.from(
        new Set(
          requirements
            .filter((r) => r.category === "preferred_qualification")
            .map((r) => r.name.trim())
            .filter(Boolean)
        )
      );

      await jobService.updateJobRequirements(jobId, {
        hardEligibility: {
          branches: selectedBranches,
          graduationYears: graduationYears
            .map((year) => Number.parseInt(year, 10))
            .filter((year) => Number.isInteger(year)),
          minimumCGPA: noMinCgpa ? null : Number.parseFloat(minCgpa),
          maximumBacklogs: noMaxBacklogs ? null : Number.parseInt(maxBacklogs, 10),
        },
        competencies: {
          technicalSkills,
          domainSkills,
          preferredQualifications,
        },
        confirmedByCompany: true,
      });

      await jobService.updateJobPISConfig(jobId, weights);

      await jobService.requestJobApproval(jobId);

      router.push("/recruiter/jobs");
    } catch (error) {
      console.error("Failed to create job:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "The job could not be submitted for approval. Please check your connection and try again."
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
        {/* Step Progress Bar */}
        <div className="mb-8">
          <div className="relative flex items-center justify-between">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded" />

            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-900 -z-10 rounded transition-all duration-300"
              style={{
                width: `${((step - 1) / 4) * 100}%`,
              }}
            />

            {[1, 2, 3, 4, 5].map((item) => (
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
            <span>Requirements</span>
            <span>Eligibility</span>
            <span>PIS Config</span>
            <span>Submit</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6 sm:p-8">
          {/* STEP 1: Basics & JD */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Job Details & JD
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Provide the title and description. PlaceKaro will extract candidate requirements for your review.
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
                  placeholder="Describe the role, responsibilities, required technical skills, and preferred qualifications..."
                  className="mt-1 block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Requirement Review (NEW) */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Requirement Review
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Review the competencies extracted from your job description. You can add new requirements, delete unwanted items, and toggle between Mandatory and Preferred.
                </p>
              </div>

              {requirements.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-amber-600 text-lg">⚠️</span>
                    <div>
                      <h4 className="text-sm font-semibold text-amber-900">
                        No competencies detected
                      </h4>
                      <p className="text-xs text-amber-800 mt-1">
                        No technical skills or qualifications were automatically recognized from the text. You can add requirements manually below, or proceed if this position does not require specific competencies.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
                    <span>Competency / Requirement</span>
                    <span>Classification</span>
                  </div>

                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-slate-50/50 overflow-hidden">
                    {requirements.map((req) => (
                      <div
                        key={req.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                              req.category === "technical_skill"
                                ? "bg-indigo-50 text-indigo-700 ring-indigo-600/20"
                                : req.category === "domain_skill"
                                ? "bg-purple-50 text-purple-700 ring-purple-600/20"
                                : "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                            }`}
                          >
                            {req.category === "technical_skill"
                              ? "Technical Skill"
                              : req.category === "domain_skill"
                              ? "Domain"
                              : "Qualification"}
                          </span>

                          <span className="text-sm font-semibold text-slate-900">
                            {req.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleToggleMandatory(req.id)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                              req.mandatory
                                ? "bg-rose-100 text-rose-800 hover:bg-rose-200"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            {req.mandatory ? "★ Mandatory" : "☆ Preferred"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteRequirement(req.id)}
                            className="rounded-md p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                            title="Remove requirement"
                          >
                            <span className="text-sm">✕</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Custom Requirement Form */}
              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  + Add Requirement Manually
                </h3>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={newReqName}
                    onChange={(e) => setNewReqName(e.target.value)}
                    placeholder="Requirement name (e.g. GraphQL, AWS certification)"
                    className="flex-1 rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomRequirement();
                      }
                    }}
                  />

                  <select
                    value={newReqCategory}
                    onChange={(e) =>
                      setNewReqCategory(e.target.value as RequirementCategory)
                    }
                    className="rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6"
                  >
                    <option value="technical_skill">Technical Skill</option>
                    <option value="domain_skill">Domain Knowledge</option>
                    <option value="preferred_qualification">
                      Preferred Qualification
                    </option>
                  </select>

                  <button
                    type="button"
                    onClick={handleAddCustomRequirement}
                    disabled={!newReqName.trim()}
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Hard Eligibility */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Hard Eligibility
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Set strict cut-offs. Students failing these criteria will be filtered out.
                </p>
              </div>

              {provisionalEligibility &&
                (provisionalEligibility.minimumCGPA !== undefined ||
                  provisionalEligibility.maximumBacklogs !== undefined ||
                  (provisionalEligibility.branches &&
                    provisionalEligibility.branches.length > 0) ||
                  (provisionalEligibility.graduationYears &&
                    provisionalEligibility.graduationYears.length > 0)) && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-2.5 text-xs text-blue-800 flex items-center gap-2">
                    <span>💡</span>
                    <span>
                      Criteria suggestions have been pre-filled from your JD. Please review and adjust as needed.
                    </span>
                  </div>
                )}

              {/* Branches Section */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Allowed Branches
                    </label>
                    {provisionalEligibility?.branches &&
                      provisionalEligibility.branches.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          ✨ Suggested from JD
                        </span>
                      )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAllBranches}
                      className="font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleClearAllBranches}
                      className="font-medium text-slate-500 hover:text-slate-700"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-2.5">
                  Select branches eligible for this role. If none are selected, all branches are eligible.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABLE_BRANCHES.map((branch) => (
                    <label
                      key={branch}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedBranches.includes(branch)
                          ? "bg-slate-50 border-slate-900"
                          : "bg-white border-slate-200 hover:border-slate-300"
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

              {/* CGPA and Backlogs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Minimum CGPA
                      </label>
                      {provisionalEligibility?.minimumCGPA !== undefined && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          ✨ Suggested: {provisionalEligibility.minimumCGPA}
                        </span>
                      )}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noMinCgpa}
                      onChange={(e) => setNoMinCgpa(e.target.checked)}
                      className="h-4 w-4 text-slate-900 focus:ring-slate-900 border-slate-300 rounded"
                    />
                    <span className="text-xs font-medium text-slate-600">
                      No minimum CGPA required
                    </span>
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    disabled={noMinCgpa}
                    value={noMinCgpa ? "" : minCgpa}
                    onChange={(event) => setMinCgpa(event.target.value)}
                    placeholder={noMinCgpa ? "No minimum required" : "e.g. 7.0"}
                    className={`block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6 ${
                      noMinCgpa
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : !isCgpaValid
                        ? "ring-rose-300 focus:ring-rose-500"
                        : ""
                    }`}
                  />

                  {!noMinCgpa && !isCgpaValid && (
                    <p className="text-xs text-rose-600 mt-1">
                      Please enter a valid CGPA between 0.0 and 10.0.
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Maximum Backlogs
                      </label>
                      {provisionalEligibility?.maximumBacklogs !== undefined && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          ✨ Suggested: {provisionalEligibility.maximumBacklogs}
                        </span>
                      )}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noMaxBacklogs}
                      onChange={(e) => setNoMaxBacklogs(e.target.checked)}
                      className="h-4 w-4 text-slate-900 focus:ring-slate-900 border-slate-300 rounded"
                    />
                    <span className="text-xs font-medium text-slate-600">
                      No backlog limit
                    </span>
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    disabled={noMaxBacklogs}
                    value={noMaxBacklogs ? "" : maxBacklogs}
                    onChange={(event) => setMaxBacklogs(event.target.value)}
                    placeholder={noMaxBacklogs ? "No limit" : "e.g. 0"}
                    className={`block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6 ${
                      noMaxBacklogs
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : !isBacklogsValid
                        ? "ring-rose-300 focus:ring-rose-500"
                        : ""
                    }`}
                  />

                  {!noMaxBacklogs && !isBacklogsValid && (
                    <p className="text-xs text-rose-600 mt-1">
                      Please enter a non-negative whole number (e.g. 0, 1, 2).
                    </p>
                  )}
                  {!noMaxBacklogs && isBacklogsValid && maxBacklogs === "0" && (
                    <p className="text-xs text-slate-500 mt-1">
                      0 = Zero active backlogs allowed.
                    </p>
                  )}
                </div>
              </div>

              {/* Graduation Years Section */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Eligible Graduation Batches
                    </label>
                    {provisionalEligibility?.graduationYears &&
                      provisionalEligibility.graduationYears.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          ✨ Suggested: {provisionalEligibility.graduationYears.join(", ")}
                        </span>
                      )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAllYears}
                      className="font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleClearAllYears}
                      className="font-medium text-slate-500 hover:text-slate-700"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-2.5">
                  Select the student cohorts eligible to apply for this position.
                </p>

                <div className="flex flex-wrap gap-2">
                  {ALL_GRADUATION_YEARS.map((year) => (
                    <label
                      key={year}
                      className={`flex items-center gap-2 p-2 px-4 rounded-full border cursor-pointer transition-colors ${
                        graduationYears.includes(year)
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={graduationYears.includes(year)}
                        onChange={() => toggleYear(year)}
                      />

                      <span className="text-sm font-medium">
                        {year} Batch
                      </span>
                    </label>
                  ))}
                </div>

                {!isGradYearsValid && (
                  <p className="text-xs text-rose-600 mt-2">
                    Please select at least one eligible graduation batch.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: PIS Configuration */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Placement Intelligence Score (PIS)
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Assign recruiter weightage across student parameters. Selected
                  weights must be integers and total exactly 100%.
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      PIS Weightage Configuration
                    </h3>

                    <p className="text-xs text-slate-500">
                      Set an integer weight (0–100%) for each parameter. Total must equal 100%.
                    </p>
                  </div>

                  {/* Total Weight Status Badge */}
                  <div className="flex items-center gap-2">
                    {totalWeight === 100 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Total: 100% (Balanced)
                      </span>
                    ) : totalWeight < 100 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Total: {totalWeight}% ({100 - totalWeight}% remaining)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        Total: {totalWeight}% ({totalWeight - 100}% over limit)
                      </span>
                    )}
                  </div>
                </div>

                {/* Visual Progress Bar for Total Weight */}
                <div className="mb-4">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        totalWeight === 100
                          ? "bg-emerald-500"
                          : totalWeight < 100
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                      style={{
                        width: `${Math.min(100, totalWeight)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Optional Recruiter Presets */}
                <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
                    Presets:
                  </span>
                  <button
                    type="button"
                    onClick={() => applyPreset("balanced")}
                    className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-100"
                  >
                    Balanced
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("tech")}
                    className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-100"
                  >
                    Technical Focus
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("academic")}
                    className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-100"
                  >
                    Fresher / Academic
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("experience")}
                    className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-100"
                  >
                    Industry Experience
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("reset")}
                    className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-100 ml-auto"
                  >
                    Reset All
                  </button>
                </div>

                {/* Parameter Sliders with Companion Number Inputs */}
                <div className="space-y-3">
                  {PIS_PARAMETERS.map(({ key, label }) => {
                    const weight = weights[key] ?? 0;
                    const isActive = weight > 0;

                    return (
                      <div
                        key={key}
                        className={`p-3.5 rounded-lg border transition-all ${
                          isActive
                            ? "bg-slate-50/80 border-slate-900 shadow-xs ring-1 ring-slate-900/10"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm ${
                                isActive
                                  ? "font-semibold text-slate-900"
                                  : "font-medium text-slate-700"
                              }`}
                            >
                              {label}
                            </span>
                            {isActive ? (
                              <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                                Active · {weight}%
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                                0% (Inactive)
                              </span>
                            )}
                            {isActive && (
                              <button
                                type="button"
                                onClick={() => handleResetWeight(key)}
                                className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors ml-1"
                                title="Set weight to 0"
                              >
                                ✕ Clear
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={weight}
                              onChange={(event) =>
                                handleWeightChange(key, event.target.value)
                              }
                              className={`w-16 rounded-md border-0 py-1 text-right text-sm font-semibold sm:leading-6 ring-1 ring-inset focus:ring-2 focus:ring-inset ${
                                isActive
                                  ? "text-slate-900 ring-slate-400 focus:ring-slate-900 bg-white"
                                  : "text-slate-500 ring-slate-200 focus:ring-slate-900 bg-slate-50"
                              }`}
                            />
                            <span className="text-xs font-medium text-slate-500">%</span>
                          </div>
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
                          className="mt-2.5 w-full accent-slate-900 h-2 bg-slate-200 rounded-lg cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>

                {totalWeight === 100 ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2 mt-4">
                    <span>✓</span>
                    <span>
                      Weights total exactly 100%. You can proceed to the Confirmation step.
                    </span>
                  </div>
                ) : totalWeight < 100 ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-center gap-2 mt-4">
                    <span>⚠️</span>
                    <span>
                      Weights must total exactly 100% to proceed. You are currently at{" "}
                      <strong>{totalWeight}%</strong> ({100 - totalWeight}% remaining).
                    </span>
                  </div>
                ) : (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2 mt-4">
                    <span>⚠️</span>
                    <span>
                      Weights exceed 100% by <strong>{totalWeight - 100}%</strong>. Please reduce weights to proceed.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Confirm & Submit */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Confirm & Submit
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Review the job details, confirmed competencies, eligibility criteria, and recruiter PIS configuration before submitting to the placement cell for approval.
                </p>
              </div>

              {submitError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-start gap-3">
                  <span className="text-rose-600 font-bold text-base">⚠️</span>
                  <div>
                    <h4 className="font-semibold text-rose-900">Submission Error</h4>
                    <p className="text-xs text-rose-700 mt-0.5">{submitError}</p>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 rounded-lg p-5 ring-1 ring-inset ring-slate-200 space-y-6">
                {/* 1. Job Basics */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Job Title
                  </h3>

                  <p className="text-lg font-bold text-slate-900 mt-1">
                    {title || "Untitled Job"}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Job Description
                  </h3>

                  <div className="text-sm text-slate-700 whitespace-pre-wrap mt-1 max-h-48 overflow-y-auto rounded-lg bg-white p-3.5 border border-slate-200 leading-relaxed">
                    {description || "No description provided."}
                  </div>
                </div>

                {/* 2. Confirmed Competencies Summary */}
                <div className="border-t border-slate-200 pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Confirmed Competencies ({requirements.length})
                    </h3>
                    {requirements.length > 0 && (
                      <span className="text-xs text-slate-500">
                        {requirements.filter((r) => r.mandatory).length} Mandatory,{" "}
                        {requirements.filter((r) => !r.mandatory).length} Preferred
                      </span>
                    )}
                  </div>

                  {requirements.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      None configured
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {/* Technical Skills */}
                      {requirements.some((r) => r.category === "technical_skill") && (
                        <div>
                          <p className="text-[11px] font-medium text-slate-500 mb-1.5">
                            Technical Skills:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {requirements
                              .filter((r) => r.category === "technical_skill")
                              .map((req) => (
                                <span
                                  key={req.id}
                                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200"
                                >
                                  <span>{req.name}</span>
                                  <span
                                    className={`text-[10px] font-bold ${
                                      req.mandatory
                                        ? "text-rose-700 font-semibold"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    ({req.mandatory ? "Mandatory" : "Preferred"})
                                  </span>
                                </span>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Domain Skills */}
                      {requirements.some((r) => r.category === "domain_skill") && (
                        <div>
                          <p className="text-[11px] font-medium text-slate-500 mb-1.5">
                            Domain Knowledge:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {requirements
                              .filter((r) => r.category === "domain_skill")
                              .map((req) => (
                                <span
                                  key={req.id}
                                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200"
                                >
                                  <span>{req.name}</span>
                                  <span
                                    className={`text-[10px] font-bold ${
                                      req.mandatory
                                        ? "text-rose-700 font-semibold"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    ({req.mandatory ? "Mandatory" : "Preferred"})
                                  </span>
                                </span>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Preferred Qualifications */}
                      {requirements.some(
                        (r) => r.category === "preferred_qualification"
                      ) && (
                        <div>
                          <p className="text-[11px] font-medium text-slate-500 mb-1.5">
                            Preferred Qualifications:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {requirements
                              .filter(
                                (r) => r.category === "preferred_qualification"
                              )
                              .map((req) => (
                                <span
                                  key={req.id}
                                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                                >
                                  <span>{req.name}</span>
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    ({req.mandatory ? "Mandatory" : "Preferred"})
                                  </span>
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Hard Eligibility Summary */}
                <div className="border-t border-slate-200 pt-5">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Hard Eligibility Cut-offs
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                      <h4 className="text-xs font-medium text-slate-500">
                        Branches
                      </h4>

                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        {selectedBranches.length === 0
                          ? "All branches eligible"
                          : selectedBranches.join(", ")}
                      </p>
                      {selectedBranches.length === 0 && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          No branch restrictions
                        </p>
                      )}
                    </div>

                    <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                      <h4 className="text-xs font-medium text-slate-500">
                        Minimum CGPA
                      </h4>

                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        {noMinCgpa ? "No minimum required" : `CGPA ≥ ${minCgpa}`}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {noMinCgpa ? "Saved as null" : "Strict cut-off"}
                      </p>
                    </div>

                    <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                      <h4 className="text-xs font-medium text-slate-500">
                        Maximum Backlogs
                      </h4>

                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        {noMaxBacklogs
                          ? "No backlog restriction"
                          : maxBacklogs === "0"
                          ? "0 (Zero active backlogs)"
                          : `Max ${maxBacklogs} backlogs`}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {noMaxBacklogs ? "Saved as null" : "Strict cut-off"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 bg-white p-3.5 rounded-lg border border-slate-200">
                    <h4 className="text-xs font-medium text-slate-500">
                      Eligible Graduation Batches
                    </h4>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {graduationYears.length === 0 ? (
                        <p className="text-xs text-rose-600 font-medium">
                          No batches selected
                        </p>
                      ) : (
                        graduationYears.map((year) => (
                          <span
                            key={year}
                            className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-800"
                          >
                            {year} Batch
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Assessment Access Model */}
                <div className="border-t border-slate-200 pt-5">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Assessment Access Model
                  </h3>

                  <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                    <p className="text-sm font-semibold text-slate-900 capitalize">
                      {accessModel === "all_eligible"
                        ? "All Eligible"
                        : accessModel === "role_fit"
                        ? "Role Fit"
                        : "Custom"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {accessModel === "all_eligible"
                        ? "Automatically invites all candidates who meet the hard eligibility criteria."
                        : accessModel === "role_fit"
                        ? "Access is granted based on recruiter-defined role fit scores."
                        : "Manual invitation control — invite candidates individually."}
                    </p>
                  </div>
                </div>

                {/* 5. Recruiter PIS Configuration */}
                <div className="border-t border-slate-200 pt-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Selected PIS Parameters & Weight Distribution
                    </h3>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Total: {totalWeight}% (Balanced)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {PIS_PARAMETERS.filter(
                      ({ key }) => (weights[key] ?? 0) > 0
                    ).map(({ key, label }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-2.5 rounded-md bg-white border border-slate-200 text-xs"
                      >
                        <span className="font-medium text-slate-700">{label}</span>
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {weights[key]}%
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2.5 italic">
                    PlaceKaro evaluates candidates deterministically using verified academic records, skill badges, and project evidence against these assigned weights.
                  </p>
                </div>
              </div>

              {/* Approval workflow notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-blue-600 mt-0.5 text-base">ℹ</span>

                  <div>
                    <h4 className="text-sm font-semibold text-blue-900">
                      Placement Cell Approval Required
                    </h4>

                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                      Submitting this job will save all confirmed competencies, hard eligibility cut-offs, and PIS weightage. The job will be set to <strong>Pending Approval</strong> status and routed to your college&apos;s Placement Cell for official review and publishing to students.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-center">
            <button
              onClick={() =>
                setStep((previous) => Math.max(1, previous - 1))
              }
              disabled={step === 1 || isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>

            {step === 1 ? (
              <button
                onClick={handleStep1Continue}
                disabled={!title.trim()}
                className="rounded-md bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step
              </button>
            ) : step < 5 ? (
              <button
                onClick={() => setStep((previous) => previous + 1)}
                disabled={
                  (step === 3 && !canContinueFromEligibility) ||
                  (step === 4 && totalWeight !== 100)
                }
                className="rounded-md bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={
                  isSubmitting ||
                  totalWeight !== 100 ||
                  !canContinueFromEligibility ||
                  !title.trim()
                }
                className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting && (
                  <div className="h-4 w-4 rounded-full border-2 border-white border-r-transparent animate-spin" />
                )}

                {isSubmitting ? "Submitting for Approval..." : "Submit for Approval"}
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