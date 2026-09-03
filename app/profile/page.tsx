"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../lib/context/AuthContext";
import { RoleGuard } from "../../lib/components/RoleGuard";
import { getData, updateData } from "../../lib/realtime/database";
import type {
  Achievement,
  Certification,
  Evidence,
  Internship,
  Project,
  Skill,
  StudentProfile,
} from "../../types/database";
import {
  getStudentAchievements,
  getStudentCertifications,
  getStudentEvidence,
  getStudentInternships,
  getStudentProjects,
  getStudentSkills,
} from "../../lib/services/studentProfileService";

import { SkillsSection } from "../../lib/components/profile/SkillsSection";
import { ProjectsSection } from "../../lib/components/profile/ProjectsSection";
import { InternshipsSection } from "../../lib/components/profile/InternshipsSection";
import { CertificationsSection } from "../../lib/components/profile/CertificationsSection";
import { AchievementsSection } from "../../lib/components/profile/AchievementsSection";
import { EvidenceSection } from "../../lib/components/profile/EvidenceSection";

interface ProfileFormData {
  fullName: string;
  university: string;
  degree: string;
  branch: string;
  graduationYear: string;
  cgpa: string;
  attendance: string;
  backlogCount: string;
}

type TabType =
  | "all"
  | "academic"
  | "skills"
  | "projects"
  | "internships"
  | "certifications"
  | "achievements"
  | "evidence";

