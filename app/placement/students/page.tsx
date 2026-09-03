"use client";

import { useEffect, useState, useMemo } from "react";
import { get, ref } from "firebase/database";
import { database } from "../../../lib/firebase/database";
import type { StudentProfile, Application, PISScore, AssessmentResult } from "../../../types/database";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface EnrichedStudent extends StudentProfile {
  applicationsCount: number;
  pisScore?: number;
  assessmentStatus?: "qualified" | "not_qualified" | "pending";
}

const FALLBACK_STUDENTS: EnrichedStudent[] = [
  {
    userId: "stu-001",
    fullName: "Aarav Sharma",
    university: "State Tech University",
    degree: "B.Tech",
    branch: "Computer Science",
    graduationYear: 2025,
    cgpa: 8.9,
    attendance: 94,
    backlogCount: 0,
    profileCompletion: 92,
    applicationsCount: 4,
    pisScore: 860,
    assessmentStatus: "qualified",
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now(),
  },
  {
    userId: "stu-002",
    fullName: "Priya Patel",
    university: "State Tech University",
    degree: "B.Tech",
    branch: "Information Technology",
    graduationYear: 2025,
    cgpa: 8.4,
    attendance: 88,
    backlogCount: 0,
    profileCompletion: 85,
    applicationsCount: 3,
    pisScore: 780,
    assessmentStatus: "qualified",
    createdAt: Date.now() - 86400000 * 25,
    updatedAt: Date.now(),
  },
  {
    userId: "stu-003",
    fullName: "Rohan Verma",
    university: "State Tech University",
    degree: "B.Tech",
    branch: "Electronics & Communication",
    graduationYear: 2024,
    cgpa: 7.6,
    attendance: 81,
    backlogCount: 1,
    profileCompletion: 45,
    applicationsCount: 1,
    pisScore: 620,
    assessmentStatus: "not_qualified",
    createdAt: Date.now() - 86400000 * 40,
    updatedAt: Date.now(),
  },
  {
    userId: "stu-004",
    fullName: "Ananya Iyer",
    university: "State Tech University",
    degree: "B.Tech",
    branch: "Computer Science",
    graduationYear: 2026,
    cgpa: 9.2,
    attendance: 96,
    backlogCount: 0,
    profileCompletion: 78,
    applicationsCount: 2,
    pisScore: 890,
    assessmentStatus: "qualified",
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now(),
  },
  {
    userId: "stu-005",
    fullName: "Karan Malhotra",
    university: "State Tech University",
    degree: "B.Tech",
    branch: "Mechanical Engineering",
    graduationYear: 2024,
    cgpa: 7.1,
    attendance: 75,
    backlogCount: 2,
    profileCompletion: 40,
    applicationsCount: 0,
    pisScore: 540,
    assessmentStatus: "pending",
    createdAt: Date.now() - 86400000 * 60,
    updatedAt: Date.now(),
  },
];

