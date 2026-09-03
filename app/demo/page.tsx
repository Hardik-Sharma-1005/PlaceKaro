"use client";

import { useState } from "react";
import Link from "next/link";
import { ref, set } from "firebase/database";
import { database } from "../../lib/firebase/database";
import { StudentProfile, Job, JobRequirements, Assessment, AssessmentQuestion, Application, AssessmentResult } from "../../types/database";

export default function DemoSandboxPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const seedDatabase = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      // Create a mock recruiter/company
      const companyId = "mock-company-1";
      const recruiterId = "mock-recruiter-1";

      // 1. Mock Students
      const mockStudents: Record<string, StudentProfile> = {
        "mock-student-1": {
          userId: "mock-student-1",
          fullName: "Alice Sharma",
          university: "National Institute of Technology",
          degree: "B.Tech",
          branch: "Computer Science",
          graduationYear: 2025,
          cgpa: 8.5,
          attendance: 90,
          backlogCount: 0,
          profileCompletion: 100,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        "mock-student-2": {
          userId: "mock-student-2",
          fullName: "Bob Kumar",
          university: "National Institute of Technology",
          degree: "B.Tech",
          branch: "Electronics",
          graduationYear: 2025,
          cgpa: 7.2,
          attendance: 85,
          backlogCount: 1,
          profileCompletion: 80,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        "mock-student-3": {
          userId: "mock-student-3",
          fullName: "Charlie Singh",
          university: "National Institute of Technology",
          degree: "B.Tech",
          branch: "Information Technology",
          graduationYear: 2025,
          cgpa: 9.1,
          attendance: 95,
          backlogCount: 0,
          profileCompletion: 95,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
      };
      await set(ref(database, "studentProfiles"), mockStudents);

      // 2. Mock Job
      const jobId = "mock-job-1";
      const job: Job = {
        id: jobId,
        companyId,
        recruiterId,
        title: "Software Development Engineer (SDE I)",
        description: "Join our fast-paced engineering team to build scalable systems. Strong algorithmic skills and React/Node experience required.",
        status: "published",
        assessmentId: "mock-assessment-1",
        assessmentAccessModel: "all_eligible",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await set(ref(database, `jobs/${jobId}`), job);

      const jobReqs: JobRequirements = {
        jobId,
        hardEligibility: {
          branches: ["Computer Science", "Information Technology", "Electronics"],
          graduationYears: [2025],
          minimumCGPA: 7.0,
          maximumBacklogs: 1,
        },
        competencies: {},
        confirmedByCompany: true,
      };
      await set(ref(database, `jobRequirements/${jobId}`), jobReqs);

      // 3. PIS Config
      const pisConfig = {
        "Technical Skills": 30,
        "Domain Skills": 20,
        "CGPA": 30,
        "Projects": 20,
      };
      await set(ref(database, `jobPISConfig/${jobId}`), pisConfig);

      // 4. Mock Assessment
      const assessmentId = "mock-assessment-1";
      const assessment: Assessment = {
        id: assessmentId,
        jobId,
        title: "SDE Technical Screening",
        durationMinutes: 30,
        totalMarks: 20,
        published: true,
        createdAt: Date.now(),
      };
      await set(ref(database, `assessments/${assessmentId}`), assessment);

      const q1Id = "mock-q1";
      const q2Id = "mock-q2";
      const questions: Record<string, AssessmentQuestion> = {
        [q1Id]: {
          id: q1Id,
          assessmentId,
          question: "What is the time complexity of binary search?",
          type: "mcq",
          options: { A: "O(1)", B: "O(n)", C: "O(log n)", D: "O(n log n)" },
          correctAnswer: "C",
          marks: 10,
        },
        [q2Id]: {
          id: q2Id,
          assessmentId,
          question: "Which hook is used to manage side effects in React?",
          type: "mcq",
          options: { A: "useState", B: "useEffect", C: "useContext", D: "useMemo" },
          correctAnswer: "B",
          marks: 10,
        }
      };
      await set(ref(database, `assessmentQuestions/${assessmentId}`), questions);

      // 5. Mock Applications
      const app1Id = "mock-app-1";
      const app2Id = "mock-app-2";
      const applications: Record<string, Application> = {
        [app1Id]: {
          id: app1Id,
          studentId: "mock-student-1",
          jobId,
          status: "shortlisted",
          appliedAt: Date.now() - 86400000,
          assessmentUnlocked: true,
        },
        [app2Id]: {
          id: app2Id,
          studentId: "mock-student-2",
          jobId,
          status: "under_review",
          appliedAt: Date.now() - 43200000,
          assessmentUnlocked: true,
        }
      };
      await set(ref(database, "applications"), applications);

      // 6. Mock Assessment Results
      const results: Record<string, AssessmentResult> = {
        "mock-result-1": {
          id: "mock-result-1",
          assessmentId,
          jobId,
          studentId: "mock-student-1",
          score: 20,
          totalMarks: 20,
          percentage: 100,
          status: "qualified",
          submittedAt: Date.now() - 3600000,
        },
        "mock-result-2": {
          id: "mock-result-2",
          assessmentId,
          jobId,
          studentId: "mock-student-2",
          score: 10,
          totalMarks: 20,
          percentage: 50,
          status: "not_qualified",
          submittedAt: Date.now() - 1800000,
        }
      };
      await set(ref(database, "assessmentResults"), results);

      // 7. Mock Interview
      const interviewId = "mock-interview-1";
      await set(ref(database, `interviews/${interviewId}`), {
        id: interviewId,
        applicationId: app1Id,
        jobId,
        studentId: "mock-student-1",
        recruiterId,
        roundName: "Technical Round 1",
        scheduledAt: Date.now() + 86400000, // tomorrow
        meetingLink: "https://meet.google.com/abc-defg-hij",
        status: "scheduled"
      });

      setSuccess(true);
    } catch (error) {
      console.error("Failed to seed database", error);
      alert("Failed to seed. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-10 rounded-3xl shadow-sm ring-1 ring-slate-200 max-w-lg w-full">
        <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">
          🧪
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Demo Sandbox Seeder</h1>
        <p className="mt-4 text-sm text-slate-500">
          Clicking the button below will wipe and re-seed the Firebase Realtime Database with 3 mock students, 1 mock job, an assessment with questions, applications, and an interview.
        </p>

        <button
          onClick={seedDatabase}
          disabled={loading}
          className="mt-8 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Seeding Database..." : "Seed Mock Data"}
        </button>

        {success && (
          <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-600/20 text-left">
            <p className="font-bold mb-2">✅ Success! The database is seeded.</p>
            <p className="mb-1">You can now explore:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Create a Recruiter account and view Job Applications for <b>SDE I</b>.</li>
              <li>Create a Placement Cell account to view the student directory.</li>
              <li>Notice how Alice is shortlisted and has a scheduled interview.</li>
            </ul>
          </div>
        )}

        <div className="mt-8">
          <Link href="/" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
            &larr; Back to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}
