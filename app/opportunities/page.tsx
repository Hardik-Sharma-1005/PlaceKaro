"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../lib/context/AuthContext";
import { RoleGuard } from "../../lib/components/RoleGuard";
import { StudentSidebar, StudentMobileNav } from "../../lib/components/StudentNavigation";
import {
  get,
  ref,
  query,
  orderByChild,
  equalTo,
  set,
  push,
} from "firebase/database";
import { database } from "../../lib/firebase/database";
import type {
  Job,
  Company,
  JobRequirements,
  Skill,
  StudentProfile,
  Application,
} from "../../types/database";

interface EnrichedJob extends Job {
  companyName?: string;
  companyWebsite?: string;
  requirements?: JobRequirements;
}

function OpportunitiesContent() {
  const { user } = useAuth();

  // State
  const [jobs, setJobs] = useState<EnrichedJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<EnrichedJob | null>(null);
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [userProfile, setUserProfile] = useState<StudentProfile | null>(null);
  const [applications, setApplications] = useState<Record<string, Application>>({});
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "eligible" | "applied">("all");

  // Load Initial Data
  useEffect(() => {
    async function loadData() {
      if (!user?.uid) return;

      try {
        setLoading(true);

        // 1. Fetch Student Profile
        const profileSnap = await get(ref(database, `studentProfiles/${user.uid}`));
        if (profileSnap.exists()) {
          setUserProfile(profileSnap.val() as StudentProfile);
        }

        // 2. Fetch Student Skills
        const skillsQuery = query(
          ref(database, "skills"),
          orderByChild("studentId"),
          equalTo(user.uid)
        );
        const skillsSnap = await get(skillsQuery);
        if (skillsSnap.exists()) {
          const skillsData = skillsSnap.val() as Record<string, Skill>;
          setUserSkills(Object.values(skillsData));
        }

        // 3. Fetch Student Applications
        const appQuery = query(
          ref(database, "applications"),
          orderByChild("studentId"),
          equalTo(user.uid)
        );
        const appSnap = await get(appQuery);
        let userApps: Record<string, Application> = {};
        if (appSnap.exists()) {
          const rawApps = appSnap.val() as Record<string, Application>;
          Object.values(rawApps).forEach((app) => {
            userApps[app.jobId] = app;
          });
          setApplications(userApps);
        }

        // 4. Fetch Companies for Lookup
        let companiesData: Record<string, Company> = {};
        try {
          const companiesSnap = await get(ref(database, "companies"));
          if (companiesSnap.exists()) {
            companiesData = companiesSnap.val() as Record<string, Company>;
          }
        } catch (err) {
          console.warn("Could not fetch companies collection:", err);
        }

        // 5. Fetch Job Requirements for Lookup
        let reqData: Record<string, JobRequirements> = {};
        try {
          const reqSnap = await get(ref(database, "jobRequirements"));
          if (reqSnap.exists()) {
            reqData = reqSnap.val() as Record<string, JobRequirements>;
          }
        } catch (err) {
          console.warn("Could not fetch jobRequirements collection:", err);
        }

        // 6. Fetch Published Jobs
        const jobsQuery = query(
          ref(database, "jobs"),
          orderByChild("status"),
          equalTo("published")
        );
        const jobsSnap = await get(jobsQuery);

        if (jobsSnap.exists()) {
          const rawJobs = jobsSnap.val() as Record<string, Job>;
          const enriched: EnrichedJob[] = Object.values(rawJobs).map((job) => {
            const company = companiesData[job.companyId];
            // Find requirement by jobId or key
            let req = reqData[job.id];
            if (!req) {
              const matchedReqKey = Object.keys(reqData).find(
                (k) => reqData[k].jobId === job.id
              );
              if (matchedReqKey) req = reqData[matchedReqKey];
            }

            return {
              ...job,
              companyName: company?.name ?? "Partner Organization",
              companyWebsite: company?.website,
              requirements: req,
            };
          });

          // Sort by creation time desc
          enriched.sort((a, b) => b.createdAt - a.createdAt);
          setJobs(enriched);
          if (enriched.length > 0) {
            setSelectedJob(enriched[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load opportunities:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user?.uid]);

  // Skill comparison & Match calculation
  const getJobSkillMatch = (job: EnrichedJob) => {
    const requiredSkills = job.requirements?.competencies?.technicalSkills || [];
    if (requiredSkills.length === 0) {
      return { matchPercentage: 100, matched: [], missing: [] };
    }

    const userSkillNames = userSkills.map((s) => s.name.toLowerCase().trim());
    const matched: string[] = [];
    const missing: string[] = [];

    requiredSkills.forEach((skill) => {
      const isFound = userSkillNames.some(
        (us) => us.includes(skill.toLowerCase().trim()) || skill.toLowerCase().trim().includes(us)
      );
      if (isFound) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    });

    const matchPercentage = Math.round((matched.length / requiredSkills.length) * 100);
    return { matchPercentage, matched, missing };
  };

  // Eligibility Check
  const checkEligibility = (job: EnrichedJob) => {
    if (!job.requirements?.hardEligibility || !userProfile) {
      return { isEligible: true, reasons: [] };
    }

    const { minimumCGPA, maximumBacklogs, branches, graduationYears } =
      job.requirements.hardEligibility;
    const reasons: string[] = [];

    if (minimumCGPA !== undefined && minimumCGPA !== null && userProfile.cgpa < minimumCGPA) {
      reasons.push(`Minimum CGPA required is ${minimumCGPA} (Your CGPA: ${userProfile.cgpa})`);
    }

    if (
      maximumBacklogs !== undefined &&
      maximumBacklogs !== null &&
      userProfile.backlogCount > maximumBacklogs
    ) {
      reasons.push(
        `Maximum backlogs allowed: ${maximumBacklogs} (Your backlogs: ${userProfile.backlogCount})`
      );
    }

    if (
      branches &&
      branches.length > 0 &&
      !branches.some((b) => b.toLowerCase().trim() === userProfile.branch.toLowerCase().trim())
    ) {
      reasons.push(`Eligible branches: ${branches.join(", ")}`);
    }

    if (
      graduationYears &&
      graduationYears.length > 0 &&
      !graduationYears.includes(userProfile.graduationYear)
    ) {
      reasons.push(`Eligible graduation years: ${graduationYears.join(", ")}`);
    }

    return {
      isEligible: reasons.length === 0,
      reasons,
    };
  };

  // Handle Application Submit
  const handleApply = async (job: EnrichedJob) => {
    if (!user?.uid) return;

    setApplying(true);
    setApplyError(null);
    setApplySuccess(null);

    try {
      const appRef = push(ref(database, "applications"));
      const newApp: Application = {
        id: appRef.key || `app-${Date.now()}`,
        studentId: user.uid,
        jobId: job.id,
        status: "applied",
        appliedAt: Date.now(),
        assessmentUnlocked: job.assessmentAccessModel === "all_eligible",
      };

      await set(appRef, newApp);

      // Create notification
      const notifRef = push(ref(database, "notifications"));
      await set(notifRef, {
        id: notifRef.key || `notif-${Date.now()}`,
        userId: user.uid,
        type: "application_update",
        title: `Applied to ${job.title}`,
        message: `Your application for ${job.title} at ${job.companyName} has been submitted successfully.`,
        relatedJobId: job.id,
        isRead: false,
        createdAt: Date.now(),
      });

      setApplications((prev) => ({
        ...prev,
        [job.id]: newApp,
      }));

      setApplySuccess(`Successfully applied to ${job.title}!`);
    } catch (err) {
      console.error("Error submitting application:", err);
      setApplyError("Failed to submit application. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Search
      const matchesSearch =
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.companyName && job.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.requirements?.competencies?.technicalSkills || []).some((s) =>
          s.toLowerCase().includes(searchQuery.toLowerCase())
        );

      if (!matchesSearch) return false;

      // Status filter
      if (filterType === "applied") {
        return !!applications[job.id];
      }
      if (filterType === "eligible") {
        return checkEligibility(job).isEligible;
      }

      return true;
    });
  }, [jobs, searchQuery, filterType, applications, userProfile]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        {/* Navigation Sidebar */}
        <StudentSidebar />

        {/* Main Content Area */}
        <main className="min-w-0 flex-1">
          {/* Header */}
          <header className="border-b border-slate-200 bg-white px-5 sm:px-8">
            <div className="flex h-20 items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Student workspace</p>
                <h1 className="text-lg font-semibold text-slate-950">
                  Opportunities & Placements
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-slate-900">
                    {user?.displayName ?? "Student"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {user?.email ?? "Student account"}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {(user?.displayName?.charAt(0) ?? "S").toUpperCase()}
                </div>
              </div>
            </div>

            <StudentMobileNav />
          </header>

          {/* Page Body */}
          <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
            {/* Search & Filter Top bar */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-lg">
                <input
                  type="text"
                  placeholder="Search by role, company name, skill (e.g. Python, React)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm placeholder-slate-400 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  View:
                </span>
                <button
                  onClick={() => setFilterType("all")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    filterType === "all"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  All ({jobs.length})
                </button>
                <button
                  onClick={() => setFilterType("eligible")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    filterType === "eligible"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Eligible
                </button>
                <button
                  onClick={() => setFilterType("applied")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    filterType === "applied"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Applied ({Object.keys(applications).length})
                </button>
              </div>
            </div>

            {/* Alert Messages */}
            {applySuccess && (
              <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <span>🎉 {applySuccess}</span>
                <button
                  onClick={() => setApplySuccess(null)}
                  className="text-xs font-bold hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}
            {applyError && (
              <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <span>⚠️ {applyError}</span>
                <button
                  onClick={() => setApplyError(null)}
                  className="text-xs font-bold hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Two Column Opportunities Layout */}
            {loading ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                  <p className="text-sm text-slate-500 font-medium">Loading opportunities...</p>
                </div>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  📁
                </div>
                <h3 className="mt-3 text-base font-semibold text-slate-900">
                  No opportunities match your filter
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Try adjusting your search query or switching to &ldquo;All&rdquo; opportunities.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterType("all");
                  }}
                  className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left Column: Job Cards List (5 cols) */}
                <div className="lg:col-span-5 space-y-3">
                  {filteredJobs.map((job) => {
                    const isSelected = selectedJob?.id === job.id;
                    const isApplied = !!applications[job.id];
                    const { matchPercentage } = getJobSkillMatch(job);
                    const { isEligible } = checkEligibility(job);

                    return (
                      <div
                        key={job.id}
                        onClick={() => setSelectedJob(job)}
                        className={`cursor-pointer rounded-2xl border p-5 transition-all shadow-sm ${
                          isSelected
                            ? "border-slate-900 bg-white ring-2 ring-slate-900/5 shadow-md"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              {job.companyName}
                            </span>
                            <h3 className="mt-0.5 text-base font-bold text-slate-950">
                              {job.title}
                            </h3>
                          </div>

                          {isApplied ? (
                            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                              Applied ✓
                            </span>
                          ) : isEligible ? (
                            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                              Eligible
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                              Check Criteria
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {job.description}
                        </p>

                        {/* Skill match badge */}
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-medium">Skill Match:</span>
                            <span
                              className={`font-bold ${
                                matchPercentage >= 70
                                  ? "text-emerald-700"
                                  : matchPercentage >= 40
                                  ? "text-amber-600"
                                  : "text-slate-600"
                              }`}
                            >
                              {matchPercentage}%
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Column: Detailed Job View (7 cols) */}
                {selectedJob && (
                  <div className="lg:col-span-7">
                    <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      {/* Job Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-200 pb-6">
                        <div>
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {selectedJob.companyName}
                          </span>
                          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                            {selectedJob.title}
                          </h2>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span>Status: Open</span>
                            <span>•</span>
                            <span>
                              Assessment:{" "}
                              {selectedJob.assessmentAccessModel === "all_eligible"
                                ? "Instant (All Eligible)"
                                : "Role Fit Shortlist"}
                            </span>
                          </div>
                        </div>

                        {/* Action CTA Button */}
                        <div className="shrink-0">
                          {applications[selectedJob.id] ? (
                            <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-center">
                              <span className="text-xs font-bold text-blue-800">
                                Application Submitted
                              </span>
                              <p className="text-[10px] text-blue-600 mt-0.5">
                                Status: {applications[selectedJob.id].status}
                              </p>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleApply(selectedJob)}
                              disabled={applying}
                              className="w-full sm:w-auto rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition disabled:opacity-50"
                            >
                              {applying ? "Submitting..." : "Apply with Profile"}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Job Overview */}
                      <div className="py-6 border-b border-slate-200">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Role Overview
                        </h4>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                          {selectedJob.description}
                        </p>
                      </div>

                      {/* Intelligent Skills Match Section */}
                      <div className="py-6 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Skill Match Intelligence
                          </h4>
                          {(() => {
                            const { matchPercentage } = getJobSkillMatch(selectedJob);
                            return (
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                  matchPercentage >= 70
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {matchPercentage}% Match
                              </span>
                            );
                          })()}
                        </div>

                        {(() => {
                          const { matched, missing } = getJobSkillMatch(selectedJob);
                          return (
                            <div className="mt-4 space-y-3">
                              {matched.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                                    ✓ Verified Skills in Your Profile:
                                  </span>
                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {matched.map((skill) => (
                                      <span
                                        key={skill}
                                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {missing.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-amber-700 flex items-center gap-1">
                                    ⚠️ Required Skills to Add or Learn:
                                  </span>
                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {missing.map((skill) => (
                                      <span
                                        key={skill}
                                        className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {matched.length === 0 && missing.length === 0 && (
                                <p className="text-xs text-slate-500">
                                  No specific skill requirements listed for this role.
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Hard Eligibility Checklist */}
                      <div className="pt-6">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Eligibility Criteria
                        </h4>

                        {(() => {
                          const { isEligible, reasons } = checkEligibility(selectedJob);
                          const req = selectedJob.requirements?.hardEligibility;

                          return (
                            <div className="mt-3 space-y-2.5">
                              {req ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                                    <span className="text-slate-400 font-medium">Min CGPA:</span>
                                    <p className="mt-0.5 font-bold text-slate-800">
                                      {req.minimumCGPA ?? "None"}
                                    </p>
                                  </div>
                                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                                    <span className="text-slate-400 font-medium">Max Backlogs:</span>
                                    <p className="mt-0.5 font-bold text-slate-800">
                                      {req.maximumBacklogs ?? "None"}
                                    </p>
                                  </div>
                                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                                    <span className="text-slate-400 font-medium">Eligible Batch:</span>
                                    <p className="mt-0.5 font-bold text-slate-800">
                                      {req.graduationYears?.join(", ") ?? "All"}
                                    </p>
                                  </div>
                                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                                    <span className="text-slate-400 font-medium">Branches:</span>
                                    <p className="mt-0.5 font-bold text-slate-800 truncate">
                                      {req.branches?.join(", ") ?? "All Branches"}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500">
                                  Open to all registered candidates.
                                </p>
                              )}

                              {!isEligible && (
                                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
                                  <p className="font-bold">Eligibility Notice:</p>
                                  {reasons.map((reason, idx) => (
                                    <p key={idx}>• {reason}</p>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
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
