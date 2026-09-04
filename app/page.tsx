"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/context/AuthContext";
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

function PublicLandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#090909] text-white">
      {/* Ambient gold lighting */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-280px] h-[650px] w-[900px] -translate-x-1/2 rounded-full bg-[#F5B900]/12 blur-3xl" />
        <div className="absolute right-[-180px] top-[30%] h-[450px] w-[450px] rounded-full bg-[#F5B900]/8 blur-3xl" />
        <div className="absolute bottom-[-250px] left-[-150px] h-[500px] w-[500px] rounded-full bg-[#F5B900]/6 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#090909]/85 backdrop-blur-xl">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <Image
              src="/placekaro-logo.png"
              alt="PlaceKaro"
              width={180}
              height={180}
              className="h-12 w-12 rounded-full object-cover sm:h-14 sm:w-14"
              priority
            />

            <div className="ml-3 hidden sm:block">
              <div className="text-lg font-bold tracking-tight text-white">
                Place<span className="text-[#F5B900]">Karo</span>
              </div>

              <div className="text-[9px] uppercase tracking-[0.22em] text-slate-500">
                Placement Intelligence
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-4 sm:gap-7">
            <Link
              href="/auth"
              className="text-sm font-semibold text-slate-300 transition hover:text-[#F5B900]"
            >
              Log in
            </Link>

            <Link
              href="/auth"
              className="rounded-xl bg-[#F5B900] px-4 py-2.5 text-sm font-bold text-[#090909] shadow-lg shadow-[#F5B900]/10 transition hover:bg-[#FFC928]"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative">
          <div className="mx-auto max-w-7xl px-6 pb-24 pt-20 lg:px-8 lg:pb-32 lg:pt-28">
            <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#F5B900]/20 bg-[#F5B900]/8 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#F5B900]">
                  <span className="h-2 w-2 rounded-full bg-[#F5B900] shadow-[0_0_12px_rgba(245,185,0,0.8)]" />
                  Placement Intelligence Platform
                </div>

                <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
                  Where talent meets
                  <span className="block text-[#F5B900]">
                    opportunity.
                  </span>
                </h1>

                <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                  PlaceKaro brings students, recruiters, and placement cells
                  into one intelligent ecosystem — powered by verified
                  profiles, hard eligibility, transparent PIS, and structured
                  assessments.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/auth"
                    className="rounded-xl bg-[#F5B900] px-6 py-3.5 text-center text-sm font-black text-[#090909] shadow-xl shadow-[#F5B900]/10 transition hover:bg-[#FFC928]"
                  >
                    Enter PlaceKaro →
                  </Link>

                  <a
                    href="#ecosystem"
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-center text-sm font-semibold text-slate-200 transition hover:border-[#F5B900]/30 hover:bg-[#F5B900]/5 hover:text-[#F5B900]"
                  >
                    See how it works
                  </a>
                </div>

                <div className="mt-11 grid max-w-xl grid-cols-3 gap-6 border-t border-white/10 pt-7">
                  <div>
                    <p className="text-2xl font-black text-white">3</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Stakeholders
                      <br />
                      connected
                    </p>
                  </div>

                  <div>
                    <p className="text-2xl font-black text-[#F5B900]">0–100</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Transparent
                      <br />
                      PIS scale
                    </p>
                  </div>

                  <div>
                    <p className="text-2xl font-black text-white">1</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Connected
                      <br />
                      workflow
                    </p>
                  </div>
                </div>
              </div>

              {/* Product visual */}
              <div className="relative">
                <div className="absolute -inset-8 rounded-[2rem] bg-[#F5B900]/8 blur-3xl" />

                <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.04] p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
                  <div className="rounded-[1.5rem] border border-[#F5B900]/15 bg-[#111111] p-5 sm:p-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[#F5B900]/30 bg-black">
                          <Image
                            src="/placekaro-logo.png"
                            alt=""
                            width={80}
                            height={80}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            PlaceKaro
                          </p>
                          <p className="mt-1 text-sm font-bold text-white">
                            Candidate Intelligence
                          </p>
                        </div>
                      </div>

                      <div className="rounded-full border border-[#F5B900]/20 bg-[#F5B900]/10 px-3 py-1.5 text-[11px] font-bold text-[#F5B900]">
                        LIVE
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <MetricCard
                        title="Profile strength"
                        value="84%"
                        label="Strong"
                        width="84%"
                      />

                      <MetricCard
                        title="Placement Intelligence"
                        value="87"
                        label="/ 100"
                        width="87%"
                        gold
                      />
                    </div>

                    <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Matched opportunity
                          </p>

                          <p className="mt-1 text-sm font-bold text-white">
                            Software Management Intern
                          </p>
                        </div>

                        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold text-emerald-300">
                          ELIGIBLE
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <MiniMetric value="9.1" label="Academics" />
                        <MiniMetric value="92%" label="Skills" />
                        <MiniMetric value="4" label="Projects" />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Recruitment status
                        </p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          Profile → Eligibility → PIS → Assessment
                        </p>
                      </div>

                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#F5B900]/25 bg-[#F5B900]/10 text-lg text-[#F5B900]">
                        ✓
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gold divider */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="h-px bg-gradient-to-r from-transparent via-[#F5B900]/60 to-transparent" />
        </div>

        {/* Ecosystem */}
        <section
          id="ecosystem"
          className="bg-[#F7F7F5] text-slate-900"
        >
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#A77C00]">
                The PlaceKaro ecosystem
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                One platform.
                <br />
                Three powerful perspectives.
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                Every stakeholder gets a focused workspace, while the complete
                placement process stays connected underneath.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              <RoleCard
                number="01"
                title="Students"
                description="Build a verified profile, discover relevant opportunities, complete assessments, and keep every step of your placement journey organized."
                highlights={[
                  "Profile & evidence",
                  "Opportunity discovery",
                  "Applications & assessments",
                ]}
              />

              <RoleCard
                number="02"
                title="Recruiters"
                description="Create structured jobs, define hard eligibility, configure recruiter-weighted PIS, and evaluate candidates using meaningful intelligence."
                highlights={[
                  "Job creation",
                  "Eligibility & PIS",
                  "Candidate intelligence",
                ]}
              />

              <RoleCard
                number="03"
                title="Placement Cells"
                description="Control approvals, oversee institutional activity, verify information, and bring placement operations into one centralized workspace."
                highlights={[
                  "Job approvals",
                  "Student oversight",
                  "Placement intelligence",
                ]}
              />
            </div>
          </div>
        </section>

        {/* Intelligence section */}
        <section className="bg-[#090909]">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#F5B900]">
                  Built differently
                </p>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Placement decisions should be based on intelligence,
                  not guesswork.
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                  PlaceKaro keeps eligibility, scoring, evidence, and
                  assessments as distinct but connected parts of the
                  recruitment journey.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DarkFeatureCard
                  number="01"
                  title="Verified evidence"
                  description="Organize student information around evidence rather than disconnected claims."
                />

                <DarkFeatureCard
                  number="02"
                  title="Transparent PIS"
                  description="Recruiters control what matters without hiding the logic behind a black box."
                />

                <DarkFeatureCard
                  number="03"
                  title="Hard eligibility"
                  description="Non-negotiable criteria stay separate from intelligent candidate scoring."
                />

                <DarkFeatureCard
                  number="04"
                  title="Structured assessment"
                  description="Move from profile screening to focused evaluation through one connected workflow."
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#F7F7F5] text-slate-900">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-black p-8 shadow-xl sm:p-12">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#F5B900]/15 blur-3xl" />

              <div className="relative max-w-3xl">
                <div className="flex items-center gap-4">
                  <Image
                    src="/placekaro-logo.png"
                    alt="PlaceKaro"
                    width={96}
                    height={96}
                    className="h-14 w-14 rounded-full object-cover"
                  />

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#F5B900]">
                      Start with PlaceKaro
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Placement intelligence, connected.
                    </p>
                  </div>
                </div>

                <h2 className="mt-7 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Make every placement decision count.
                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                  Whether you're building your profile, hiring talent, or
                  running a placement cell, PlaceKaro brings the workflow
                  together.
                </p>

                <div className="mt-8">
                  <Link
                    href="/auth"
                    className="inline-flex rounded-xl bg-[#F5B900] px-6 py-3.5 text-sm font-black text-[#090909] transition hover:bg-[#FFC928]"
                  >
                    Enter PlaceKaro →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#090909]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <Image
              src="/placekaro-logo.png"
              alt="PlaceKaro"
              width={56}
              height={56}
              className="h-8 w-8 rounded-full object-cover"
            />

            <span>PlaceKaro · Placement Intelligence Platform</span>
          </div>

          <span>Built for students, recruiters, and placement cells.</span>
        </div>
      </footer>
    </div>
  );
}

