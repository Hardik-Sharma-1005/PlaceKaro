/**
 * lib/store/assessmentStore.ts
 *
 * LocalStorage-backed store for assessments, questions, applications,
 * and assessment results. Serves as the single source of truth when
 * Firebase is not authenticated (which is the demo/dev mode for the
 * placement cell dashboard). All state survives page refresh.
 *
 * Placement Cell flow:
 *   1. Placement cell creates an assessment for a job drive.
 *   2. Placement cell adds MCQ questions.
 *   3. Placement cell publishes the assessment.
 *   4. Student visits /student/jobs/[id]/assessment and takes the test.
 *   5. On submission, score is calculated and stored.
 *   6. Placement cell visits Manage Drive → Applicants tab → sees scores.
 *   7. Placement cell shortlists / rejects applicants.
 */

import type {
  Assessment,
  AssessmentQuestion,
  Application,
  AssessmentResult,
} from "../../types/database";

// ─── Storage Keys ───────────────────────────────────────────────────────────
const KEYS = {
  assessments: "pk_assessments",
  questions: "pk_questions",
  applications: "pk_applications",
  results: "pk_results",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function load<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ─── Seed Data ───────────────────────────────────────────────────────────────
// Pre-populate demo data for job-001 so placement cell can immediately see
// a working assessment + applicants with scores.

const SEED_ASSESSMENT_ID = "seed-asmt-001";
const SEED_JOB_ID = "job-001";

function seedIfEmpty() {
  if (typeof window === "undefined") return;

  // Assessments
  const asmts = load<Assessment>(KEYS.assessments);
  if (!asmts.find((a) => a.jobId === SEED_JOB_ID)) {
    asmts.push({
      id: SEED_ASSESSMENT_ID,
      jobId: SEED_JOB_ID,
      title: "Frontend Technical Round",
      durationMinutes: 60,
      totalMarks: 20,
      published: true,
      createdAt: Date.now() - 86400000 * 2,
    });
    save(KEYS.assessments, asmts);
  }

  // Questions
  const qs = load<AssessmentQuestion>(KEYS.questions);
  if (!qs.find((q) => q.assessmentId === SEED_ASSESSMENT_ID)) {
    qs.push(
      {
        id: "seed-q-1",
        assessmentId: SEED_ASSESSMENT_ID,
        question: "What is the virtual DOM in React?",
        type: "mcq",
        options: {
          A: "A direct copy of the real DOM",
          B: "A lightweight JavaScript representation of the DOM",
          C: "A browser feature for faster rendering",
          D: "A CSS framework",
        },
        correctAnswer: "B",
        marks: 10,
      },
      {
        id: "seed-q-2",
        assessmentId: SEED_ASSESSMENT_ID,
        question: "Which hook is used for side effects in React?",
        type: "mcq",
        options: {
          A: "useState",
          B: "useContext",
          C: "useEffect",
          D: "useReducer",
        },
        correctAnswer: "C",
        marks: 10,
      }
    );
    save(KEYS.questions, qs);
  }

  // Seed 4 applications
  const apps = load<Application>(KEYS.applications);
  const seedApps: Array<Omit<Application, "id"> & { id: string }> = [
    { id: "seed-app-1", studentId: "stu-001", jobId: SEED_JOB_ID, status: "applied", assessmentUnlocked: true, appliedAt: Date.now() - 86400000 * 3 },
    { id: "seed-app-2", studentId: "stu-002", jobId: SEED_JOB_ID, status: "applied", assessmentUnlocked: true, appliedAt: Date.now() - 86400000 * 2 },
    { id: "seed-app-3", studentId: "stu-003", jobId: SEED_JOB_ID, status: "applied", assessmentUnlocked: true, appliedAt: Date.now() - 86400000 },
    { id: "seed-app-4", studentId: "stu-004", jobId: SEED_JOB_ID, status: "applied", assessmentUnlocked: true, appliedAt: Date.now() - 86400000 },
  ];
  for (const sa of seedApps) {
    if (!apps.find((a) => a.id === sa.id)) apps.push(sa);
  }
  save(KEYS.applications, apps);

  // Seed assessment results for 3 of the 4 (stu-004 is pending)
  const results = load<AssessmentResult>(KEYS.results);
  const seedResults: AssessmentResult[] = [
    { id: "seed-res-1", assessmentId: SEED_ASSESSMENT_ID, jobId: SEED_JOB_ID, studentId: "stu-001", score: 18, totalMarks: 20, percentage: 90, status: "qualified", submittedAt: Date.now() - 86400000 },
    { id: "seed-res-2", assessmentId: SEED_ASSESSMENT_ID, jobId: SEED_JOB_ID, studentId: "stu-002", score: 15, totalMarks: 20, percentage: 75, status: "qualified", submittedAt: Date.now() - 86400000 },
    { id: "seed-res-3", assessmentId: SEED_ASSESSMENT_ID, jobId: SEED_JOB_ID, studentId: "stu-003", score: 8,  totalMarks: 20, percentage: 40, status: "not_qualified", submittedAt: Date.now() - 86400000 },
  ];
  for (const sr of seedResults) {
    if (!results.find((r) => r.id === sr.id)) results.push(sr);
  }
  save(KEYS.results, results);
}

// ─── Assessment Store API ────────────────────────────────────────────────────
export const assessmentStore = {
  /** Initialize seed data (call once on app load or per-page) */
  init() {
    seedIfEmpty();
  },

  // ── Assessments ──────────────────────────────────────────────────────────

  getAssessmentByJobId(jobId: string): Assessment | null {
    return load<Assessment>(KEYS.assessments).find((a) => a.jobId === jobId) ?? null;
  },

  getAllAssessments(): Assessment[] {
    return load<Assessment>(KEYS.assessments);
  },

  createAssessment(data: Omit<Assessment, "id" | "createdAt">): Assessment {
    const asmts = load<Assessment>(KEYS.assessments);
    const newAsmt: Assessment = { ...data, id: uid(), createdAt: Date.now() };
    asmts.push(newAsmt);
    save(KEYS.assessments, asmts);
    return newAsmt;
  },

  updateAssessment(id: string, updates: Partial<Assessment>): Assessment | null {
    const asmts = load<Assessment>(KEYS.assessments);
    const idx = asmts.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    asmts[idx] = { ...asmts[idx], ...updates };
    save(KEYS.assessments, asmts);
    return asmts[idx];
  },

  deleteAssessment(id: string): void {
    // Also remove questions
    const qs = load<AssessmentQuestion>(KEYS.questions).filter((q) => q.assessmentId !== id);
    save(KEYS.questions, qs);
    const asmts = load<Assessment>(KEYS.assessments).filter((a) => a.id !== id);
    save(KEYS.assessments, asmts);
  },

  // ── Questions ────────────────────────────────────────────────────────────

  getQuestionsByAssessmentId(assessmentId: string): AssessmentQuestion[] {
    return load<AssessmentQuestion>(KEYS.questions).filter((q) => q.assessmentId === assessmentId);
  },

  addQuestion(data: Omit<AssessmentQuestion, "id">): AssessmentQuestion {
    const qs = load<AssessmentQuestion>(KEYS.questions);
    const q: AssessmentQuestion = { ...data, id: uid() };
    qs.push(q);
    save(KEYS.questions, qs);
    return q;
  },

  updateQuestion(id: string, updates: Partial<AssessmentQuestion>): AssessmentQuestion | null {
    const qs = load<AssessmentQuestion>(KEYS.questions);
    const idx = qs.findIndex((q) => q.id === id);
    if (idx === -1) return null;
    qs[idx] = { ...qs[idx], ...updates };
    save(KEYS.questions, qs);
    return qs[idx];
  },

  deleteQuestion(id: string): void {
    const qs = load<AssessmentQuestion>(KEYS.questions).filter((q) => q.id !== id);
    save(KEYS.questions, qs);
  },

  // ── Applications ─────────────────────────────────────────────────────────

  getApplication(studentId: string, jobId: string): Application | null {
    return load<Application>(KEYS.applications).find(
      (a) => a.studentId === studentId && a.jobId === jobId
    ) ?? null;
  },

  getApplicationsForJob(jobId: string): Application[] {
    return load<Application>(KEYS.applications).filter((a) => a.jobId === jobId);
  },

  createOrGetApplication(studentId: string, jobId: string): Application {
    const existing = this.getApplication(studentId, jobId);
    if (existing) return existing;
    const apps = load<Application>(KEYS.applications);
    const app: Application = {
      id: uid(),
      studentId,
      jobId,
      status: "applied",
      assessmentUnlocked: true,
      appliedAt: Date.now(),
    };
    apps.push(app);
    save(KEYS.applications, apps);
    return app;
  },

  updateApplicationStatus(appId: string, status: Application["status"]): void {
    const apps = load<Application>(KEYS.applications);
    const idx = apps.findIndex((a) => a.id === appId);
    if (idx === -1) return;
    apps[idx].status = status;
    save(KEYS.applications, apps);
  },

  // ── Assessment Results ───────────────────────────────────────────────────

  getResultByStudentAndJob(studentId: string, jobId: string): AssessmentResult | null {
    return load<AssessmentResult>(KEYS.results).find(
      (r) => r.studentId === studentId && r.jobId === jobId
    ) ?? null;
  },

  getResultsByJob(jobId: string): AssessmentResult[] {
    return load<AssessmentResult>(KEYS.results).filter((r) => r.jobId === jobId);
  },

  submitResult(data: Omit<AssessmentResult, "id" | "submittedAt">): AssessmentResult {
    const results = load<AssessmentResult>(KEYS.results);
    // Prevent duplicate submission
    const existing = results.findIndex(
      (r) => r.studentId === data.studentId && r.jobId === data.jobId
    );
    const result: AssessmentResult = { ...data, id: uid(), submittedAt: Date.now() };
    if (existing >= 0) {
      results[existing] = result; // overwrite if re-taking
    } else {
      results.push(result);
    }
    save(KEYS.results, results);
    return result;
  },
};


