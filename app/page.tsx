"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../lib/context/AuthContext";
import { RoleGuard } from "../lib/components/RoleGuard";
import {
  get,
  orderByChild,
  query,
  ref,
  equalTo,
} from "firebase/database";
import { database } from "../lib/firebase/database";

interface StudentProfileSummary {
  profileCompletion?: number;
}

interface StudentSkill {
  id: string;
  studentId: string;
  name: string;
  category: string;
  level: string;
  evidenceIds?: string[];
}

interface Job {
  id: string;
  companyId: string;
  recruiterId: string;
  title: string;
  description: string;
  status: "draft" | "published" | "closed";
  assessmentId?: string;
  assessmentAccessModel: "all_eligible" | "role_fit" | "custom";
  shortlistType?: "cutoff" | "top_n";
  shortlistValue?: number;
  createdAt: number;
  updatedAt: number;
}

interface Application {
  id: string;
  studentId: string;
  jobId: string;
  status: "invited" | "applied" | "withdrawn";
  appliedAt?: number;
  assessmentUnlocked: boolean;
}

interface StudentNotification {
  id: string;
  userId: string;
  type:
    | "assessment_invitation"
    | "application_update"
    | "new_opportunity"
    | "system";
  title: string;
  message: string;
  relatedJobId?: string;
  isRead: boolean;
  createdAt: number;
}

