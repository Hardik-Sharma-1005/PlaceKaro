import { NextResponse } from "next/server";

import {
  buildServerPISInput,
} from "../../../../lib/pis/serverService";

const DEMO_STUDENT_IDS = [
  "demo-student-001",
  "demo-student-002",
  "demo-student-003",
];

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
      "Recruiter PIS API error:",
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