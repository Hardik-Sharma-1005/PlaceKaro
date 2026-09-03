"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { RoleGuard } from "../../../../../lib/components/RoleGuard";
import { assessmentService } from "../../../../../lib/services/assessmentService";
import { Assessment, AssessmentQuestion } from "../../../../../types/database";

function AssessmentCreatorContent() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Setup Form State
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("60");
  const [totalMarks, setTotalMarks] = useState("100");

  // New Question State
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [qText, setQText] = useState("");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [correct, setCorrect] = useState("A");
  const [qMarks, setQMarks] = useState("5");

  useEffect(() => {
    async function loadAssessment() {
      try {
        const existing = await assessmentService.getAssessmentByJobId(jobId);
        if (existing) {
          setAssessment(existing);
          setTitle(existing.title);
          setDuration(existing.durationMinutes.toString());
          setTotalMarks(existing.totalMarks.toString());
          
          const qs = await assessmentService.getQuestionsByAssessmentId(existing.id);
          setQuestions(qs);
        }
      } catch (error) {
        console.error("Failed to load assessment:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAssessment();
  }, [jobId]);

  const handleCreateAssessment = async () => {
    try {
      const id = await assessmentService.createAssessment({
        jobId,
        title,
        durationMinutes: parseInt(duration),
        totalMarks: parseInt(totalMarks),
        published: false
      });
      setAssessment({ id, jobId, title, durationMinutes: parseInt(duration), totalMarks: parseInt(totalMarks), published: false, createdAt: Date.now() });
    } catch (error) {
      console.error("Failed to create assessment", error);
    }
  };

  const handleAddQuestion = async () => {
    if (!assessment) return;
    try {
      const qData: Omit<AssessmentQuestion, "id"> = {
        assessmentId: assessment.id,
        question: qText,
        type: "mcq",
        options: { "A": optA, "B": optB, "C": optC, "D": optD },
        correctAnswer: correct,
        marks: parseInt(qMarks)
      };
      const id = await assessmentService.addQuestion(qData);
      setQuestions([...questions, { ...qData, id }]);
      
      // Reset form
      setShowQuestionForm(false);
      setQText(""); setOptA(""); setOptB(""); setOptC(""); setOptD(""); setCorrect("A"); setQMarks("5");
    } catch (error) {
      console.error("Failed to add question", error);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    try {
      await assessmentService.deleteQuestion(qId);
      setQuestions(questions.filter(q => q.id !== qId));
    } catch (error) {
      console.error("Failed to delete question", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/recruiter/jobs/${jobId}`} className="text-sm font-medium text-slate-500 hover:text-slate-900">
                &larr; Back to Job
              </Link>
              <div className="h-4 w-px bg-slate-300"></div>
              <p className="text-sm font-bold tracking-widest text-slate-900">Assessment Creator</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        
        {!assessment ? (
          <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-8 max-w-xl mx-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Create New Assessment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Assessment Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Frontend Technical Round" className="mt-1 block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-slate-900 sm:text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Duration (Minutes)</label>
                  <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-slate-900 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Total Marks</label>
                  <input type="number" value={totalMarks} onChange={e => setTotalMarks(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-slate-900 sm:text-sm" />
                </div>
              </div>
              <button 
                onClick={handleCreateAssessment}
                disabled={!title}
                className="w-full mt-4 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
              >
                Save & Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{assessment.title}</h1>
                <p className="text-sm text-slate-500 mt-1">{assessment.durationMinutes} Minutes • {assessment.totalMarks} Marks • {questions.length} Questions</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={async () => {
                    await assessmentService.updateAssessment(assessment.id, { published: !assessment.published });
                    setAssessment({ ...assessment, published: !assessment.published });
                  }}
                  className={`rounded-md px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
                    assessment.published 
                    ? "bg-slate-50 text-slate-700 ring-slate-300 hover:bg-slate-100" 
                    : "bg-emerald-600 text-white ring-transparent hover:bg-emerald-500"
                  }`}
                >
                  {assessment.published ? "Unpublish Assessment" : "Publish Assessment"}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-end">
              <h2 className="text-lg font-bold text-slate-900">Questions</h2>
              {!showQuestionForm && (
                <button 
                  onClick={() => setShowQuestionForm(true)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  + Add Question
                </button>
              )}
            </div>

            {showQuestionForm && (
              <div className="bg-indigo-50 rounded-xl p-6 ring-1 ring-indigo-200">
                <h3 className="text-sm font-bold text-indigo-900 mb-4">New Multiple Choice Question</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Question Text</label>
                    <textarea rows={2} value={qText} onChange={e => setQText(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {["A", "B", "C", "D"].map((opt) => (
                      <div key={opt}>
                        <label className="block text-sm font-medium text-slate-700">Option {opt}</label>
                        <input type="text" value={opt === "A" ? optA : opt === "B" ? optB : opt === "C" ? optC : optD} 
                               onChange={e => {
                                 if (opt === "A") setOptA(e.target.value);
                                 if (opt === "B") setOptB(e.target.value);
                                 if (opt === "C") setOptC(e.target.value);
                                 if (opt === "D") setOptD(e.target.value);
                               }}
                               className="mt-1 block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Correct Answer</label>
                      <select value={correct} onChange={e => setCorrect(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm">
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Marks</label>
                      <input type="number" value={qMarks} onChange={e => setQMarks(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button onClick={() => setShowQuestionForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Cancel</button>
                    <button onClick={handleAddQuestion} disabled={!qText || !optA || !optB || !optC || !optD} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">Save Question</button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-white rounded-lg shadow-sm ring-1 ring-slate-200 p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-xs font-bold text-slate-600">{idx + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-900 whitespace-pre-wrap">{q.question}</p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {Object.entries(q.options).map(([key, val]) => (
                            <div key={key} className={`text-xs p-2 rounded border ${key === q.correctAnswer ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                              <span className="font-bold mr-2">{key}.</span> {val}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                        {q.marks} Marks
                      </span>
                      <button onClick={() => handleDeleteQuestion(q.id)} className="text-xs text-red-600 hover:text-red-500">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              {questions.length === 0 && !showQuestionForm && (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                  <p className="text-sm text-slate-500">No questions added yet.</p>
                  <button onClick={() => setShowQuestionForm(true)} className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">Add your first question</button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AssessmentCreatorPage() {
  return (
    <RoleGuard allowedRoles={["company"]}>
      <AssessmentCreatorContent />
    </RoleGuard>
  );
}