export default function PlacementStudentDirectory() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<EnrichedStudent[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [readinessFilter, setReadinessFilter] = useState("all");

  useEffect(() => {
    async function loadDirectoryData() {
      try {
        setLoading(true);

        // 1. Fetch Profiles
        let profilesData: StudentProfile[] = [];
        try {
          const profilesSnap = await get(ref(database, "studentProfiles"));
          if (profilesSnap.exists()) {
            profilesData = Object.values(profilesSnap.val() as Record<string, StudentProfile>);
          }
        } catch (e) {
          console.warn("Using fallback students for directory:", e);
        }

        // 2. Fetch Applications
        let appsList: Application[] = [];
        try {
          const appsSnap = await get(ref(database, "applications"));
          if (appsSnap.exists()) {
            appsList = Object.values(appsSnap.val() as Record<string, Application>);
          }
        } catch (e) {
          console.warn("Could not load applications for directory:", e);
        }

        // 3. Fetch PIS Scores (Hardik's Data)
        let pisList: PISScore[] = [];
        try {
          const pisSnap = await get(ref(database, "pisScores"));
          if (pisSnap.exists()) {
            pisList = Object.values(pisSnap.val() as Record<string, PISScore>);
          }
        } catch (e) {
          console.warn("Could not load PIS scores:", e);
        }

        // 4. Fetch Assessment Results
        let resultsList: AssessmentResult[] = [];
        try {
          const resSnap = await get(ref(database, "assessmentResults"));
          if (resSnap.exists()) {
            resultsList = Object.values(resSnap.val() as Record<string, AssessmentResult>);
          }
        } catch (e) {
          console.warn("Could not load assessment results:", e);
        }

        if (profilesData.length === 0) {
          setStudents(FALLBACK_STUDENTS);
        } else {
          // Map into EnrichedStudent
          const enriched = profilesData.map((profile) => {
            const count = appsList.filter((app) => app.studentId === profile.userId).length;
            const pis = pisList.find((p) => p.studentId === profile.userId);
            const res = resultsList.find((r) => r.studentId === profile.userId);

            return {
              ...profile,
              applicationsCount: count,
              pisScore: pis ? pis.score : undefined,
              assessmentStatus: (res ? res.status : "pending") as "qualified" | "not_qualified" | "pending",
            };
          });

          // Sort by PIS or Profile completion
          enriched.sort((a, b) => (b.pisScore || 0) - (a.pisScore || 0));
          setStudents(enriched);
        }
      } catch (err) {
        console.warn("Directory loaded with fallback:", err);
        setStudents(FALLBACK_STUDENTS);
      } finally {
        setLoading(false);
      }
    }

    loadDirectoryData();
  }, []);

  // Compute unique branches & graduation years for dropdown options
  const branches = useMemo(() => {
    const set = new Set(students.map((s) => s.branch).filter(Boolean));
    return Array.from(set);
  }, [students]);

  const years = useMemo(() => {
    const set = new Set(students.map((s) => s.graduationYear).filter(Boolean));
    return Array.from(set).sort();
  }, [students]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Search
      const matchesSearch =
        student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.branch?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.degree?.toLowerCase().includes(searchQuery.toLowerCase());

      // Branch
      const matchesBranch = branchFilter === "all" || student.branch === branchFilter;

      // Year
      const matchesYear = yearFilter === "all" || String(student.graduationYear) === yearFilter;

      // Readiness
      let matchesReadiness = true;
      const comp = student.profileCompletion || 0;
      if (readinessFilter === "ready") matchesReadiness = comp >= 80;
      else if (readinessFilter === "progress") matchesReadiness = comp >= 50 && comp < 80;
      else if (readinessFilter === "attention") matchesReadiness = comp < 50;

      return matchesSearch && matchesBranch && matchesYear && matchesReadiness;
    });
  }, [students, searchQuery, branchFilter, yearFilter, readinessFilter]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Workspace Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-xs">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-600" />
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Institutional Intelligence Command Center
              </p>
            </div>
            <h1 className="text-xl font-bold text-slate-950 mt-0.5">
              Placement Student Directory
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/placement"
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                pathname === "/placement"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/placement/students"
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                pathname === "/placement/students"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Student Directory
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        {/* Header & Total Count */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Student Cohort Profiles</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing <span className="font-bold text-slate-900">{filteredStudents.length}</span> of {students.length} students across all branches
            </p>
          </div>

          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>Sorting: Highest PIS / Employability First</span>
          </div>
        </div>

        {/* Multi-Filter Controls */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search name, branch, degree..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs outline-none transition focus:border-indigo-500 focus:bg-white"
              />
            </div>

            {/* Branch Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Branch / Dept
              </label>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs outline-none transition focus:border-indigo-500 focus:bg-white"
              >
                <option value="all">All Branches</option>
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Graduation Year Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Graduation Year
              </label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs outline-none transition focus:border-indigo-500 focus:bg-white"
              >
                <option value="all">All Cohorts</option>
                {years.map((y) => (
                  <option key={y} value={String(y)}>
                    Class of {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Readiness Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Readiness Tier
              </label>
              <select
                value={readinessFilter}
                onChange={(e) => setReadinessFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs outline-none transition focus:border-indigo-500 focus:bg-white"
              >
                <option value="all">All Readiness Levels</option>
                <option value="ready">Placement Ready (&ge; 80%)</option>
                <option value="progress">In Progress (50–79%)</option>
                <option value="attention">Needs Attention (&lt; 50%)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Student Table */}
        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <p className="text-xs text-indigo-900 font-semibold">Loading student directory...</p>
            </div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-base font-semibold text-slate-900">No matching students found</p>
            <p className="mt-1 text-sm text-slate-500">Try clearing or adjusting your search filters.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setBranchFilter("all");
                setYearFilter("all");
                setReadinessFilter("all");
              }}
              className="mt-4 rounded-xl bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Student & Cohort</th>
                    <th className="px-6 py-4">Academic Details</th>
                    <th className="px-6 py-4">Profile Readiness</th>
                    <th className="px-6 py-4">Hardik's PIS</th>
                    <th className="px-6 py-4">Assessment</th>
                    <th className="px-6 py-4 text-center">Applications</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => {
                    const comp = student.profileCompletion || 0;
                    const pis = student.pisScore;

                    return (
                      <tr key={student.userId} className="hover:bg-slate-50/50 transition">
                        {/* Student Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700">
                              {student.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{student.fullName}</p>
                              <p className="text-[11px] text-slate-500 font-medium">
                                Class of {student.graduationYear}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Academics */}
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{student.degree}</p>
                          <p className="text-xs text-slate-500">{student.branch}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-700">{student.cgpa} CGPA</span>
                            {(student.backlogCount || 0) > 0 && (
                              <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700 border border-red-100">
                                {student.backlogCount} Backlog
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Profile Completion */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  comp >= 80
                                    ? "bg-emerald-500"
                                    : comp >= 50
                                    ? "bg-indigo-500"
                                    : "bg-amber-500"
                                }`}
                                style={{ width: `${comp}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-700">{comp}%</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">
                            {comp >= 80 ? "Ready" : comp >= 50 ? "In Progress" : "Needs Action"}
                          </p>
                        </td>

                        {/* Hardik's PIS Score */}
                        <td className="px-6 py-4">
                          {pis !== undefined ? (
                            <div>
                              <span
                                className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-extrabold ${
                                  pis >= 800
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : pis >= 650
                                    ? "bg-indigo-50 text-indigo-800 border border-indigo-200"
                                    : "bg-amber-50 text-amber-800 border border-amber-200"
                                }`}
                              >
                                {pis}
                              </span>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                {pis >= 800 ? "Elite Tier" : pis >= 650 ? "Industry Ready" : "Developing"}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">—</span>
                          )}
                        </td>

                        {/* Assessment Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              student.assessmentStatus === "qualified"
                                ? "bg-emerald-50 text-emerald-700"
                                : student.assessmentStatus === "not_qualified"
                                ? "bg-red-50 text-red-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {student.assessmentStatus === "qualified"
                              ? "✓ Qualified"
                              : student.assessmentStatus === "not_qualified"
                              ? "✗ Not Qualified"
                              : "Pending"}
                          </span>
                        </td>

                        {/* Applications */}
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800">
                            {student.applicationsCount}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
