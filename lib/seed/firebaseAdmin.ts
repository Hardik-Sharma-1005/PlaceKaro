import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { readFileSync } from "fs";
import path from "path";

const databaseURL =
  "https://placekaro-default-rtdb.asia-southeast1.firebasedatabase.app";

function getServiceAccount() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (
    projectId &&
    clientEmail &&
    privateKey
  ) {
    return {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    };
  }

  const serviceAccountPath = path.join(
    process.cwd(),
    "firebase-service-account.json"
  );

  const serviceAccount = JSON.parse(
    readFileSync(serviceAccountPath, "utf-8")
  );

  return serviceAccount;
}

const adminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(getServiceAccount()),
        databaseURL,
      });

export const adminDatabase =
  getDatabase(adminApp);