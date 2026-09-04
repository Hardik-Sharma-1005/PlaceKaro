"use client";

/**
 * /student/jobs/[id]/assessment
 *
 * Student-facing MCQ assessment interface.
 * - Reads from assessmentStore (localStorage) — no Firebase reads needed.
 * - Auto-starts the timer when questions load.
 * - Auto-submits when time runs out.
 * - Calculates score client-side and stores result in localStorage.
 * - Shows result screen with score, percentage, qualified/not_qualified status.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { assessmentStore } from "../../../../../lib/store/assessmentStore";
import type { Assessment, AssessmentQuestion, AssessmentResult } from "../../../../../types/database";

const DEMO_STUDENT_ID = "stu-004"; // The student who hasn't taken the test yet

export default function StudentAssessmentPage() {
  const params = useParams();
  const jobId = params.id as string;

  // In a real app, studentId would come from auth context.
  // For demo purposes, we use stu-004 (the pending student).
  const studentId = DEMO_STUDENT_ID;

  const [phase, setPhase] = useState<"loading" | "locked" | "no_assessment" | "test" | "result">("loading");
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const submitTest = useCallback((finalAnswers: Record<string, string>, asmt: Assessment, qs: AssessmentQuestion[]) => {
    if (submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    let score = 0;
    qs.forEach((q) => {
      if (finalAnswers[q.id] === q.correctAnswer) score += q.marks;
    });

    const percentage = asmt.totalMarks > 0 ? Math.round((score / asmt.totalMarks) * 100 * 10) / 10 : 0;
    const status: AssessmentResult["status"] = percentage >= 50 ? "qualified" : "not_qualified";

    const res = assessmentStore.submitResult({
      assessmentId: asmt.id,
      jobId,
      studentId,
      score,
      totalMarks: asmt.totalMarks,
      percentage,
      status,
    });

    setResult(res);
    setPhase("result");
    setSubmitting(false);
  }, [jobId, studentId, submitting]);

  useEffect(() => {
    assessmentStore.init();

    // Check if student already has a result
    const existingResult = assessmentStore.getResultByStudentAndJob(studentId, jobId);
    if (existingResult) {
      const asmt = assessmentStore.getAssessmentByJobId(jobId);
      setAssessment(asmt);
      setResult(existingResult);
      setPhase("result");
      return;
    }

    // Check if application is unlocked
    const app = assessmentStore.createOrGetApplication(studentId, jobId);
    if (!app.assessmentUnlocked) {
      setPhase("locked");
      return;
    }

    // Load assessment
    const asmt = assessmentStore.getAssessmentByJobId(jobId);
    if (!asmt || !asmt.published) {
      setPhase("no_assessment");
      return;
    }

    setAssessment(asmt);
    const qs = assessmentStore.getQuestionsByAssessmentId(asmt.id);
    setQuestions(qs);
    setTimeLeft(asmt.durationMinutes * 60);
    setPhase("test");
  }, [jobId, studentId]);

  // Timer
  useEffect(() => {
    if (phase !== "test") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Auto-submit with current answers
          setAnswers((currentAnswers) => {
            if (assessment && questions.length > 0) {
              submitTest(currentAnswers, assessment, questions);
            }
            return currentAnswers;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, assessment, questions, submitTest]);

  const handleSelect = (qId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: option }));
  };

  const handleManualSubmit = () => {
    if (!assessment) return;
    submitTest(answers, assessment, questions);
  };

  const fmtTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).length;

  /* ──────────────────────── PHASE SCREENS ──────────────────────── */

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-semibold text-indigo-900">Loading assessment…</p>
        </div>
      </div>
    );
  }

  if (phase === "locked") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xs ring-1 ring-slate-200 p-8 max-w-md w-full text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center mb-5 text-2xl">🔒</div>
          <h2 className="text-xl font-bold text-slate-900">Assessment Locked</h2>
          <p className="mt-2 text-sm text-slate-500 mb-6">
            You haven't applied to this drive or the assessment isn't unlocked yet.
          </p>
          <Link href="/placement/jobs" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition">
            Return to Drives
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "no_assessment") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xs ring-1 ring-slate-200 p-8 max-w-md w-full text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-5 text-2xl">📋</div>
          <h2 className="text-xl font-bold text-slate-900">Assessment Not Available</h2>
          <p className="mt-2 text-sm text-slate-500 mb-6">
            The placement cell hasn't published an assessment for this drive yet. Check back soon.
          </p>
          <Link href="/placement/jobs" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition">
            Return to Drives
          </Link>
        </div>
      </div>
    );
  }

  /* ── RESULT SCREEN ── */
  if (phase === "result" && result && assessment) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="mx-auto max-w-lg space-y-5">
          {/* Result card */}
          <div className="bg-white rounded-2xl shadow-xs ring-1 ring-slate-200 p-8 text-center">
            <div className={`mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-5 text-3xl ${
              result.status === "qualified" ? "bg-emerald-50" : "bg-red-50"
            }`}>
              {result.status === "qualified" ? "🎉" : "📋"}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Assessment Submitted!</h1>
            <p className="text-sm text-slate-500 mt-1 mb-8">
              <span className="font-semibold text-slate-700">{assessment.title}</span>
            </p>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Score</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">{result.score}<span className="text-base text-slate-400">/{result.totalMarks}</span></p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Percentage</p>
                <p className="mt-1 text-2xl font-extrabold text-indigo-600">{result.percentage}%</p>
              </div>
              <div className={`rounded-xl p-4 border ${
                result.status === "qualified"
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-red-50 border-red-200"
              }`}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Result</p>
                <p className={`mt-1 text-sm font-extrabold ${
                  result.status === "qualified" ? "text-emerald-700" : "text-red-700"
                }`}>
                  {result.status === "qualified" ? "✓ Qualified" : "✗ Not Qualified"}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400">Pass threshold: 50% · Submitted {new Date(result.submittedAt).toLocaleTimeString()}</p>
          </div>

          <Link
            href="/placement/jobs"
            className="block w-full text-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition"
          >
            Return to Drives
          </Link>
        </div>
      </div>
    );
  }

  /* ── TEST INTERFACE ── */
  if (phase !== "test" || !assessment) return null;

  const isLast = answeredCount === questions.length;
  const urgent = timeLeft < 300 && timeLeft > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sticky header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900 truncate max-w-xs">{assessment.title}</p>
              <p className="text-[11px] text-slate-500">
                {answeredCount} / {questions.length} answered · {assessment.totalMarks} marks
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Progress ring */}
              <div className="hidden sm:flex flex-wrap gap-1">
                {questions.map((q) => (
                  <div
                    key={q.id}
                    className={`h-2.5 w-2.5 rounded-full ${answers[q.id] ? "bg-indigo-600" : "bg-slate-200"}`}
                    title={`Q${questions.indexOf(q) + 1}`}
                  />
                ))}
              </div>
              {/* Timer */}
              <div className={`flex flex-col items-end px-3 py-1.5 rounded-xl ${urgent ? "bg-red-50 animate-pulse" : "bg-slate-50"}`}>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Time Left</span>
                <span className={`text-lg font-extrabold ${urgent ? "text-red-600" : "text-slate-900"}`}>
                  {fmtTime(timeLeft)}
                </span>
              </div>
              <button
                onClick={handleManualSubmit}
                disabled={submitting}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {submitting ? "Submitting…" : isLast ? "Submit Test ✓" : "Submit Test"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Questions */}
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 pb-24">
        {questions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-sm text-slate-500">No questions found in this assessment.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                id={`q-${idx + 1}`}
                className="bg-white rounded-2xl shadow-xs ring-1 ring-slate-200 p-6 sm:p-8"
              >
                {/* Question header */}
                <div className="flex gap-4 mb-5">
                  <span className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full text-sm font-extrabold ${
                    answers[q.id] ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-slate-900 whitespace-pre-wrap leading-relaxed">
                      {q.question}
                    </p>
                    <p className="text-[11px] text-slate-400 font-semibold mt-1">{q.marks} Mark{q.marks !== 1 ? "s" : ""}</p>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-2.5 ml-12">
                  {Object.entries(q.options).map(([key, val]) => {
                    const selected = answers[q.id] === key;
                    return (
                      <label
                        key={key}
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition select-none ${
                          selected
                            ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500"
                            : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={key}
                          checked={selected}
                          onChange={() => handleSelect(q.id, key)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-600"
                        />
                        <span className={`text-sm ${selected ? "font-semibold text-indigo-900" : "text-slate-700"}`}>
                          <span className="font-bold mr-2">{key}.</span>{val}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Bottom submit */}
            <div className="flex justify-end pt-4 pb-8">
              <button
                onClick={handleManualSubmit}
                disabled={submitting}
                className={`rounded-xl px-8 py-3 text-sm font-bold text-white transition ${
                  isLast
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-indigo-600 hover:bg-indigo-700"
                } disabled:opacity-50`}
              >
                {submitting
                  ? "Submitting…"
                  : isLast
                  ? `✓ Submit — ${answeredCount}/${questions.length} answered`
                  : `Submit (${answeredCount}/${questions.length} answered)`}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
