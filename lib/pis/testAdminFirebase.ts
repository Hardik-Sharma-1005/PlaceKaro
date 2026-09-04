import { adminDatabase } from "../seed/firebaseAdmin";

async function read(path: string): Promise<void> {
  const snapshot = await adminDatabase.ref(path).once("value");

  console.log(
    `${path}:`,
    snapshot.exists()
      ? "FOUND"
      : "NOT FOUND"
  );
}

async function run(): Promise<void> {
  console.log("\n========================================");
  console.log("PlaceKaro Admin Firebase Test");
  console.log("========================================\n");

  const paths = [
    "studentProfiles/demo-student-001",
    "skills",
    "projects",
    "internships",
    "certifications",
    "achievements",
    "evidence",
    "jobRequirements/job-001",
    "pisConfigurations/job-001",
  ];

  for (const path of paths) {
    await read(path);
  }

  console.log("\n========================================");
  console.log("Admin Firebase test completed.");
  console.log("========================================\n");

  process.exit(0);
}

run().catch((error) => {
  console.error(
    "Admin Firebase test failed:",
    error instanceof Error
      ? error.message
      : String(error)
  );

  process.exit(1);
});