"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { get, ref } from "firebase/database";
import { database } from "../../../../lib/firebase/database";
import type {
  StudentProfile,
  Application,
  PISScore,
  AssessmentResult,
  Skill,
  Project,
  Internship,
} from "../../../../types/database";
import Link from "next/link";

interface DetailedStudent extends StudentProfile {
  skills?: Skill[];
  projects?: Project[];
  internships?: Internship[];
  applications?: Array<Application & { jobTitle?: string }>;
  pisScore?: number;
  pisBreakdown?: Array<{ factor: string; score: number; outOf: number }>;
  assessmentResults?: AssessmentResult[];
}

const MOCK_PROFILES: Record<string, DetailedStudent> = {
  "stu-001": {
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
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now(),
    pisScore: 860,
    pisBreakdown: [
      { factor: "Academic Score", score: 220, outOf: 250 },
      { factor: "Skills Verified", score: 195, outOf: 250 },
      { factor: "Projects", score: 185, outOf: 250 },
      { factor: "Internship / Experience", score: 170, outOf: 200 },
      { factor: "Certifications", score: 90, outOf: 50 },
    ],
    skills: [
      { id: "s1", studentId: "stu-001", name: "Python", category: "Programming", level: "Advanced" },
      { id: "s2", studentId: "stu-001", name: "React.js", category: "Frontend", level: "Intermediate" },
      { id: "s3", studentId: "stu-001", name: "SQL", category: "Data", level: "Intermediate" },
      { id: "s4", studentId: "stu-001", name: "Data Structures", category: "Core CS", level: "Advanced" },
      { id: "s5", studentId: "stu-001", name: "Machine Learning", category: "AI/ML", level: "Beginner" },
    ],
    projects: [
      {
        id: "p1", studentId: "stu-001",
        title: "Placement Portal — PlaceKaro",
        description: "Full-stack campus recruitment platform with role-based dashboards, PIS engine, and assessment module.",
        technologies: ["Next.js", "Firebase", "TypeScript"],
        role: "Full Stack Developer",
      },
      {
        id: "p2", studentId: "stu-001",
        title: "Stock Price Prediction ML Model",
        description: "LSTM-based time-series prediction model achieving 87% directional accuracy on NSE data.",
        technologies: ["Python", "TensorFlow", "Pandas"],
        role: "ML Engineer",
      },
    ],
    internships: [
      {
        id: "i1", studentId: "stu-001",
        organization: "Infosys BPM",
        role: "Software Developer Intern",
        startDate: "May 2024",
        endDate: "Jul 2024",
        description: "Worked on automating legacy data pipelines using Python and built internal dashboard using React.",
      },
    ],
    applications: [
      { id: "a1", studentId: "stu-001", jobId: "job-001", status: "applied", assessmentUnlocked: true, jobTitle: "Associate Software Engineer – Infosys" },
      { id: "a2", studentId: "stu-001", jobId: "job-002", status: "applied", assessmentUnlocked: false, jobTitle: "Data Analyst – TCS Digital" },
    ],
    assessmentResults: [
      { id: "r1", assessmentId: "a1", jobId: "job-001", studentId: "stu-001", score: 18, totalMarks: 20, percentage: 90, status: "qualified", submittedAt: Date.now() - 86400000 * 2 },
    ],
  },
  "stu-002": {
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
    createdAt: Date.now() - 86400000 * 25,
    updatedAt: Date.now(),
    pisScore: 780,
    pisBreakdown: [
      { factor: "Academic Score", score: 210, outOf: 250 },
      { factor: "Skills Verified", score: 180, outOf: 250 },
      { factor: "Projects", score: 160, outOf: 250 },
      { factor: "Internship / Experience", score: 160, outOf: 200 },
      { factor: "Certifications", score: 70, outOf: 50 },
    ],
    skills: [
      { id: "s6", studentId: "stu-002", name: "Java", category: "Programming", level: "Advanced" },
      { id: "s7", studentId: "stu-002", name: "Spring Boot", category: "Backend", level: "Intermediate" },
      { id: "s8", studentId: "stu-002", name: "MySQL", category: "Data", level: "Intermediate" },
    ],
    projects: [
      {
        id: "p3", studentId: "stu-002",
        title: "E-Commerce Backend API",
        description: "RESTful API for multi-vendor marketplace using Spring Boot and MySQL with JWT auth.",
        technologies: ["Java", "Spring Boot", "MySQL"],
        role: "Backend Developer",
      },
    ],
    internships: [],
    applications: [
      { id: "a3", studentId: "stu-002", jobId: "job-001", status: "applied", assessmentUnlocked: true, jobTitle: "Associate Software Engineer – Infosys" },
    ],
    assessmentResults: [
      { id: "r2", assessmentId: "a1", jobId: "job-001", studentId: "stu-002", score: 15, totalMarks: 20, percentage: 75, status: "qualified", submittedAt: Date.now() - 86400000 * 3 },
    ],
  },
};

