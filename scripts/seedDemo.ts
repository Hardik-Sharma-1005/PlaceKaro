import { writeDemoData } from "../lib/seed/adminSeed";

async function main(): Promise<void> {
  console.log("Starting PlaceKaro demo data seed...");

  await writeDemoData();

  console.log("PlaceKaro demo data seeded successfully.");
}

main().catch((error) => {
  console.error("Demo data seed failed:", error);
  process.exit(1);
});