import { NextResponse } from "next/server";

import { adminDatabase } from "../../../../../lib/seed/firebaseAdmin";

import {
  authenticateRecruiter,
  RecruiterAuthError,
} from "../../../../../lib/auth/authenticateRecruiter";

import type {
  Job,
  JobRequirements,
  PISConfiguration,
} from "../../../../../types/database";

import type {
  PISParameter,
} from "../../../../../lib/pis/types";

interface RouteContext {
  params: Promise<{
    jobId: string;
  }>;
}

// --- PIS parameter validation ---

const ALLOWED_PARAMETERS: PISParameter[] = [
  "academicPerformance",
  "attendance",
  "backlogs",
  "graduationYear",
  "technicalSkills",
  "domainSkills",
  "projects",
  "internships",
  "certifications",
  "achievements",
  "evidenceQuality",
  "preferredQualifications",
];

function validatePISParameters(
  parameters: unknown
): parameters is Partial<Record<PISParameter, number>> {
  if (
    !parameters ||
    typeof parameters !== "object" ||
    Array.isArray(parameters)
  ) {
    return false;
  }

  const entries = Object.entries(
    parameters as Record<string, unknown>
  );

  if (entries.length === 0) {
    return false;
  }

  for (const [parameter, value] of entries) {
    if (
      !ALLOWED_PARAMETERS.includes(
        parameter as PISParameter
      )
    ) {
      return false;
    }

    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > 100
    ) {
      return false;
    }
  }

  const total = entries.reduce(
    (sum, [, value]) =>
      sum + (value as number),
    0
  );

  return Math.abs(total - 100) < 0.0001;
}

// --- Job ownership authorization ---

async function authorizeJobAccess(
  jobId: string,
  companyId: string,
  recruiterId: string
): Promise<Job | NextResponse> {
  const jobSnapshot = await adminDatabase
    .ref(`jobs/${jobId}`)
    .get();

  if (!jobSnapshot.exists()) {
    return NextResponse.json(
      { error: "Job not found." },
      { status: 404 }
    );
  }

  const job = jobSnapshot.val() as Job;

  if (
    job.companyId !== companyId ||
    job.recruiterId !== recruiterId
  ) {
    return NextResponse.json(
      {
        error:
          "You do not have access to this job.",
      },
      { status: 403 }
    );
  }

  return job;
}

// --- PUT: update requirements or PIS configuration ---

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const identity =
      await authenticateRecruiter(request);

    const { jobId } = await context.params;

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId is required." },
        { status: 400 }
      );
    }

    const jobResult = await authorizeJobAccess(
      jobId,
      identity.companyId,
      identity.recruiterId
    );

    if (jobResult instanceof NextResponse) {
      return jobResult;
    }

    const body = (await request.json()) as {
      operation?: unknown;
      requirements?: unknown;
      parameters?: unknown;
    };

    const operation = body.operation;

    if (
      operation !== "requirements" &&
      operation !== "pis"
    ) {
      return NextResponse.json(
        {
          error:
            "operation must be \"requirements\" or \"pis\".",
        },
        { status: 400 }
      );
    }

    // --- Requirements operation ---

    if (operation === "requirements") {
      const requirements = body.requirements;

      if (
        !requirements ||
        typeof requirements !== "object" ||
        Array.isArray(requirements)
      ) {
        return NextResponse.json(
          {
            error:
              "requirements must be an object.",
          },
          { status: 400 }
        );
      }

      const typed =
        requirements as Omit<JobRequirements, "jobId">;

      const jobRequirements: JobRequirements = {
        jobId,
        hardEligibility:
          typed.hardEligibility ?? {},
        competencies:
          typed.competencies ?? {},
        confirmedByCompany:
          typed.confirmedByCompany ?? false,
      };

      await adminDatabase
        .ref(`jobRequirements/${jobId}`)
        .set(jobRequirements);

      return NextResponse.json({
        success: true,
        requirements: jobRequirements,
      });
    }

    // --- PIS operation ---

    if (!validatePISParameters(body.parameters)) {
      return NextResponse.json(
        {
          error:
            "PIS parameters must contain valid non-negative weights totaling exactly 100%.",
        },
        { status: 400 }
      );
    }

    const configuration: PISConfiguration = {
      jobId,
      parameters: body.parameters,
      confirmed: true,
      updatedAt: Date.now(),
    };

    await adminDatabase
      .ref(`pisConfigurations/${jobId}`)
      .set(configuration);

    return NextResponse.json({
      success: true,
      configuration,
    });
  } catch (error) {
    console.error(
      "Recruiter job PUT error:",
      error
    );

    if (error instanceof RecruiterAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Unable to update job configuration.",
      },
      { status: 500 }
    );
  }
}

// --- POST: request job approval ---

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const identity =
      await authenticateRecruiter(request);

    const { jobId } = await context.params;

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId is required." },
        { status: 400 }
      );
    }

    const jobResult = await authorizeJobAccess(
      jobId,
      identity.companyId,
      identity.recruiterId
    );

    if (jobResult instanceof NextResponse) {
      return jobResult;
    }

    const job = jobResult;

    const now = Date.now();

    await adminDatabase
      .ref(`jobs/${jobId}`)
      .update({
        status: "pending_approval",
        updatedAt: now,
      });

    return NextResponse.json({
      success: true,
      job: {
        ...job,
        id: jobId,
        status: "pending_approval",
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error(
      "Recruiter job POST error:",
      error
    );

    if (error instanceof RecruiterAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Unable to submit job for approval.",
      },
      { status: 500 }
    );
  }
}

// --- GET: load job details and requirements ---

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const identity =
      await authenticateRecruiter(request);

    const { jobId } = await context.params;

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId is required." },
        { status: 400 }
      );
    }

    const jobResult = await authorizeJobAccess(
      jobId,
      identity.companyId,
      identity.recruiterId
    );

    if (jobResult instanceof NextResponse) {
      return jobResult;
    }

    const job = jobResult;

    const reqSnapshot = await adminDatabase
      .ref(`jobRequirements/${jobId}`)
      .get();

    const requirements = reqSnapshot.exists()
      ? (reqSnapshot.val() as JobRequirements)
      : null;

    return NextResponse.json({
      job: {
        ...job,
        id: jobId,
      },
      requirements,
    });
  } catch (error) {
    console.error(
      "Recruiter job GET error:",
      error
    );

    if (error instanceof RecruiterAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Unable to load job details.",
      },
      { status: 500 }
    );
  }
}