function DashboardContent() {
  const { user } = useAuth();

  const [profileCompletion, setProfileCompletion] = useState<number | null>(
    null
  );
  const [skillsListed, setSkillsListed] = useState<number | null>(null);
  const [activeOpportunities, setActiveOpportunities] = useState<number | null>(
    null
  );
  const [availableAssessments, setAvailableAssessments] = useState<
    number | null
  >(null);
  const [publishedJobs, setPublishedJobs] = useState<Job[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<
    StudentNotification[]
  >([]);

  useEffect(() => {
    async function loadProfile() {
      if (!user?.uid) {
        return;
      }

      try {
        const profileRef = ref(database, `studentProfiles/${user.uid}`);
        const snapshot = await get(profileRef);

        if (!snapshot.exists()) {
          setProfileCompletion(0);
          return;
        }

        const profile = snapshot.val() as StudentProfileSummary;

        setProfileCompletion(profile.profileCompletion ?? 0);
      } catch (error) {
        console.error("Failed to load student profile:", error);
        setProfileCompletion(0);
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
          setSkillsListed(0);
          return;
        }

        const skills = snapshot.val() as Record<string, StudentSkill>;

        setSkillsListed(Object.keys(skills).length);
      } catch (error) {
        console.error("Failed to load skills:", error);
        setSkillsListed(0);
      }
    }

    loadSkills();
  }, [user?.uid]);

  useEffect(() => {
    async function loadActiveOpportunities() {
      if (!user?.uid) {
        return;
      }

      try {
        const jobsQuery = query(
          ref(database, "jobs"),
          orderByChild("status"),
          equalTo("published")
        );

        const snapshot = await get(jobsQuery);

        if (!snapshot.exists()) {
          setActiveOpportunities(0);
          setPublishedJobs([]);
          return;
        }

        const jobs = snapshot.val() as Record<string, Job>;

        const jobsList = Object.values(jobs).sort(
          (a, b) => b.createdAt - a.createdAt
        );

        setActiveOpportunities(jobsList.length);
        setPublishedJobs(jobsList);
      } catch (error) {
        console.error("Failed to load active opportunities:", error);
        setActiveOpportunities(0);
        setPublishedJobs([]);
      }
    }

    loadActiveOpportunities();
  }, [user?.uid]);

  useEffect(() => {
    async function loadAssessments() {
      if (!user?.uid) {
        return;
      }

      try {
        const applicationsQuery = query(
          ref(database, "applications"),
          orderByChild("studentId"),
          equalTo(user.uid)
        );

        const snapshot = await get(applicationsQuery);

        if (!snapshot.exists()) {
          setAvailableAssessments(0);
          return;
        }

        const applications = snapshot.val() as Record<string, Application>;

        const unlockedAssessments = Object.values(applications).filter(
          (application) =>
            application.assessmentUnlocked === true &&
            application.status !== "withdrawn"
        );

        setAvailableAssessments(unlockedAssessments.length);
      } catch (error) {
        console.error("Failed to load assessments:", error);
        setAvailableAssessments(0);
      }
    }

    loadAssessments();
  }, [user?.uid]);

  useEffect(() => {
    async function loadNotifications() {
      if (!user?.uid) {
        return;
      }

      try {
        const notificationsQuery = query(
          ref(database, "notifications"),
          orderByChild("userId"),
          equalTo(user.uid)
        );

        const snapshot = await get(notificationsQuery);

        if (!snapshot.exists()) {
          setRecentNotifications([]);
          return;
        }

        const notifications = snapshot.val() as Record<
          string,
          StudentNotification
        >;

        const notificationsList = Object.values(notifications)
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 3);

        setRecentNotifications(notificationsList);
      } catch (error) {
        console.error("Failed to load notifications:", error);
        setRecentNotifications([]);
      }
    }

    loadNotifications();
  }, [user?.uid]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="flex h-20 items-center border-b border-slate-200 px-6">
            <div>
              <div className="text-xl font-bold tracking-tight text-slate-950">
                PlaceKaro
              </div>

              <div className="text-xs text-slate-500">
                Placement Intelligence
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6">
            <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Workspace
            </div>

            <div className="space-y-1">
              <button className="flex w-full items-center gap-3 rounded-xl bg-slate-900 px-3 py-3 text-left text-sm font-medium text-white">
                <span className="h-2 w-2 rounded-full bg-white" />
                Dashboard
              </button>

              <Link
                href="/profile"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                <span className="h-2 w-2 rounded-full bg-slate-300" />
                My Profile
              </Link>

              <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100">
                <span className="h-2 w-2 rounded-full bg-slate-300" />
                Opportunities
              </button>

              <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100">
                <span className="h-2 w-2 rounded-full bg-slate-300" />
                Assessments
              </button>

              <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100">
                <span className="h-2 w-2 rounded-full bg-slate-300" />
                Activity
              </button>
            </div>
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Profile
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-900">
                Keep your evidence updated
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                A stronger verified profile helps you become more discoverable.
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white px-5 sm:px-8">
            <div className="flex h-20 items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Student workspace</p>

                <h1 className="text-lg font-semibold text-slate-950">
                  Dashboard
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

            <nav className="flex gap-2 overflow-x-auto pb-4 lg:hidden">
              <button className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white">
                Dashboard
              </button>

              <Link
                href="/profile"
                className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600"
              >
                My Profile
              </Link>

              <button className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                Opportunities
              </button>

              <button className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                Assessments
              </button>

              <button className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                Activity
              </button>
            </nav>
          </header>

          <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
            <section>
              <p className="text-sm font-medium text-slate-500">
                Welcome back
              </p>

              <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                {user?.displayName ?? "Student"}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Your employability journey starts with strong evidence,
                relevant skills, and a complete professional profile.
              </p>
            </section>

            <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Profile completion
                </p>

                <div className="mt-4 flex items-end justify-between">
                  <p className="text-3xl font-bold text-slate-950">
                    {profileCompletion === null
                      ? "—"
                      : `${profileCompletion}%`}
                  </p>

                  <p className="text-xs font-semibold text-slate-500">
                    {profileCompletion === null
                      ? "Loading"
                      : profileCompletion >= 80
                        ? "Strong"
                        : profileCompletion >= 50
                          ? "In progress"
                          : "Needs attention"}
                  </p>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all duration-500"
                    style={{
                      width: `${profileCompletion ?? 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Skills listed
                </p>

                <p className="mt-4 text-3xl font-bold text-slate-950">
                  {skillsListed === null ? "—" : skillsListed}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Skills currently added to your profile
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Active opportunities
                </p>

                <p className="mt-4 text-3xl font-bold text-slate-950">
                  {activeOpportunities === null
                    ? "—"
                    : activeOpportunities}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Published roles currently available
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Assessments
                </p>

                <p className="mt-4 text-3xl font-bold text-slate-950">
                  {availableAssessments === null
                    ? "—"
                    : availableAssessments}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Assessments currently unlocked
                </p>
              </div>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Employability readiness
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      A student-facing overview of the areas that matter most.
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    On track
                  </span>
                </div>

                <div className="mt-6 space-y-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        Academic foundation
                      </span>

                      <span className="text-sm font-semibold text-slate-900">
                        Strong
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-900"
                        style={{ width: "84%" }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        Technical skills
                      </span>

                      <span className="text-sm font-semibold text-slate-900">
                        Good
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-900"
                        style={{ width: "68%" }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        Projects & experience
                      </span>

                      <span className="text-sm font-semibold text-slate-900">
                        Developing
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-900"
                        style={{ width: "56%" }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        Evidence completeness
                      </span>

                      <span className="text-sm font-semibold text-slate-900">
                        Needs attention
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-900"
                        style={{ width: "48%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Recommended next steps
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Small actions that strengthen your employability profile.
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Complete your profile
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Add missing academic and professional information.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Add project evidence
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Back your projects with verifiable evidence.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Explore opportunities
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Review roles that match your current profile.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Upcoming opportunities
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Roles currently published on PlaceKaro.
                    </p>
                  </div>

                  <span className="text-xs font-semibold text-slate-400">
                    {activeOpportunities === null
                      ? "Loading"
                      : `${activeOpportunities} available`}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {publishedJobs.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-5">
                      <p className="text-sm font-medium text-slate-700">
                        No published opportunities yet
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        New opportunities will appear here when companies
                        publish roles.
                      </p>
                    </div>
                  ) : (
                    publishedJobs.slice(0, 3).map((job) => (
                      <div
                        key={job.id}
                        className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {job.title}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Published opportunity · Open for eligible
                              students
                            </p>
                          </div>

                          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            Open
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Recent activity
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Your latest activity on PlaceKaro.
                    </p>
                  </div>

                  {recentNotifications.length > 0 && (
                    <span className="text-xs font-semibold text-slate-400">
                      {recentNotifications.length} recent
                    </span>
                  )}
                </div>

                <div className="mt-5">
                  {recentNotifications.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-5">
                      <p className="text-sm font-medium text-slate-700">
                        No recent activity
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Notifications and important updates will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="flex gap-3"
                        >
                          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-900" />

                          <div className="min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-medium text-slate-800">
                                {notification.title}
                              </p>

                              {!notification.isRead && (
                                <span className="shrink-0 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                                  New
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <RoleGuard allowedRoles={["student"]}>
      <DashboardContent />
    </RoleGuard>
  );
}