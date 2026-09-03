import { NextResponse } from "next/server";

import {
  buildServerPISInput,
} from "../../../../lib/pis/serverService";

import { adminDatabase } from "../../../../lib/seed/firebaseAdmin";

import type {
  PISConfiguration,
} from "../../../../types/database";

import type {
  PISParameter,
} from "../../../../lib/pis/types";

const DEMO_STUDENT_IDS = [
  "demo-student-001",
  "demo-student-002",
  "demo-student-003",
];

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

function validateParameters(
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

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const jobId =
      searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        {
          error:
            "jobId query parameter is required.",
        },
        { status: 400 }
      );
    }

    const inputs = await Promise.all(
      DEMO_STUDENT_IDS.map((studentId) =>
        buildServerPISInput(
          studentId,
          jobId
        )
      )
    );

    return NextResponse.json({
      inputs,
    });
  } catch (error) {
    console.error(
      "Recruiter PIS GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load recruiter PIS data.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request
) {
  try {
    const body = (await request.json()) as {
      jobId?: unknown;
      parameters?: unknown;
    };

    const jobId = body.jobId;

    if (
      typeof jobId !== "string" ||
      jobId.trim().length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "jobId is required.",
        },
        { status: 400 }
      );
    }

    if (
      !validateParameters(body.parameters)
    ) {
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
      parameters:
        body.parameters,
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
      "Recruiter PIS PUT error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save PIS configuration.",
      },
      { status: 500 }
    );
  }
}