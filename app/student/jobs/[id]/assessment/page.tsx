"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../../lib/context/AuthContext";
import { RoleGuard } from "../../../../../lib/components/RoleGuard";
import { assessmentService } from "../../../../../lib/services/assessmentService";
import { applicationService } from "../../../../../lib/services/applicationService";
import { Assessment, AssessmentQuestion, Application, AssessmentResult } from "../../../../../types/database";

function StudentAssessmentContent() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { user } = useAuth();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [application, setApplication] = useState<Application | null>(null);
  const [existingResult, setExistingResult] = useState<AssessmentResult | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  
  // Timer State (Simplified for MVP, not securely enforced server-side)
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    async function loadTest() {
      if (!user) return;
      try {
        const app = await applicationService.getApplication(user.uid, jobId);
        setApplication(app);

        // Fetch Assessment
        const assmnt = await assessmentService.getAssessmentByJobId(jobId);
        if (assmnt) {
          setAssessment(assmnt);
          
          // Check if already taken
          const res = await applicationService.getAssessmentResult(user.uid, assmnt.id);
          setExistingResult(res);

          if (!res && app?.assessmentUnlocked) {
            const qs = await assessmentService.getQuestionsByAssessmentId(assmnt.id);
            setQuestions(qs);
            setTimeLeft(assmnt.durationMinutes * 60);
          }
        }
      } catch (error) {
        console.error("Failed to load assessment details", error);
      } finally {
        setLoading(false);
      }
    }
    loadTest();
  }, [user, jobId]);

  useEffect(() => {
    if (timeLeft === null || existingResult || submitting) return;
    
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, existingResult, submitting]);

  const handleSubmit = async () => {
    if (!user || !assessment || submitting) return;
    setSubmitting(true);

    try {
      let score = 0;
      questions.forEach(q => {
        if (answers[q.id] === q.correctAnswer) {
          score += q.marks;
        }
      });

      const percentage = (score / assessment.totalMarks) * 100;
      // Simple qualification criteria for MVP
      const status = percentage >= 50 ? "qualified" : "not_qualified";

      await applicationService.submitAssessmentResult({
        assessmentId: assessment.id,
        jobId,
        studentId: user.uid,
        score,
        totalMarks: assessment.totalMarks,
        percentage,
        status
      });

      // Reload state to show result
      const newResult = await applicationService.getAssessmentResult(user.uid, assessment.id);
      setExistingResult(newResult);
    } catch (error) {
      console.error("Failed to submit assessment", error);
      alert("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectOption = (qId: string, optionKey: string) => {
    setAnswers(prev => ({ ...prev, [qId]: optionKey }));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-r-transparent"></div></div>;
  }

  if (!application || !application.assessmentUnlocked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="mt-2 text-sm text-slate-500 mb-6">You have not applied to this job or the assessment is not yet unlocked for you.</p>
          <Link href="/student/jobs" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">Return to Jobs</Link>
        </div>
      </div>
    );
  }

  if (!assessment || !assessment.published) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-slate-900">Assessment Unavailable</h2>
          <p className="mt-2 text-sm text-slate-500 mb-6">The assessment for this job is not available or has not been published yet.</p>
          <Link href="/student/jobs" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">Return to Jobs</Link>
        </div>
      </div>
    );
  }

  if (existingResult) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 p-4">
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-8 max-w-lg w-full text-center">
          <div className="mx-auto h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-6 ring-1 ring-slate-100">
            <span className="text-2xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Assessment Completed</h1>
          <p className="text-sm text-slate-500 mt-2">You have successfully submitted the assessment for {assessment.title}.</p>
          
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="text-xs font-medium text-slate-500">Your Score</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{existingResult.score} / {existingResult.totalMarks}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="text-xs font-medium text-slate-500">Status</p>
              <p className={`mt-1 text-lg font-bold capitalize ${existingResult.status === 'qualified' ? 'text-emerald-600' : 'text-red-600'}`}>
                {existingResult.status.replace('_', ' ')}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Link href="/student/jobs" className="w-full inline-flex justify-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
              Return to Job Board
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shrink-0">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <p className="text-sm font-bold text-slate-900 truncate pr-4">{assessment.title}</p>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-xs font-medium text-slate-500">Time Remaining</span>
                <span className={`text-lg font-bold ${timeLeft !== null && timeLeft < 300 ? 'text-red-600' : 'text-slate-900'}`}>
                  {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
                </span>
              </div>
              <button 
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Test"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 pb-24">
        <div className="space-y-8">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6 sm:p-8">
              <div className="flex gap-4 mb-6">
                <span className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 text-sm font-bold text-slate-900">{idx + 1}</span>
                <div className="pt-1">
                  <p className="text-base font-semibold text-slate-900 whitespace-pre-wrap leading-relaxed">{q.question}</p>
                  <p className="text-xs font-medium text-slate-400 mt-2">{q.marks} Marks</p>
                </div>
              </div>

              <div className="space-y-3 ml-12">
                {Object.entries(q.options).map(([key, val]) => {
                  const isSelected = answers[q.id] === key;
                  return (
                    <label 
                      key={key} 
                      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        isSelected 
                        ? 'bg-indigo-50 border-indigo-600 ring-1 ring-inset ring-indigo-600' 
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name={q.id} 
                        value={key} 
                        checked={isSelected}
                        onChange={() => handleSelectOption(q.id, key)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-600 border-slate-300"
                      />
                      <span className={`text-sm ${isSelected ? 'font-medium text-indigo-900' : 'text-slate-700'}`}>
                        <span className="font-bold mr-2">{key}.</span> {val}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function StudentAssessmentPage() {
  return (
    <RoleGuard allowedRoles={["student"]}>
      <StudentAssessmentContent />
    </RoleGuard>
  );
}
