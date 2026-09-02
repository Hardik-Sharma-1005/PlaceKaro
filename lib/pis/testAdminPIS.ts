import { calculatePISFromAdminFirebase } from "./serverService";

const TEST_STUDENTS = [
  "demo-student-001",
  "demo-student-002",
  "demo-student-003",
];

const JOB_ID = "job-001";

async function run(): Promise<void> {
  console.log("\n========================================");
  console.log("PlaceKaro Admin Firebase PIS Test");
  console.log("========================================\n");

  for (const studentId of TEST_STUDENTS) {
    try {
      const result =
        await calculatePISFromAdminFirebase(
          studentId,
          JOB_ID
        );

      console.log(`Student: ${studentId}`);
      console.log(`Job: ${result.jobId}`);
      console.log(`Status: ${result.status}`);
      console.log(`PIS: ${result.score}/100`);

      console.log("\nComponents:");

      for (const component of result.components) {
        console.log(
          [
            `- ${component.parameter}`,
            `score=${component.score}`,
            `originalWeight=${component.originalWeight}%`,
            `effectiveWeight=${component.effectiveWeight}%`,
            `contribution=${component.contribution}`,
            `status=${component.status}`,
          ].join(" | ")
        );
      }

      if (result.missingParameters.length > 0) {
        console.log(
          `Missing: ${result.missingParameters.join(", ")}`
        );
      }

      console.log(
        `Original weight total: ${result.originalWeightTotal}%`
      );

      console.log(
        `Effective weight total: ${result.effectiveWeightTotal}%`
      );
    } catch (error) {
      console.error(
        `Failed for ${studentId}:`,
        error instanceof Error
          ? error.message
          : String(error)
      );
    }

    console.log(
      "\n----------------------------------------\n"
    );
  }
}

run().catch((error) => {
  console.error(
    "Admin Firebase PIS test failed:",
    error instanceof Error
      ? error.message
      : String(error)
  );

  process.exitCode = 1;
});