const PIS_TIER = (score: number) =>
  score >= 800 ? { label: "Elite Talent", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" }
  : score >= 650 ? { label: "Industry Ready", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" }
  : { label: "Developing", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" };

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params?.studentId as string;

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<DetailedStudent | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    if (!studentId) return;

    async function loadProfile() {
      try {
        setLoading(true);

        // Try Firebase first
        let profileData: StudentProfile | null = null;
        try {
          const snap = await get(ref(database, `studentProfiles/${studentId}`));
          if (snap.exists()) profileData = snap.val() as StudentProfile;
        } catch (_) {
          // Use fallback
        }

        // Check mock data
        if (!profileData && MOCK_PROFILES[studentId]) {
          setStudent(MOCK_PROFILES[studentId]);
          return;
        }

        if (!profileData) {
          setNotFound(true);
          return;
        }

        // Enrich from Firebase sub-collections
        const enriched: DetailedStudent = { ...profileData };

        try {
          const pisSnap = await get(ref(database, "pisScores"));
          if (pisSnap.exists()) {
            const all = Object.values(pisSnap.val() as Record<string, PISScore>);
            const match = all.find((p) => p.studentId === studentId);
            if (match) enriched.pisScore = match.score;
          }
        } catch (_) { /* skip */ }

        try {
          const resSnap = await get(ref(database, "assessmentResults"));
          if (resSnap.exists()) {
            const all = Object.values(resSnap.val() as Record<string, AssessmentResult>);
            enriched.assessmentResults = all.filter((r) => r.studentId === studentId);
          }
        } catch (_) { /* skip */ }

        try {
          const appsSnap = await get(ref(database, "applications"));
          if (appsSnap.exists()) {
            const all = Object.values(appsSnap.val() as Record<string, Application>);
            enriched.applications = all.filter((a) => a.studentId === studentId);
          }
        } catch (_) { /* skip */ }

        setStudent(enriched);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-semibold text-indigo-900">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (notFound || !student) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-5">
        <p className="text-5xl">🎓</p>
        <h2 className="text-lg font-bold text-slate-900">Student Not Found</h2>
        <p className="text-sm text-slate-500 text-center max-w-xs">
          The student profile with ID <span className="font-mono font-bold">{studentId}</span> could not be found.
        </p>
        <Link href="/placement/students" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition">
          ← Back to Directory
        </Link>
      </div>
    );
  }

  const comp = student.profileCompletion || 0;
  const pisTier = student.pisScore !== undefined ? PIS_TIER(student.pisScore) : null;
  const compColor = comp >= 80 ? "bg-emerald-500" : comp >= 50 ? "bg-indigo-500" : "bg-amber-500";
  const compLabel = comp >= 80 ? "Placement Ready" : comp >= 50 ? "In Progress" : "Needs Attention";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 space-y-6">

        {/* Back nav */}
        <Link
          href="/placement/students"
          className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
        >
          ← Student Directory
        </Link>

        {/* Hero Profile Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-3xl font-extrabold text-white shadow-md">
              {student.fullName.charAt(0).toUpperCase()}
            </div>

            {/* Core info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-950">{student.fullName}</h1>
              <p className="text-sm text-indigo-700 font-semibold mt-0.5">
                {student.degree} · {student.branch} · Class of {student.graduationYear}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{student.university}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {/* Profile completion badge */}
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold border ${comp >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : comp >= 50 ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                  {compLabel} · {comp}% Profile
                </span>
                {pisTier && (
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold border ${pisTier.bg} ${pisTier.color}`}>
                    ✨ {pisTier.label} · PIS {student.pisScore}
                  </span>
                )}
                {(student.backlogCount || 0) > 0 && (
                  <span className="rounded-full bg-red-50 text-red-700 border-red-200 border px-3 py-1 text-[11px] font-bold">
                    ⚠ {student.backlogCount} Active Backlog{(student.backlogCount || 0) > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 self-start shrink-0">
              <button
                onClick={() => setNotified(true)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition border ${notified ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600"}`}
              >
                {notified ? "✓ Notified" : "📢 Send Notification"}
              </button>
              <button
                onClick={() => setFlagged(!flagged)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition border ${flagged ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-white text-slate-700 border-slate-200 hover:border-amber-300"}`}
              >
                {flagged ? "🚩 Flagged" : "🚩 Flag for Counseling"}
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-5">

            {/* Academic Details */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Academic Details</h2>
              <div className="space-y-3">
                {[
                  { label: "CGPA", value: `${student.cgpa} / 10.0` },
                  { label: "Attendance", value: `${student.attendance}%` },
                  { label: "Backlogs", value: `${student.backlogCount || 0}` },
                  { label: "Graduation Year", value: `${student.graduationYear}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">{label}</span>
                    <span className="text-xs font-bold text-slate-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Completion */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900">Profile Readiness</h2>
                <span className="text-lg font-extrabold text-slate-900">{comp}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${compColor}`} style={{ width: `${comp}%` }} />
              </div>
              <p className={`mt-2 text-xs font-semibold ${comp >= 80 ? "text-emerald-700" : comp >= 50 ? "text-indigo-700" : "text-amber-700"}`}>
                {compLabel}
              </p>
            </div>

            {/* PIS Score Card */}
            {student.pisScore !== undefined && pisTier && (
              <div className={`rounded-2xl border p-5 shadow-xs ${pisTier.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-slate-900">PIS Score</h2>
                  <span className={`text-2xl font-extrabold ${pisTier.color}`}>{student.pisScore}</span>
                </div>
                <p className={`text-xs font-bold mb-3 ${pisTier.color}`}>{pisTier.label}</p>

                {student.pisBreakdown && (
                  <div className="space-y-2 mt-3">
                    {student.pisBreakdown.map((b) => (
                      <div key={b.factor}>
                        <div className="flex justify-between text-[11px] font-semibold mb-0.5">
                          <span className="text-slate-700">{b.factor}</span>
                          <span className="text-slate-900">{b.score}/{b.outOf}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/60 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pisTier.color === "text-emerald-700" ? "bg-emerald-500" : pisTier.color === "text-indigo-700" ? "bg-indigo-500" : "bg-amber-500"}`}
                            style={{ width: `${Math.min(100, (b.score / b.outOf) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-5">

            {/* Skills */}
            {(student.skills?.length ?? 0) > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900 mb-3">Skills & Competencies</h2>
                <div className="flex flex-wrap gap-2">
                  {student.skills!.map((sk) => (
                    <span
                      key={sk.id}
                      className="rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-800"
                    >
                      {sk.name}
                      <span className="ml-1.5 text-[10px] text-indigo-400 font-normal">{sk.level}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {(student.projects?.length ?? 0) > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900 mb-4">Projects</h2>
                <div className="space-y-4">
                  {student.projects!.map((proj) => (
                    <div key={proj.id} className="rounded-xl border border-slate-100 p-4 bg-slate-50/40">
                      <p className="text-sm font-bold text-slate-900">{proj.title}</p>
                      <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">{proj.role}</p>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{proj.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {proj.technologies.map((tech) => (
                          <span key={tech} className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Internships */}
            {(student.internships?.length ?? 0) > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900 mb-4">Internships & Experience</h2>
                <div className="space-y-3">
                  {student.internships!.map((intern) => (
                    <div key={intern.id} className="rounded-xl border border-slate-100 p-4 bg-slate-50/40">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{intern.role}</p>
                          <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">{intern.organization}</p>
                        </div>
                        {intern.startDate && (
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {intern.startDate}{intern.endDate ? ` – ${intern.endDate}` : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{intern.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Applications & Assessment History */}
            {(student.applications?.length ?? 0) > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900 mb-4">Job Applications</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="border-b border-slate-100">
                      <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-2 pr-4">Role</th>
                        <th className="pb-2 pr-4">Status</th>
                        <th className="pb-2">Assessment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {student.applications!.map((app) => {
                        const result = student.assessmentResults?.find((r) => r.jobId === app.jobId);
                        return (
                          <tr key={app.id}>
                            <td className="py-2.5 pr-4">
                              <p className="font-semibold text-slate-900">{app.jobTitle || app.jobId}</p>
                            </td>
                            <td className="py-2.5 pr-4">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${app.status === "applied" ? "bg-indigo-50 text-indigo-700" : app.status === "withdrawn" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                                {app.status}
                              </span>
                            </td>
                            <td className="py-2.5">
                              {result ? (
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${result.status === "qualified" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                                  {result.status === "qualified" ? "✓" : "✗"} {result.percentage}%
                                </span>
                              ) : app.assessmentUnlocked ? (
                                <span className="text-amber-600 font-semibold">Pending</span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
