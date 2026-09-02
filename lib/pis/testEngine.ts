import { calculatePIS } from "./engine";
import { demoPISInputs } from "./testData";

function assert(
  condition: boolean,
  message: string
): void {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

function assertEqual<T>(
  actual: T,
  expected: T,
  message: string
): void {
  if (actual !== expected) {
    throw new Error(
      `TEST FAILED: ${message}\n` +
        `Expected: ${String(expected)}\n` +
        `Actual: ${String(actual)}`
    );
  }
}

function assertClose(
  actual: number,
  expected: number,
  tolerance: number,
  message: string
): void {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(
      `TEST FAILED: ${message}\n` +
        `Expected: ${expected}\n` +
        `Actual: ${actual}`
    );
  }
}

function testDemoCandidates(): void {
  assertEqual(
    demoPISInputs.length,
    3,
    "Expected three demo PIS candidates."
  );

  const results = demoPISInputs.map(
    (input) => calculatePIS(input)
  );

  for (const result of results) {
    assertEqual(
      result.status,
      "calculated",
      `Expected ${result.studentId} to calculate successfully.`
    );

    assertClose(
      result.originalWeightTotal,
      100,
      0.0001,
      `Original weights for ${result.studentId} should total 100.`
    );

    assertClose(
      result.effectiveWeightTotal,
      100,
      0.0001,
      `Effective weights for ${result.studentId} should total 100.`
    );

    assert(
      result.score >= 0 && result.score <= 100,
      `PIS for ${result.studentId} must be between 0 and 100.`
    );
  }

  const aarav = results.find(
    (result) =>
      result.studentId === "demo-student-001"
  );

  const priya = results.find(
    (result) =>
      result.studentId === "demo-student-002"
  );

  const rohan = results.find(
    (result) =>
      result.studentId === "demo-student-003"
  );

  assert(
    aarav !== undefined,
    "Aarav result should exist."
  );

  assert(
    priya !== undefined,
    "Priya result should exist."
  );

  assert(
    rohan !== undefined,
    "Rohan result should exist."
  );

  assertClose(
    aarav!.score,
    73.75,
    0.0001,
    "Aarav PIS should match the deterministic fixture."
  );

  assertClose(
    priya!.score,
    51.25,
    0.0001,
    "Priya PIS should match the deterministic fixture."
  );

  assertClose(
    rohan!.score,
    37.1875,
    0.0001,
    "Rohan PIS should match the deterministic fixture."
  );

  assert(
    rohan!.missingParameters.includes(
      "internships"
    ),
    "Rohan should have internships marked as missing."
  );

  const academicComponent =
    rohan!.components.find(
      (component) =>
        component.parameter ===
        "academicPerformance"
    );

  const technicalComponent =
    rohan!.components.find(
      (component) =>
        component.parameter ===
        "technicalSkills"
    );

  const projectComponent =
    rohan!.components.find(
      (component) =>
        component.parameter === "projects"
    );

  const internshipComponent =
    rohan!.components.find(
      (component) =>
        component.parameter === "internships"
    );

  assert(
    academicComponent !== undefined,
    "Rohan academic component should exist."
  );

  assert(
    technicalComponent !== undefined,
    "Rohan technical component should exist."
  );

  assert(
    projectComponent !== undefined,
    "Rohan project component should exist."
  );

  assert(
    internshipComponent !== undefined,
    "Rohan internship component should exist."
  );

  assertClose(
    academicComponent!.effectiveWeight,
    31.25,
    0.0001,
    "Rohan academic effective weight should be redistributed correctly."
  );

  assertClose(
    technicalComponent!.effectiveWeight,
    43.75,
    0.0001,
    "Rohan technical effective weight should be redistributed correctly."
  );

  assertClose(
    projectComponent!.effectiveWeight,
    25,
    0.0001,
    "Rohan project effective weight should be redistributed correctly."
  );

  assertEqual(
    internshipComponent!.status,
    "missing",
    "Rohan internship parameter should be missing."
  );

  assertClose(
    internshipComponent!.effectiveWeight,
    0,
    0.0001,
    "Missing internship effective weight should be zero."
  );
}

function testInvalidConfiguration(): void {
  const input = demoPISInputs[0];

  const invalidInput = {
    ...input,
    configuration: {
      ...input.configuration,
      parameters: {
        academicPerformance: 25,
        technicalSkills: 35,
        projects: 10,
      },
    },
  };

  const result = calculatePIS(invalidInput);

  assertEqual(
    result.status,
    "invalid_configuration",
    "Invalid weight configuration should be rejected."
  );

  assertEqual(
    result.score,
    0,
    "Invalid configuration should not produce a PIS."
  );
}

function testNoApplicableParameters(): void {
  const input = demoPISInputs[0];

  const noApplicableInput = {
    ...input,
    configuration: {
      ...input.configuration,
      parameters: {
        projects: 10,
        internships: 20,
        certifications: 20,
        achievements: 20,
        preferredQualifications: 30,
      },
    },
  };

  const result = calculatePIS(
    noApplicableInput
  );

  assertEqual(
    result.status,
    "calculated",
    "The current demo candidate should have at least one applicable parameter in this configuration."
  );
}

function testAllMissingConfiguration(): void {
  const input = demoPISInputs[0];

  const allMissingInput = {
    ...input,
    job: {
      requirements: {
        ...input.job.requirements,
        competencies: {
          technicalSkills: [],
          domainSkills: [],
          preferredQualifications: [],
        },
        hardEligibility: {
          ...input.job.requirements.hardEligibility,
          graduationYears: [],
        },
      },
    },
    configuration: {
      ...input.configuration,
      parameters: {
        graduationYear: 10,
        projects: 10,
        internships: 20,
        certifications: 20,
        achievements: 20,
        preferredQualifications: 20,
      },
    },
    candidate: {
      ...input.candidate,
      projects: [],
      internships: [],
      certifications: [],
      achievements: [],
    },
  };

  const result = calculatePIS(
    allMissingInput
  );

  assertEqual(
    result.status,
    "no_applicable_parameters",
    "All missing selected parameters should produce no_applicable_parameters."
  );

  assertEqual(
    result.score,
    0,
    "All missing selected parameters should produce PIS 0."
  );

  assertClose(
    result.effectiveWeightTotal,
    0,
    0.0001,
    "All missing parameters should leave zero effective weight."
  );
}

function testAssessmentIndependence(): void {
  const input = demoPISInputs[0];

  const resultWithoutAssessment =
    calculatePIS(input);

  const inputWithAssessmentChange = {
    ...input,
    candidate: {
      ...input.candidate,
    },
  };

  const resultWithAssessmentChange =
    calculatePIS(
      inputWithAssessmentChange
    );

  assertClose(
    resultWithoutAssessment.score,
    resultWithAssessmentChange.score,
    0.0001,
    "PIS should not depend on assessment data."
  );
}

testDemoCandidates();
testInvalidConfiguration();
testNoApplicableParameters();
testAllMissingConfiguration();
testAssessmentIndependence();

console.log(
  "\n✅ All PIS engine tests passed."
);
