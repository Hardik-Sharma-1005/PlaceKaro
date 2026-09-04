"use client";

import { useEffect, useState, useMemo } from "react";
import { get, ref } from "firebase/database";
import { database } from "../../../lib/firebase/database";
import type {
  StudentProfile,
  Application,
  PISScore,
  AssessmentResult,
} from "../../../types/database";
import Link from "next/link";

interface ReportStudent extends StudentProfile {
  applicationsCount: number;
  pisScore?: number;
  assessmentStatus?: "qualified" | "not_qualified" | "pending";
}

const FALLBACK: ReportStudent[] = [
  { userId: "stu-001", fullName: "Aarav Sharma", university: "State Tech University", degree: "B.Tech", branch: "Computer Science", graduationYear: 2025, cgpa: 8.9, attendance: 94, backlogCount: 0, profileCompletion: 92, applicationsCount: 4, pisScore: 860, assessmentStatus: "qualified", createdAt: Date.now(), updatedAt: Date.now() },
  { userId: "stu-002", fullName: "Priya Patel", university: "State Tech University", degree: "B.Tech", branch: "Information Technology", graduationYear: 2025, cgpa: 8.4, attendance: 88, backlogCount: 0, profileCompletion: 85, applicationsCount: 3, pisScore: 780, assessmentStatus: "qualified", createdAt: Date.now(), updatedAt: Date.now() },
  { userId: "stu-004", fullName: "Ananya Iyer", university: "State Tech University", degree: "B.Tech", branch: "Computer Science", graduationYear: 2026, cgpa: 9.2, attendance: 96, backlogCount: 0, profileCompletion: 78, applicationsCount: 2, pisScore: 890, assessmentStatus: "qualified", createdAt: Date.now(), updatedAt: Date.now() },
  { userId: "stu-003", fullName: "Rohan Verma", university: "State Tech University", degree: "B.Tech", branch: "Electronics & Communication", graduationYear: 2024, cgpa: 7.6, attendance: 81, backlogCount: 1, profileCompletion: 45, applicationsCount: 1, pisScore: 620, assessmentStatus: "not_qualified", createdAt: Date.now(), updatedAt: Date.now() },
  { userId: "stu-005", fullName: "Karan Malhotra", university: "State Tech University", degree: "B.Tech", branch: "Mechanical Engineering", graduationYear: 2024, cgpa: 7.1, attendance: 75, backlogCount: 2, profileCompletion: 40, applicationsCount: 0, pisScore: 540, assessmentStatus: "pending", createdAt: Date.now(), updatedAt: Date.now() },
];

function MiniBarChart({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-700 w-5 text-right">{value}</span>
    </div>
  );
}

