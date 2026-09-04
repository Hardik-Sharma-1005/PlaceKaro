"use client";

import { useEffect, useState } from "react";
import { get, ref } from "firebase/database";
import { database } from "../../../lib/firebase/database";
import type { Job, JobRequirements } from "../../../types/database";
import Link from "next/link";

interface EnrichedJob extends Job {
  companyName?: string;
  applicantCount: number;
  requirements?: JobRequirements;
}

const FALLBACK_JOBS: EnrichedJob[] = [
  {
    id: "job-001",
    companyId: "co-1",
    recruiterId: "rec-1",
    title: "Associate Software Engineer",
    description: "Looking for strong CS fundamentals, Python & React experience. CGPA ≥ 7.5.",
    status: "published",
    assessmentAccessModel: "all_eligible",
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now(),
    companyName: "Infosys Technologies",
    applicantCount: 18,
    requirements: {
      jobId: "job-001",
      hardEligibility: { branches: ["CSE", "IT"], minimumCGPA: 7.5, maximumBacklogs: 0 },
      competencies: { technicalSkills: ["Python", "React", "SQL"] },
      confirmedByCompany: true,
    },
  },
  {
    id: "job-002",
    companyId: "co-2",
    recruiterId: "rec-2",
    title: "Data Analyst Intern → FTE",
    description: "Data-driven problem solving, SQL, Python, visualization. Open to all branches.",
    status: "published",
    assessmentAccessModel: "role_fit",
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now(),
    companyName: "TCS Digital",
    applicantCount: 31,
    requirements: {
      jobId: "job-002",
      hardEligibility: { minimumCGPA: 7.0, maximumBacklogs: 1 },
      competencies: { technicalSkills: ["SQL", "Python", "Tableau"] },
      confirmedByCompany: true,
    },
  },
  {
    id: "job-003",
    companyId: "co-3",
    recruiterId: "rec-3",
    title: "Systems Engineer",
    description: "Core engineering role. Strong networking, OS and problem-solving fundamentals required.",
    status: "closed",
    assessmentAccessModel: "all_eligible",
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now(),
    companyName: "Wipro Limited",
    applicantCount: 42,
    requirements: {
      jobId: "job-003",
      hardEligibility: { minimumCGPA: 6.5, maximumBacklogs: 2 },
      competencies: { technicalSkills: ["C/C++", "OS", "Networking"] },
      confirmedByCompany: true,
    },
  },
  {
    id: "job-004",
    companyId: "co-4",
    recruiterId: "rec-4",
    title: "Product Manager – Campus",
    description: "Strategic product thinking, problem framing, cross-functional collaboration. MBA/CS preferred.",
    status: "draft",
    assessmentAccessModel: "custom",
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now(),
    companyName: "Razorpay",
    applicantCount: 0,
    requirements: {
      jobId: "job-004",
      hardEligibility: { minimumCGPA: 8.0, maximumBacklogs: 0 },
      competencies: { technicalSkills: ["Product Strategy", "SQL", "A/B Testing"] },
      confirmedByCompany: false,
    },
  },
];