function ProfileContent() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);

  const [activeTab, setActiveTab] = useState<TabType>("all");

  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: "",
    university: "",
    degree: "",
    branch: "",
    graduationYear: "",
    cgpa: "",
    attendance: "",
    backlogCount: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load core profile
  const loadProfile = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const studentProfile = await getData<StudentProfile>(
        `studentProfiles/${user.uid}`
      );

      if (!studentProfile) {
        setError("Your student profile has not been created yet.");
        return;
      }

      setProfile(studentProfile);
      setFormData({
        fullName: studentProfile.fullName,
        university: studentProfile.university,
        degree: studentProfile.degree,
        branch: studentProfile.branch,
        graduationYear: String(studentProfile.graduationYear),
        cgpa: String(studentProfile.cgpa),
        attendance: String(studentProfile.attendance),
        backlogCount: String(studentProfile.backlogCount),
      });
    } catch (profileError) {
      console.error("Failed to load student profile:", profileError);
      setError("Unable to load your profile right now.");
    }
  }, [user?.uid]);

  // Load evidence
  const refreshEvidence = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const data = await getStudentEvidence(user.uid);
      setEvidenceList(data);
    } catch (err) {
      console.error("Failed to load evidence:", err);
    }
  }, [user?.uid]);

  // Load skills
  const refreshSkills = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const data = await getStudentSkills(user.uid);
      setSkills(data);
    } catch (err) {
      console.error("Failed to load skills:", err);
    }
  }, [user?.uid]);

  // Load projects
  const refreshProjects = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const data = await getStudentProjects(user.uid);
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  }, [user?.uid]);

  // Load internships
  const refreshInternships = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const data = await getStudentInternships(user.uid);
      setInternships(data);
    } catch (err) {
      console.error("Failed to load internships:", err);
    }
  }, [user?.uid]);

  // Load certifications
  const refreshCertifications = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const data = await getStudentCertifications(user.uid);
      setCertifications(data);
    } catch (err) {
      console.error("Failed to load certifications:", err);
    }
  }, [user?.uid]);

  // Load achievements
  const refreshAchievements = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const data = await getStudentAchievements(user.uid);
      setAchievements(data);
    } catch (err) {
      console.error("Failed to load achievements:", err);
    }
  }, [user?.uid]);

  // Initial load
  useEffect(() => {
    async function loadAllData() {
      if (!user?.uid) return;
      try {
        setLoading(true);
        setError(null);
        await Promise.all([
          loadProfile(),
          refreshEvidence(),
          refreshSkills(),
          refreshProjects(),
          refreshInternships(),
          refreshCertifications(),
          refreshAchievements(),
        ]);
      } catch (err) {
        console.error("Error loading profile data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAllData();
  }, [
    user?.uid,
    loadProfile,
    refreshEvidence,
    refreshSkills,
    refreshProjects,
    refreshInternships,
    refreshCertifications,
    refreshAchievements,
  ]);

  function handleInputChange(
    field: keyof ProfileFormData,
    value: string
  ): void {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
    setSuccessMessage(null);
  }

  async function handleSave(): Promise<void> {
    if (!user?.uid || !profile) {
      return;
    }

    setError(null);
    setSuccessMessage(null);

    const graduationYear = Number(formData.graduationYear);
    const cgpa = Number(formData.cgpa);
    const attendance = Number(formData.attendance);
    const backlogCount = Number(formData.backlogCount);

    if (!formData.fullName.trim()) {
      setError("Full name cannot be empty.");
      return;
    }

    if (!formData.university.trim()) {
      setError("University cannot be empty.");
      return;
    }

    if (!formData.degree.trim()) {
      setError("Degree cannot be empty.");
      return;
    }

    if (!formData.branch.trim()) {
      setError("Branch cannot be empty.");
      return;
    }

    if (
      !Number.isInteger(graduationYear) ||
      graduationYear < 2000 ||
      graduationYear > 2100
    ) {
      setError("Enter a valid graduation year.");
      return;
    }

    if (Number.isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
      setError("CGPA must be between 0 and 10.");
      return;
    }

    if (Number.isNaN(attendance) || attendance < 0 || attendance > 100) {
      setError("Attendance must be between 0 and 100.");
      return;
    }

    if (!Number.isInteger(backlogCount) || backlogCount < 0) {
      setError("Backlog count cannot be negative.");
      return;
    }

    try {
      setSaving(true);

      const updatedProfile: StudentProfile = {
        ...profile,
        fullName: formData.fullName.trim(),
        university: formData.university.trim(),
        degree: formData.degree.trim(),
        branch: formData.branch.trim(),
        graduationYear,
        cgpa,
        attendance,
        backlogCount,
        updatedAt: Date.now(),
      };

      await updateData(
        `studentProfiles/${user.uid}`,
        updatedProfile as unknown as Record<string, unknown>
      );

      setProfile(updatedProfile);
      setSuccessMessage("Academic information updated successfully.");
    } catch (saveError) {
      console.error("Failed to update student profile:", saveError);
      setError("Unable to save your profile right now.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div>
          <p className="mt-3 text-sm font-medium text-slate-700">
            Loading your employability profile...
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-950">
            Profile unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {error ?? "Your student profile could not be found."}
          </p>
        </div>
      </div>
    );
  }

  // Count verified items
  const verifiedEvidenceCount = evidenceList.filter(
    (e) => e.verificationStatus === "verified" || e.verificationStatus === "approved"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex min-h-20 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <div>
            <p className="text-xl font-bold tracking-tight text-slate-950">
              PlaceKaro
            </p>
            <p className="text-xs font-medium text-slate-500">
              Employability Intelligence & Portfolio
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {user?.displayName ?? profile.fullName}
              </p>
              <p className="text-xs text-slate-500">
                {user?.email ?? "Student account"}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {(profile.fullName.charAt(0) || "S").toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
        {/* Banner */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-xs">
              <span>{profile.degree}</span>
              <span>•</span>
              <span>{profile.branch}</span>
              <span>•</span>
              <span>Class of {profile.graduationYear}</span>
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {profile.fullName}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {profile.university}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-xs">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Profile Completion
              </p>
              <p className="mt-0.5 text-xl font-bold text-slate-950">
                {profile.profileCompletion}%
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm shadow-xs">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                Verified Evidence
              </p>
              <p className="mt-0.5 text-xl font-bold text-emerald-800">
                {verifiedEvidenceCount} / {evidenceList.length}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 flex overflow-x-auto border-b border-slate-200 pb-2">
          <div className="flex gap-2">
            {[
              { id: "all", label: "Overview / All" },
              { id: "academic", label: "Academic Info" },
              { id: "skills", label: `Skills (${skills.length})` },
              { id: "projects", label: `Projects (${projects.length})` },
              { id: "internships", label: `Internships (${internships.length})` },
              { id: "certifications", label: `Certifications (${certifications.length})` },
              { id: "achievements", label: `Achievements (${achievements.length})` },
              { id: "evidence", label: `Evidence Vault (${evidenceList.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm font-medium text-emerald-700">
              {successMessage}
            </p>
          </div>
        )}

        {/* 1. Academic Information */}
        {(activeTab === "all" || activeTab === "academic") && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-8">
              <p className="text-sm font-semibold text-slate-950">
                Academic Information
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Core institutional records used for placement eligibility and candidate indexing.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="fullName"
                  className="text-sm font-medium text-slate-700"
                >
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label
                  htmlFor="university"
                  className="text-sm font-medium text-slate-700"
                >
                  University
                </label>
                <input
                  id="university"
                  type="text"
                  value={formData.university}
                  onChange={(e) =>
                    handleInputChange("university", e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label
                  htmlFor="degree"
                  className="text-sm font-medium text-slate-700"
                >
                  Degree
                </label>
                <input
                  id="degree"
                  type="text"
                  value={formData.degree}
                  onChange={(e) => handleInputChange("degree", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label
                  htmlFor="branch"
                  className="text-sm font-medium text-slate-700"
                >
                  Branch / discipline
                </label>
                <input
                  id="branch"
                  type="text"
                  value={formData.branch}
                  onChange={(e) => handleInputChange("branch", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label
                  htmlFor="graduationYear"
                  className="text-sm font-medium text-slate-700"
                >
                  Graduation year
                </label>
                <input
                  id="graduationYear"
                  type="number"
                  value={formData.graduationYear}
                  onChange={(e) =>
                    handleInputChange("graduationYear", e.target.value)
                  }
                  min="2000"
                  max="2100"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label htmlFor="cgpa" className="text-sm font-medium text-slate-700">
                  CGPA
                </label>
                <input
                  id="cgpa"
                  type="number"
                  value={formData.cgpa}
                  onChange={(e) => handleInputChange("cgpa", e.target.value)}
                  min="0"
                  max="10"
                  step="0.01"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Enter a value between 0 and 10.
                </p>
              </div>

              <div>
                <label
                  htmlFor="attendance"
                  className="text-sm font-medium text-slate-700"
                >
                  Attendance (%)
                </label>
                <input
                  id="attendance"
                  type="number"
                  value={formData.attendance}
                  onChange={(e) =>
                    handleInputChange("attendance", e.target.value)
                  }
                  min="0"
                  max="100"
                  step="0.01"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Enter a value between 0 and 100.
                </p>
              </div>

              <div>
                <label
                  htmlFor="backlogCount"
                  className="text-sm font-medium text-slate-700"
                >
                  Backlog count
                </label>
                <input
                  id="backlogCount"
                  type="number"
                  value={formData.backlogCount}
                  onChange={(e) =>
                    handleInputChange("backlogCount", e.target.value)
                  }
                  min="0"
                  step="1"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Enter 0 if you currently have no backlogs.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-400">
                Last updated: {new Date(profile.updatedAt).toLocaleString()}
              </p>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Academic Changes"}
              </button>
            </div>
          </section>
        )}

        {/* 2. Skills Section */}
        {(activeTab === "all" || activeTab === "skills") && (
          <SkillsSection
            studentId={user!.uid}
            skills={skills}
            evidenceList={evidenceList}
            onSkillsUpdated={refreshSkills}
          />
        )}

        {/* 3. Projects Section */}
        {(activeTab === "all" || activeTab === "projects") && (
          <ProjectsSection
            studentId={user!.uid}
            projects={projects}
            evidenceList={evidenceList}
            onProjectsUpdated={refreshProjects}
          />
        )}

        {/* 4. Internships Section */}
        {(activeTab === "all" || activeTab === "internships") && (
          <InternshipsSection
            studentId={user!.uid}
            internships={internships}
            evidenceList={evidenceList}
            onInternshipsUpdated={refreshInternships}
          />
        )}

        {/* 5. Certifications Section */}
        {(activeTab === "all" || activeTab === "certifications") && (
          <CertificationsSection
            studentId={user!.uid}
            certifications={certifications}
            evidenceList={evidenceList}
            onCertificationsUpdated={refreshCertifications}
          />
        )}

        {/* 6. Achievements Section */}
        {(activeTab === "all" || activeTab === "achievements") && (
          <AchievementsSection
            studentId={user!.uid}
            achievements={achievements}
            evidenceList={evidenceList}
            onAchievementsUpdated={refreshAchievements}
          />
        )}

        {/* 7. Evidence Vault Section */}
        {(activeTab === "all" || activeTab === "evidence") && (
          <EvidenceSection
            studentId={user!.uid}
            evidenceList={evidenceList}
            onEvidenceUpdated={() => {
              refreshEvidence();
              refreshSkills();
              refreshProjects();
              refreshInternships();
              refreshCertifications();
              refreshAchievements();
            }}
          />
        )}
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RoleGuard allowedRoles={["student"]}>
      <ProfileContent />
    </RoleGuard>
  );
}