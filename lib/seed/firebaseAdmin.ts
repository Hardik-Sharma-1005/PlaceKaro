import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { readFileSync } from "fs";
import path from "path";

const serviceAccountPath = path.join(
  process.cwd(),
  "firebase-service-account.json"
);

const serviceAccount = JSON.parse(
  readFileSync(serviceAccountPath, "utf-8")
);

const adminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount),
        databaseURL:
          "https://placekaro-default-rtdb.asia-southeast1.firebasedatabase.app",
      });

export const adminDatabase = getDatabase(adminApp);