const STATUS_CONFIG = {
  published: { label: "Live / Active", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  draft: { label: "Draft", dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  closed: { label: "Closed", dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600 border-slate-200" },
};

export default function PlacementJobsPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<EnrichedJob[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "closed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadDrives() {
      try {
        setLoading(true);
        // For demo: skip Firebase read to avoid native PERMISSION_DENIED console logs
        setJobs(FALLBACK_JOBS);
      } finally {
        setLoading(false);
      }
    }

    loadDrives();
  }, []);

  const filtered = jobs.filter((job) => {
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      job.title.toLowerCase().includes(q) ||
      (job.companyName || "").toLowerCase().includes(q) ||
      job.description.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const counts = {
    all: jobs.length,
    published: jobs.filter((j) => j.status === "published").length,
    draft: jobs.filter((j) => j.status === "draft").length,
    closed: jobs.filter((j) => j.status === "closed").length,
  };

  const totalApplicants = jobs
    .filter((j) => j.status === "published")
    .reduce((acc, j) => acc + j.applicantCount, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 space-y-7">

        {/* Page Header */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Campus Drive Monitor
              </p>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Active Campus Drives
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Track all recruiter-posted roles, eligibility criteria, and applicant pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 border border-indigo-100">
            🏢 {counts.published} Active Drive{counts.published !== 1 ? "s" : ""} • {totalApplicants} Total Applicants
          </div>
        </section>

        {/* KPI Strip */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Drives", value: counts.all, color: "text-slate-900" },
            { label: "Active / Live", value: counts.published, color: "text-emerald-600" },
            { label: "Draft (Upcoming)", value: counts.draft, color: "text-amber-600" },
            { label: "Closed", value: counts.closed, color: "text-slate-400" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{kpi.label}</p>
              <p className={`mt-2 text-3xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </section>

        {/* Filters */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Search Role or Company
              </label>
              <input
                type="text"
                placeholder="e.g. Infosys, Software Engineer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
              />
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Status
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {(["all", "published", "draft", "closed"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-lg px-3 py-2 text-xs font-bold transition border ${
                      statusFilter === s
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                    <span className="ml-1.5 opacity-70">({counts[s]})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Drives List */}
        {loading ? (
          <div className="flex h-[35vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <p className="text-xs font-semibold text-indigo-900">Loading campus drives...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-base font-semibold text-slate-900">No drives match your filters</p>
            <p className="mt-1 text-sm text-slate-500">Try adjusting the search or status filter.</p>
            <button
              onClick={() => { setStatusFilter("all"); setSearchQuery(""); }}
              className="mt-4 rounded-xl bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <section className="space-y-4">
            {filtered.map((job) => {
              const cfg = STATUS_CONFIG[job.status];
              const req = job.requirements?.hardEligibility;
              const skills = job.requirements?.competencies?.technicalSkills || [];

              return (
                <div
                  key={job.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-sm transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
                    {/* Left — Role info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cfg.badge}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                        {job.requirements?.confirmedByCompany === false && (
                          <span className="rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[11px] font-bold text-orange-700">
                            ⚠ Pending Company Confirmation
                          </span>
                        )}
                      </div>

                      <h2 className="text-base font-bold text-slate-950 truncate">{job.title}</h2>
                      <p className="text-sm font-semibold text-indigo-700 mt-0.5">
                        {job.companyName || `Company ${job.companyId}`}
                      </p>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{job.description}</p>

                      {/* Eligibility Tags */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {req?.minimumCGPA && (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            CGPA ≥ {req.minimumCGPA}
                          </span>
                        )}
                        {req?.maximumBacklogs !== undefined && req.maximumBacklogs !== null && (
                          <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${req.maximumBacklogs === 0 ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"}`}>
                            Max {req.maximumBacklogs} Backlogs
                          </span>
                        )}
                        {req?.branches?.map((b) => (
                          <span key={b} className="rounded-md bg-indigo-50 text-indigo-700 px-2 py-0.5 text-[11px] font-semibold border border-indigo-100">
                            {b}
                          </span>
                        ))}
                        {skills.slice(0, 3).map((sk) => (
                          <span key={sk} className="rounded-md bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-semibold border border-emerald-100">
                            {sk}
                          </span>
                        ))}
                        {skills.length > 3 && (
                          <span className="rounded-md bg-slate-100 text-slate-500 px-2 py-0.5 text-[11px] font-semibold">
                            +{skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right — Stats */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-2xl font-extrabold text-slate-900">{job.applicantCount}</p>
                        <p className="text-[11px] text-slate-400 font-semibold">Applicants</p>
                      </div>

                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-400 font-medium">Posted</p>
                        <p className="text-xs font-semibold text-slate-700">
                          {new Date(job.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Link
                          href={`/placement/jobs/${job.id}`}
                          className="inline-flex items-center justify-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
                        >
                          Manage Drive →
                        </Link>
                        <Link
                          href={`/placement/jobs/${job.id}/assessment`}
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                        >
                          📝 Assessment
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
