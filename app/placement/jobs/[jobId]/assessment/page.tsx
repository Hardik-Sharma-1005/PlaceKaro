"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  assessmentStore,
} from "../../../../../lib/store/assessmentStore";
import type { Assessment, AssessmentQuestion } from "../../../../../types/database";

/* ────────────────────────────────────────────────────────────── */

export default function AssessmentCreatorPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // Create-assessment form
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("60");
  const [totalMarks, setTotalMarks] = useState("100");

  // Add-question form
  const [showQForm, setShowQForm] = useState(false);
  const [qText, setQText] = useState("");
  const [opts, setOpts] = useState({ A: "", B: "", C: "", D: "" });
  const [correct, setCorrect] = useState<"A" | "B" | "C" | "D">("A");
  const [qMarks, setQMarks] = useState("5");

  /* ── Edit-question state ── */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQText, setEditQText] = useState("");
  const [editOpts, setEditOpts] = useState({ A: "", B: "", C: "", D: "" });
  const [editCorrect, setEditCorrect] = useState<"A" | "B" | "C" | "D">("A");
  const [editQMarks, setEditQMarks] = useState("5");

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(() => {
    assessmentStore.init();
    const asmt = assessmentStore.getAssessmentByJobId(jobId);
    setAssessment(asmt);
    if (asmt) {
      setTitle(asmt.title);
      setDuration(asmt.durationMinutes.toString());
      setTotalMarks(asmt.totalMarks.toString());
      setQuestions(assessmentStore.getQuestionsByAssessmentId(asmt.id));
    }
    setLoading(false);
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  /* ── Create assessment ── */
  const handleCreate = () => {
    if (!title.trim()) return;
    setSaving(true);
    const newAsmt = assessmentStore.createAssessment({
      jobId,
      title: title.trim(),
      durationMinutes: Math.max(1, parseInt(duration) || 60),
      totalMarks: Math.max(1, parseInt(totalMarks) || 100),
      published: false,
    });
    setAssessment(newAsmt);
    setQuestions([]);
    setSaving(false);
    showToast("Assessment created ✓");
  };

  /* ── Update metadata ── */
  const handleUpdateMeta = () => {
    if (!assessment) return;
    const updated = assessmentStore.updateAssessment(assessment.id, {
      title: title.trim(),
      durationMinutes: Math.max(1, parseInt(duration) || 60),
      totalMarks: Math.max(1, parseInt(totalMarks) || 100),
    });
    if (updated) { setAssessment(updated); showToast("Saved ✓"); }
  };

  /* ── Publish / Unpublish ── */
  const handleTogglePublish = () => {
    if (!assessment) return;
    const updated = assessmentStore.updateAssessment(assessment.id, {
      published: !assessment.published,
    });
    if (updated) {
      setAssessment(updated);
      showToast(updated.published ? "Assessment is now LIVE 🎉" : "Assessment unpublished");
    }
  };

  /* ── Add question ── */
  const handleAddQuestion = () => {
    if (!assessment) return;
    if (!qText.trim() || !opts.A || !opts.B || !opts.C || !opts.D) {
      showToast("Fill all question fields", "err");
      return;
    }
    const q = assessmentStore.addQuestion({
      assessmentId: assessment.id,
      question: qText.trim(),
      type: "mcq",
      options: { ...opts },
      correctAnswer: correct,
      marks: Math.max(1, parseInt(qMarks) || 5),
    });
    setQuestions((prev) => [...prev, q]);
    setShowQForm(false);
    setQText(""); setOpts({ A: "", B: "", C: "", D: "" }); setCorrect("A"); setQMarks("5");
    showToast("Question added ✓");
  };

  /* ── Start editing a question ── */
  const startEdit = (q: AssessmentQuestion) => {
    setEditingId(q.id);
    setEditQText(q.question);
    setEditOpts({ A: q.options.A, B: q.options.B, C: q.options.C, D: q.options.D });
    setEditCorrect(q.correctAnswer as "A" | "B" | "C" | "D");
    setEditQMarks(q.marks.toString());
  };

  /* ── Save edited question ── */
  const handleSaveEdit = () => {
    if (!editingId) return;
    const updated = assessmentStore.updateQuestion(editingId, {
      question: editQText.trim(),
      options: { ...editOpts },
      correctAnswer: editCorrect,
      marks: Math.max(1, parseInt(editQMarks) || 5),
    });
    if (updated) {
      setQuestions((prev) => prev.map((q) => (q.id === editingId ? updated : q)));
    }
    setEditingId(null);
    showToast("Question updated ✓");
  };

  /* ── Delete question ── */
  const handleDelete = (id: string) => {
    assessmentStore.deleteQuestion(id);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    showToast("Question deleted");
  };

  /* ─────────────────────────── RENDER ──────────────────────────── */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg transition ${
          toast.type === "ok"
            ? "bg-emerald-600 text-white"
            : "bg-red-600 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href={`/placement/jobs/${jobId}`}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
              >
                ← Back to Drive
              </Link>
              <div className="h-4 w-px bg-slate-200" />
              <p className="text-sm font-bold text-slate-900">Assessment Creator</p>
            </div>
            {assessment && (
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                  assessment.published
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}>
                  {assessment.published ? "● LIVE" : "● Draft"}
                </span>
                <button
                  onClick={handleTogglePublish}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                    assessment.published
                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {assessment.published ? "Unpublish" : "Publish Assessment"}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">

        {/* ── Step 1: Create or edit assessment metadata ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 mb-5">
            {assessment ? "Assessment Details" : "Create New Assessment"}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Assessment Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Frontend Technical Round"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Duration (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Total Marks</label>
                <input
                  type="number"
                  min="1"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
                />
              </div>
            </div>
            <button
              disabled={!title.trim() || saving}
              onClick={assessment ? handleUpdateMeta : handleCreate}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {assessment ? "Update Details" : "Create Assessment →"}
            </button>
          </div>
        </div>

        {/* ── Step 2: Questions (only shown after assessment exists) ── */}
        {assessment && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Questions</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {questions.length} question{questions.length !== 1 ? "s" : ""} ·{" "}
                  {questions.reduce((s, q) => s + q.marks, 0)} / {assessment.totalMarks} marks allocated
                </p>
              </div>
              {!showQForm && (
                <button
                  onClick={() => setShowQForm(true)}
                  className="rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                >
                  + Add Question
                </button>
              )}
            </div>

            {/* Add-question form */}
            {showQForm && (
              <div className="bg-indigo-50 rounded-2xl border border-indigo-200 p-6">
                <h3 className="text-sm font-bold text-indigo-900 mb-4">New MCQ Question</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Question Text</label>
                    <textarea
                      rows={2}
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                      placeholder="e.g. What does REST stand for?"
                      className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(["A", "B", "C", "D"] as const).map((opt) => (
                      <div key={opt}>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Option {opt}</label>
                        <input
                          type="text"
                          value={opts[opt]}
                          onChange={(e) => setOpts((prev) => ({ ...prev, [opt]: e.target.value }))}
                          className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Correct Answer</label>
                      <select
                        value={correct}
                        onChange={(e) => setCorrect(e.target.value as "A" | "B" | "C" | "D")}
                        className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                      >
                        {["A", "B", "C", "D"].map((o) => (
                          <option key={o} value={o}>Option {o}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Marks for this question</label>
                      <input
                        type="number"
                        min="1"
                        value={qMarks}
                        onChange={(e) => setQMarks(e.target.value)}
                        className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => { setShowQForm(false); setQText(""); setOpts({ A: "", B: "", C: "", D: "" }); }}
                      className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddQuestion}
                      disabled={!qText.trim() || !opts.A || !opts.B || !opts.C || !opts.D}
                      className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                    >
                      Save Question
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Question list */}
            {questions.length === 0 && !showQForm && (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                <p className="text-sm text-slate-500">No questions yet.</p>
                <button
                  onClick={() => setShowQForm(true)}
                  className="mt-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Add your first question →
                </button>
              </div>
            )}

            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  {editingId === q.id ? (
                    /* ── Inline edit ── */
                    <div className="space-y-4">
                      <textarea
                        rows={2}
                        value={editQText}
                        onChange={(e) => setEditQText(e.target.value)}
                        className="w-full rounded-xl border border-indigo-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        {(["A", "B", "C", "D"] as const).map((opt) => (
                          <div key={opt}>
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Option {opt}</label>
                            <input
                              type="text"
                              value={editOpts[opt]}
                              onChange={(e) => setEditOpts((prev) => ({ ...prev, [opt]: e.target.value }))}
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Correct Answer</label>
                          <select
                            value={editCorrect}
                            onChange={(e) => setEditCorrect(e.target.value as "A" | "B" | "C" | "D")}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                          >
                            {["A", "B", "C", "D"].map((o) => (
                              <option key={o} value={o}>Option {o}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Marks</label>
                          <input
                            type="number"
                            min="1"
                            value={editQMarks}
                            onChange={(e) => setEditQMarks(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setEditingId(null)} className="text-sm text-slate-500 hover:text-slate-800">Cancel</button>
                        <button
                          onClick={handleSaveEdit}
                          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Display view ── */
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex gap-3 flex-1 min-w-0">
                        <span className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-indigo-50 text-xs font-extrabold text-indigo-700">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 whitespace-pre-wrap">{q.question}</p>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {Object.entries(q.options).map(([key, val]) => (
                              <div
                                key={key}
                                className={`text-xs p-2 rounded-lg border ${
                                  key === q.correctAnswer
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-900 font-bold"
                                    : "bg-slate-50 border-slate-200 text-slate-600"
                                }`}
                              >
                                <span className="font-bold mr-1">{key}.</span> {val}
                                {key === q.correctAnswer && (
                                  <span className="ml-1 text-emerald-600">✓</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                          {q.marks} pts
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(q)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(q.id)}
                            className="text-xs font-semibold text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Summary / Publish CTA */}
            {questions.length > 0 && (
              <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-indigo-900">
                    {questions.length} question{questions.length !== 1 ? "s" : ""} ready
                  </p>
                  <p className="text-xs text-indigo-600 mt-0.5">
                    {questions.reduce((s, q) => s + q.marks, 0)} marks allocated out of {assessment.totalMarks} total
                  </p>
                </div>
                <button
                  onClick={handleTogglePublish}
                  className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                    assessment.published
                      ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {assessment.published ? "Unpublish" : "🚀 Publish Now"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