export default function PlacementReportsPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<ReportStudent[]>([]);
  const [csvDownloaded, setCsvDownloaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        let profiles: StudentProfile[] = [];
        let apps: Application[] = [];
        let pisScores: PISScore[] = [];
        let results: AssessmentResult[] = [];

        try {
          const snap = await get(ref(database, "studentProfiles"));
          if (snap.exists()) profiles = Object.values(snap.val() as Record<string, StudentProfile>);
        } catch (_) { /* use fallback */ }

        if (profiles.length === 0) {
          setStudents(FALLBACK);
          return;
        }

        try {
          const snap = await get(ref(database, "applications"));
          if (snap.exists()) apps = Object.values(snap.val() as Record<string, Application>);
        } catch (_) { /* skip */ }

        try {
          const snap = await get(ref(database, "pisScores"));
          if (snap.exists()) pisScores = Object.values(snap.val() as Record<string, PISScore>);
        } catch (_) { /* skip */ }

        try {
          const snap = await get(ref(database, "assessmentResults"));
          if (snap.exists()) results = Object.values(snap.val() as Record<string, AssessmentResult>);
        } catch (_) { /* skip */ }

        const enriched: ReportStudent[] = profiles.map((p) => ({
          ...p,
          applicationsCount: apps.filter((a) => a.studentId === p.userId).length,
          pisScore: pisScores.find((ps) => ps.studentId === p.userId)?.score,
          assessmentStatus: (results.find((r) => r.studentId === p.userId)?.status ?? "pending") as "qualified" | "not_qualified" | "pending",
        }));

        enriched.sort((a, b) => (b.pisScore ?? 0) - (a.pisScore ?? 0));
        setStudents(enriched);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // --- Derived analytics ---
  const total = students.length;

  const readyCount = useMemo(() => students.filter((s) => s.profileCompletion >= 80).length, [students]);
  const placedCount = useMemo(() => students.filter((s) => s.assessmentStatus === "qualified" && s.applicationsCount > 0).length, [students]);
  const unplacedCount = total - placedCount;

  const avgPIS = useMemo(() => {
    const withPIS = students.filter((s) => s.pisScore !== undefined);
    return withPIS.length ? Math.round(withPIS.reduce((acc, s) => acc + (s.pisScore ?? 0), 0) / withPIS.length) : 0;
  }, [students]);

  const avgCGPA = useMemo(() => {
    return total ? Math.round((students.reduce((acc, s) => acc + (s.cgpa || 0), 0) / total) * 10) / 10 : 0;
  }, [students]);

  const topStudents = useMemo(() => students.slice(0, 5), [students]);

  const branchStats = useMemo(() => {
    const map: Record<string, { count: number; ready: number; placed: number }> = {};
    students.forEach((s) => {
      const b = s.branch || "General";
      if (!map[b]) map[b] = { count: 0, ready: 0, placed: 0 };
      map[b].count++;
      if (s.profileCompletion >= 80) map[b].ready++;
      if (s.assessmentStatus === "qualified" && s.applicationsCount > 0) map[b].placed++;
    });
    return Object.entries(map).map(([branch, d]) => ({ branch, ...d })).sort((a, b) => b.count - a.count);
  }, [students]);

  const batchStats = useMemo(() => {
    const map: Record<number, { count: number; ready: number }> = {};
    students.forEach((s) => {
      const y = s.graduationYear;
      if (!map[y]) map[y] = { count: 0, ready: 0 };
      map[y].count++;
      if (s.profileCompletion >= 80) map[y].ready++;
    });
    return Object.entries(map).map(([year, d]) => ({ year: Number(year), ...d })).sort((a, b) => a.year - b.year);
  }, [students]);

  function handleCSVExport() {
    const header = ["Name", "Branch", "Graduation Year", "CGPA", "Profile %", "PIS Score", "Assessment", "Applications"];
    const rows = students.map((s) => [
      s.fullName,
      s.branch,
      s.graduationYear,
      s.cgpa,
      s.profileCompletion,
      s.pisScore ?? "N/A",
      s.assessmentStatus ?? "pending",
      s.applicationsCount,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "placement_report.csv";
    a.click();
    URL.revokeObjectURL(url);
    setCsvDownloaded(true);
    setTimeout(() => setCsvDownloaded(false), 3000);
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-semibold text-indigo-900">Compiling institutional reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 space-y-8">

        {/* Header */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Placement Intelligence Reports
              </p>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Institutional Summary & Reports
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Aggregated placement performance, cohort analytics, and exportable data.
            </p>
          </div>

          <button
            onClick={handleCSVExport}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition shadow-xs ${
              csvDownloaded
                ? "bg-emerald-500 text-white"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {csvDownloaded ? "✓ Downloaded!" : "⬇ Export CSV"}
          </button>
        </section>

        {/* KPI Row */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Total Students", value: total, color: "text-slate-900" },
            { label: "Placement Ready", value: readyCount, color: "text-emerald-600" },
            { label: "Qualified in Assessment", value: placedCount, color: "text-indigo-600" },
            { label: "Not Yet Qualified", value: unplacedCount, color: "text-amber-600" },
            { label: "Avg PIS Score", value: avgPIS, color: "text-purple-600" },
            { label: "Avg CGPA", value: avgCGPA, color: "text-slate-700" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-tight">{kpi.label}</p>
              <p className={`mt-2 text-2xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </section>

        {/* Placement Ratio Visual */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-950">Qualification Placement Ratio</h2>
              <p className="text-xs text-slate-500 mt-0.5">Assessment-qualified students vs. total cohort</p>
            </div>
            <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-sm font-extrabold text-indigo-700">
              {total > 0 ? Math.round((placedCount / total) * 100) : 0}% Qualified
            </span>
          </div>

          <div className="flex h-8 w-full rounded-xl overflow-hidden gap-0.5">
            <div
              className="bg-emerald-500 flex items-center justify-center text-[11px] font-bold text-white transition-all"
              style={{ width: `${total > 0 ? (placedCount / total) * 100 : 0}%` }}
            >
              {placedCount > 0 && `${placedCount} Qualified`}
            </div>
            <div
              className="bg-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-600 transition-all"
              style={{ width: `${total > 0 ? (unplacedCount / total) * 100 : 100}%` }}
            >
              {unplacedCount > 0 && `${unplacedCount} Pending/Not Qualified`}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              <span className="text-slate-600">Assessment Qualified ({placedCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-slate-200" />
              <span className="text-slate-600">Pending / Not Qualified ({unplacedCount})</span>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Branch-wise Report */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-950">Department-wise Performance</h2>
                <p className="text-xs text-slate-500 mt-0.5">Placement readiness by academic branch</p>
              </div>
              <span className="text-xs font-semibold text-slate-400">{branchStats.length} Depts</span>
            </div>

            <div className="space-y-4">
              {branchStats.map((b) => {
                const readyPct = b.count > 0 ? Math.round((b.ready / b.count) * 100) : 0;
                const placedPct = b.count > 0 ? Math.round((b.placed / b.count) * 100) : 0;
                return (
                  <div key={b.branch} className="rounded-xl border border-slate-100 p-4 bg-slate-50/40">
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-sm font-bold text-slate-900 truncate max-w-[60%]">{b.branch}</p>
                      <span className="text-[11px] text-slate-500 font-medium">{b.count} students</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                        <span className="w-24 shrink-0">Profile Ready</span>
                        <MiniBarChart value={b.ready} max={b.count} color="bg-indigo-500" />
                        <span className="text-slate-400 w-8">{readyPct}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                        <span className="w-24 shrink-0">Qualified</span>
                        <MiniBarChart value={b.placed} max={b.count} color="bg-emerald-500" />
                        <span className="text-slate-400 w-8">{placedPct}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Batch-wise Report */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-950">Batch-wise Readiness</h2>
                <p className="text-xs text-slate-500 mt-0.5">Profile completion by graduation cohort</p>
              </div>
            </div>

            <div className="space-y-4">
              {batchStats.map((b) => {
                const pct = b.count > 0 ? Math.round((b.ready / b.count) * 100) : 0;
                return (
                  <div key={b.year} className="rounded-xl border border-slate-100 p-4 bg-slate-50/40">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">Class of {b.year}</p>
                        <p className="text-[11px] text-slate-500">{b.count} enrolled · {b.ready} placement-ready</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-extrabold ${pct >= 70 ? "text-emerald-600" : pct >= 50 ? "text-indigo-600" : "text-amber-600"}`}>
                          {pct}%
                        </span>
                        <p className="text-[10px] text-slate-400">Ready</p>
                      </div>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-indigo-500" : "bg-amber-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Batch summary tip */}
            <div className="mt-5 rounded-xl bg-indigo-50/60 border border-indigo-100 p-3.5">
              <p className="text-[11px] font-semibold text-indigo-900">
                💡 Tip: Focus interview preparation workshops on batches with readiness below 60% to improve placement outcomes before seasonal drives begin.
              </p>
            </div>
          </section>
        </div>

        {/* Top Ranked Students */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-950">Top Ranked Students by PIS</h2>
              <p className="text-xs text-slate-500 mt-0.5">Highest placement intelligence scores in the batch</p>
            </div>
            <Link href="/placement/students" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
              Full Directory →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">CGPA</th>
                  <th className="px-4 py-3">PIS Score</th>
                  <th className="px-4 py-3">Readiness</th>
                  <th className="px-4 py-3">Assessment</th>
                  <th className="px-4 py-3 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topStudents.map((s, i) => {
                  const tier = s.pisScore !== undefined
                    ? s.pisScore >= 800 ? { label: "Elite", badge: "bg-emerald-50 text-emerald-700" }
                    : s.pisScore >= 650 ? { label: "Ready", badge: "bg-indigo-50 text-indigo-700" }
                    : { label: "Developing", badge: "bg-amber-50 text-amber-700" }
                    : null;

                  return (
                    <tr key={s.userId} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold ${i === 0 ? "bg-amber-100 text-amber-800" : i === 1 ? "bg-slate-200 text-slate-700" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
                            {s.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{s.fullName}</p>
                            <p className="text-[10px] text-slate-400">Class of {s.graduationYear}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">{s.branch}</td>
                      <td className="px-4 py-3.5 text-xs font-bold text-slate-900">{s.cgpa}</td>
                      <td className="px-4 py-3.5">
                        {tier ? (
                          <span className={`rounded-lg px-2 py-0.5 text-xs font-extrabold ${tier.badge}`}>
                            {s.pisScore}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <div className={`h-1.5 w-12 rounded-full overflow-hidden bg-slate-100`}>
                            <div className={`h-full rounded-full ${s.profileCompletion >= 80 ? "bg-emerald-500" : s.profileCompletion >= 50 ? "bg-indigo-500" : "bg-amber-500"}`} style={{ width: `${s.profileCompletion}%` }} />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700">{s.profileCompletion}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.assessmentStatus === "qualified" ? "bg-emerald-50 text-emerald-700" : s.assessmentStatus === "not_qualified" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-500"}`}>
                          {s.assessmentStatus === "qualified" ? "✓ Qualified" : s.assessmentStatus === "not_qualified" ? "✗ Failed" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/placement/students/${s.userId}`}
                          className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}