function MetricCard({
  title,
  value,
  label,
  width,
  gold = false,
}: {
  title: string;
  value: string;
  label: string;
  width: string;
  gold?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>

      <div className="mt-4 flex items-end justify-between">
        <p className="text-3xl font-black text-white">{value}</p>

        <span
          className={`text-xs font-bold ${
            gold ? "text-[#F5B900]" : "text-emerald-300"
          }`}
        >
          {label}
        </span>
      </div>

      <div className="mt-4 h-2 rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${
            gold ? "bg-[#F5B900]" : "bg-white"
          }`}
          style={{ width }}
        />
      </div>
    </div>
  );
}

function MiniMetric({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/30 px-2 py-3 text-center">
      <p className="text-sm font-black text-white">{value}</p>
      <p className="mt-1 text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

function RoleCard({
  number,
  title,
  description,
  highlights,
}: {
  number: string;
  title: string;
  description: string;
  highlights: string[];
}) {
  return (
    <div className="group rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#DDB13A] hover:shadow-xl">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-[#FFF4C7] px-3 py-1 text-[11px] font-black text-[#8A6500]">
          {number}
        </span>

        <span className="h-2.5 w-2.5 rounded-full bg-[#F5B900]" />
      </div>

      <h3 className="mt-7 text-2xl font-black tracking-tight text-slate-950">
        For {title}
      </h3>

      <p className="mt-4 text-sm leading-7 text-slate-600">
        {description}
      </p>

      <div className="mt-7 space-y-3 border-t border-slate-100 pt-6">
        {highlights.map((highlight) => (
          <div
            key={highlight}
            className="flex items-center gap-3 text-sm font-semibold text-slate-700"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFF4C7] text-xs font-black text-[#8A6500]">
              ✓
            </span>
            {highlight}
          </div>
        ))}
      </div>

      <Link
        href="/auth"
        className="mt-8 inline-flex text-sm font-black text-[#8A6500] transition hover:text-[#5F4500]"
      >
        Enter {title} portal →
      </Link>
    </div>
  );
}

function DarkFeatureCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 transition hover:border-[#F5B900]/30 hover:bg-[#F5B900]/5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black tracking-[0.16em] text-[#F5B900]">
          {number}
        </span>

        <span className="h-1.5 w-8 rounded-full bg-[#F5B900]" />
      </div>

      <h3 className="mt-6 text-base font-black text-white">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function StudentDashboard() {
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
      if (!user?.uid) return;

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
      if (!user?.uid) return;

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
      if (!user?.uid) return;

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
      if (!user?.uid) return;

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
      if (!user?.uid) return;

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
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
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

              <Link
                href="/profile"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:underline"
              >
                <span>Edit Portfolio & Evidence</span>
                <span>→</span>
              </Link>
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
                className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
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
              <Link
                href="/profile"
                className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    Profile completion
                  </p>

                  <span className="text-xs text-slate-400 transition group-hover:text-slate-900">
                    Manage →
                  </span>
                </div>

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
              </Link>

              <Link
                href="/profile"
                className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    Skills listed
                  </p>

                  <span className="text-xs text-slate-400 transition group-hover:text-slate-900">
                    Manage →
                  </span>
                </div>

                <p className="mt-4 text-3xl font-bold text-slate-950">
                  {skillsListed === null ? "—" : skillsListed}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Skills currently added to your profile
                </p>
              </Link>

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
                  {[
                    ["Academic foundation", "Strong", "84%"],
                    ["Technical skills", "Good", "68%"],
                    ["Projects & experience", "Developing", "56%"],
                    ["Evidence completeness", "Needs attention", "48%"],
                  ].map(([label, status, width]) => (
                    <div key={label}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">
                          {label}
                        </span>

                        <span className="text-sm font-semibold text-slate-900">
                          {status}
                        </span>
                      </div>

                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-900"
                          style={{ width }}
                        />
                      </div>
                    </div>
                  ))}
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
                  <Link
                    href="/profile"
                    className="block rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      Complete your profile
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Add missing academic and professional information.
                    </p>
                  </Link>

                  <Link
                    href="/profile"
                    className="block rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      Add project evidence
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Back your projects with verifiable evidence.
                    </p>
                  </Link>

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
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;

    if (user.role === "company") {
      router.replace("/recruiter");
      return;
    }

    if (user.role === "placement") {
      router.replace("/placement");
      return;
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090909]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-[#F5B900]" />
          <p className="text-sm text-slate-300">Loading PlaceKaro...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <PublicLandingPage />;
  }

  if (user.role === "company" || user.role === "placement") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090909]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-[#F5B900]" />
          <p className="text-sm text-slate-300">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <StudentDashboard />;
}