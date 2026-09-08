import { NextResponse } from "next/server";

import { adminDatabase } from "../../../../lib/seed/firebaseAdmin";

import {
  authenticateRecruiter,
  RecruiterAuthError,
} from "../../../../lib/auth/authenticateRecruiter";

import type {
  Job,
  AssessmentAccessModel,
  ShortlistType,
} from "../../../../types/database";

const VALID_ACCESS_MODELS: AssessmentAccessModel[] = [
  "all_eligible",
  "role_fit",
  "custom",
];

const VALID_SHORTLIST_TYPES: ShortlistType[] = [
  "cutoff",
  "top_n",
];

export async function POST(request: Request) {
  try {
    const identity =
      await authenticateRecruiter(request);

    const body = (await request.json()) as {
      title?: unknown;
      description?: unknown;
      assessmentAccessModel?: unknown;
      shortlistType?: unknown;
      shortlistValue?: unknown;
    };

    // --- Validate title ---

    if (
      typeof body.title !== "string" ||
      body.title.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "title is required." },
        { status: 400 }
      );
    }

    // --- Validate description ---

    if (
      body.description !== undefined &&
      typeof body.description !== "string"
    ) {
      return NextResponse.json(
        {
          error:
            "description must be a string.",
        },
        { status: 400 }
      );
    }

    // --- Validate assessmentAccessModel ---

    if (
      !VALID_ACCESS_MODELS.includes(
        body.assessmentAccessModel as AssessmentAccessModel
      )
    ) {
      return NextResponse.json(
        {
          error:
            "assessmentAccessModel must be one of: all_eligible, role_fit, custom.",
        },
        { status: 400 }
      );
    }

    // --- Validate optional shortlistType ---

    if (
      body.shortlistType !== undefined &&
      !VALID_SHORTLIST_TYPES.includes(
        body.shortlistType as ShortlistType
      )
    ) {
      return NextResponse.json(
        {
          error:
            "shortlistType must be one of: cutoff, top_n.",
        },
        { status: 400 }
      );
    }

    // --- Validate optional shortlistValue ---

    if (body.shortlistValue !== undefined) {
      if (
        typeof body.shortlistValue !== "number" ||
        !Number.isFinite(body.shortlistValue) ||
        body.shortlistValue < 0
      ) {
        return NextResponse.json(
          {
            error:
              "shortlistValue must be a finite non-negative number.",
          },
          { status: 400 }
        );
      }
    }

    // --- Build job record ---

    const now = Date.now();

    const newJobRef = adminDatabase
      .ref("jobs")
      .push();

    const jobId = newJobRef.key;

    if (!jobId) {
      return NextResponse.json(
        {
          error:
            "Unable to generate a job ID.",
        },
        { status: 500 }
      );
    }

    const job: Job = {
      id: jobId,
      companyId: identity.companyId,
      recruiterId: identity.recruiterId,
      title: body.title.trim(),
      description:
        typeof body.description === "string"
          ? body.description
          : "",
      status: "draft",
      assessmentAccessModel:
        body.assessmentAccessModel as AssessmentAccessModel,
      ...(body.shortlistType !== undefined && {
        shortlistType:
          body.shortlistType as ShortlistType,
      }),
      ...(body.shortlistValue !== undefined && {
        shortlistValue:
          body.shortlistValue as number,
      }),
      createdAt: now,
      updatedAt: now,
    };

    // Write job without the id field in the stored value,
    // matching the client-side jobService convention where
    // the id is the Firebase key and not stored in the record.
    const { id: _id, ...jobData } = job;

    await newJobRef.set(jobData);

    return NextResponse.json({ job });
  } catch (error) {
    console.error(
      "Recruiter jobs POST error:",
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
          "Unable to create the job.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const identity =
      await authenticateRecruiter(request);

    const jobsSnapshot = await adminDatabase
      .ref("jobs")
      .orderByChild("companyId")
      .equalTo(identity.companyId)
      .get();

    if (!jobsSnapshot.exists()) {
      return NextResponse.json({ jobs: [] });
    }

    const jobsData = jobsSnapshot.val() as Record<
      string,
      Omit<Job, "id">
    >;

    const jobs: Job[] = Object.keys(jobsData)
      .map((key) => ({
        ...jobsData[key],
        id: key,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error(
      "Recruiter jobs GET error:",
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
          "Unable to load jobs.",
      },
      { status: 500 }
    );
  }
}
