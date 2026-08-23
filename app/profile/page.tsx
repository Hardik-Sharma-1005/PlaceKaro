"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/context/AuthContext";
import { RoleGuard } from "../../lib/components/RoleGuard";
import { getData, updateData } from "../../lib/realtime/database";
import {
  equalTo,
  get,
  orderByChild,
  query,
  ref,
} from "firebase/database";
import { database } from "../../lib/firebase/database";
import type {
  Project,
  Skill,
  StudentProfile,
} from "../../types/database";

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

function ProfileContent() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

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

  useEffect(() => {
    async function loadProfile() {
      if (!user?.uid) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

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
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user?.uid]);

  useEffect(() => {
    async function loadSkills() {
      if (!user?.uid) {
        return;
      }

      try {
        const skillsQuery = query(
          ref(database, "skills"),
          orderByChild("studentId"),
          equalTo(user.uid)
        );

        const snapshot = await get(skillsQuery);

        if (!snapshot.exists()) {
          setSkills([]);
          return;
        }

        const skillData = snapshot.val() as Record<string, Skill>;

        const studentSkills = Object.values(skillData).sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        setSkills(studentSkills);
      } catch (skillsError) {
        console.error("Failed to load skills:", skillsError);
        setError("Unable to load your skills right now.");
      }
    }

    loadSkills();
  }, [user?.uid]);

  useEffect(() => {
    async function loadProjects() {
      if (!user?.uid) {
        return;
      }

      try {
        const projectsQuery = query(
          ref(database, "projects"),
          orderByChild("studentId"),
          equalTo(user.uid)
        );

        const snapshot = await get(projectsQuery);

        if (!snapshot.exists()) {
          setProjects([]);
          return;
        }

        const projectData = snapshot.val() as Record<string, Project>;

        const studentProjects = Object.values(projectData).sort((a, b) =>
          a.title.localeCompare(b.title)
        );

        setProjects(studentProjects);
      } catch (projectsError) {
        console.error("Failed to load projects:", projectsError);
        setError("Unable to load your projects right now.");
      }
    }

    loadProjects();
  }, [user?.uid]);

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

    if (
      Number.isNaN(attendance) ||
      attendance < 0 ||
      attendance > 100
    ) {
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

      setSuccessMessage("Profile updated successfully.");
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
          <p className="text-sm font-medium text-slate-700">
            Loading your profile...
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <div>
            <p className="text-xl font-bold tracking-tight text-slate-950">
              PlaceKaro
            </p>

            <p className="text-xs text-slate-500">
              Placement Intelligence
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
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Student profile
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {profile.fullName}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Keep your core academic information accurate and up to date.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Profile completion
            </p>

            <p className="mt-1 text-xl font-bold text-slate-950">
              {profile.profileCompletion}%
            </p>
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

        {/* Academic information */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8">
            <p className="text-sm font-semibold text-slate-950">
              Academic information
            </p>

            <p className="mt-1 text-sm text-slate-500">
              These details form the core of your institutional employability
              profile.
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
                onChange={(event) =>
                  handleInputChange("fullName", event.target.value)
                }
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
                onChange={(event) =>
                  handleInputChange("university", event.target.value)
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
                onChange={(event) =>
                  handleInputChange("degree", event.target.value)
                }
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
                onChange={(event) =>
                  handleInputChange("branch", event.target.value)
                }
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
                onChange={(event) =>
                  handleInputChange("graduationYear", event.target.value)
                }
                min="2000"
                max="2100"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label
                htmlFor="cgpa"
                className="text-sm font-medium text-slate-700"
              >
                CGPA
              </label>

              <input
                id="cgpa"
                type="number"
                value={formData.cgpa}
                onChange={(event) =>
                  handleInputChange("cgpa", event.target.value)
                }
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
                onChange={(event) =>
                  handleInputChange("attendance", event.target.value)
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
                onChange={(event) =>
                  handleInputChange("backlogCount", event.target.value)
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
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </section>

        {/* Skills */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Skills
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Technical and domain capabilities currently added to your
                profile.
              </p>
            </div>

            <span className="text-sm font-semibold text-slate-500">
              {skills.length} {skills.length === 1 ? "skill" : "skills"}
            </span>
          </div>

          {skills.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
              <p className="text-sm font-medium text-slate-700">
                No skills added yet
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Skills you add to your profile will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="rounded-xl border border-slate-200 p-5 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {skill.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {skill.category}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {skill.level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Projects */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Projects
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Projects and practical work currently added to your profile.
              </p>
            </div>

            <span className="text-sm font-semibold text-slate-500">
              {projects.length} {projects.length === 1 ? "project" : "projects"}
            </span>
          </div>

          {projects.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
              <p className="text-sm font-medium text-slate-700">
                No projects added yet
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Projects you add to your profile will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className="rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-slate-950">
                        {project.title}
                      </h2>

                      <p className="mt-1 text-sm font-medium text-slate-500">
                        {project.role}
                      </p>
                    </div>

                    {(project.startDate || project.endDate) && (
                      <p className="text-xs text-slate-400">
                        {project.startDate ?? "Start date unavailable"}
                        {" → "}
                        {project.endDate ?? "Present"}
                      </p>
                    )}
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {project.description}
                  </p>

                  {project.technologies.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.technologies.map((technology) => (
                        <span
                          key={technology}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                        >
                          {technology}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Other profile sections */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-sm font-semibold text-slate-950">
              Other profile sections
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Internships, certifications, achievements, and evidence will be
              added separately so each area can be maintained and verified
              independently.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">
                Internships
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Professional experience
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">
                Certifications
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Verified learning credentials
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">
                Achievements
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Competitions and accomplishments
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2 lg:col-span-1">
              <p className="text-sm font-semibold text-slate-900">
                Evidence
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Supporting verification records
              </p>
            </div>
          </div>
        </section>
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