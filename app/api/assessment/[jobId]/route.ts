import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";

import { adminDatabase } from "../../../../lib/seed/firebaseAdmin";

import type {
  Assessment,
  AssessmentQuestion,
  Application,
} from "../../../../types/database";

interface RouteContext {
  params: Promise<{
    jobId: string;
  }>;
}

interface SafeAssessmentQuestion {
  id: string;
  assessmentId: string;
  question: string;
  type: AssessmentQuestion["type"];
  options: Record<string, string>;
  marks: number;
}

class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

function getBearerToken(request: NextRequest): string {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new AuthenticationError(
      "Missing authentication token."
    );
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    throw new AuthenticationError(
      "Missing authentication token."
    );
  }

  return token;
}

async function authenticateStudent(
  request: NextRequest
): Promise<string> {
  const token = getBearerToken(request);

  let decodedToken;

  try {
    decodedToken = await getAuth().verifyIdToken(token);
  } catch {
    throw new AuthenticationError(
      "Invalid or expired authentication token."
    );
  }

  const userSnapshot = await adminDatabase
    .ref(`users/${decodedToken.uid}`)
    .get();

  if (!userSnapshot.exists()) {
    throw new AuthenticationError(
      "User account record not found."
    );
  }

  const user = userSnapshot.val() as {
    role?: string;
    isActive?: boolean;
  };

  if (user.role !== "student") {
    throw new AuthenticationError(
      "Only student accounts can access assessments."
    );
  }

  if (user.isActive === false) {
    throw new AuthenticationError(
      "This student account is inactive."
    );
  }

  return decodedToken.uid;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const studentId = await authenticateStudent(request);
    const { jobId } = await context.params;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required." },
        { status: 400 }
      );
    }

    const applicationsSnapshot = await adminDatabase
      .ref("applications")
      .orderByChild("studentId")
      .equalTo(studentId)
      .get();

    let application: Application | null = null;

    if (applicationsSnapshot.exists()) {
      const applications = applicationsSnapshot.val() as Record<
        string,
        Application
      >;

      const matchingApplication = Object.values(applications).find(
        (item) => item.jobId === jobId
      );

      if (matchingApplication) {
        application = matchingApplication;
      }
    }

    if (!application) {
      return NextResponse.json(
        {
          error:
            "You do not have an application for this opportunity.",
        },
        { status: 403 }
      );
    }

    if (!application.assessmentUnlocked) {
      return NextResponse.json(
        { error: "Your assessment is not unlocked." },
        { status: 403 }
      );
    }

    const jobSnapshot = await adminDatabase
      .ref(`jobs/${jobId}`)
      .get();

    if (!jobSnapshot.exists()) {
      return NextResponse.json(
        { error: "Opportunity not found." },
        { status: 404 }
      );
    }

    const job = jobSnapshot.val() as {
      id?: string;
      assessmentId?: string;
      status?: string;
    };

    if (job.status !== "published") {
      return NextResponse.json(
        {
          error:
            "This opportunity is not currently published.",
        },
        { status: 403 }
      );
    }

    if (!job.assessmentId) {
      return NextResponse.json(
        {
          error:
            "No assessment is configured for this opportunity.",
        },
        { status: 404 }
      );
    }

    const assessmentSnapshot = await adminDatabase
      .ref(`assessments/${job.assessmentId}`)
      .get();

    if (!assessmentSnapshot.exists()) {
      return NextResponse.json(
        { error: "Assessment not found." },
        { status: 404 }
      );
    }

    const assessment = {
      ...(assessmentSnapshot.val() as Omit<Assessment, "id">),
      id: job.assessmentId,
    } as Assessment;

    if (!assessment.published) {
      return NextResponse.json(
        {
          error:
            "This assessment is not currently published.",
        },
        { status: 403 }
      );
    }

    if (assessment.jobId !== jobId) {
      return NextResponse.json(
        {
          error:
            "Assessment does not belong to this opportunity.",
        },
        { status: 409 }
      );
    }

    const questionsSnapshot = await adminDatabase
      .ref("assessmentQuestions")
      .orderByChild("assessmentId")
      .equalTo(assessment.id)
      .get();

    const questions: SafeAssessmentQuestion[] =
      questionsSnapshot.exists()
        ? Object.entries(
            questionsSnapshot.val() as Record<
              string,
              AssessmentQuestion
            >
          ).map(([id, question]) => ({
            id,
            assessmentId: question.assessmentId,
            question: question.question,
            type: question.type,
            options: question.options,
            marks: question.marks,
          }))
        : [];

    return NextResponse.json({
      assessment: {
        id: assessment.id,
        jobId: assessment.jobId,
        title: assessment.title,
        durationMinutes: assessment.durationMinutes,
        totalMarks: assessment.totalMarks,
        published: assessment.published,
        createdAt: assessment.createdAt,
      },
      questions,
    });
  } catch (error) {
    console.error(
      "Failed to load student assessment:",
      error
    );

    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Unable to load the assessment right now.",
      },
      { status: 500 }
    );
  }
}