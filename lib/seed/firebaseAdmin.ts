import {
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import {
  getDatabase,
  type Database,
} from "firebase-admin/database";
import { readFileSync } from "fs";
import path from "path";

const databaseURL =
  "https://placekaro-default-rtdb.asia-southeast1.firebasedatabase.app";

function getServiceAccount() {
  const projectId =
    process.env.FIREBASE_PROJECT_ID;
  const clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey =
    process.env.FIREBASE_PRIVATE_KEY;

  if (
    projectId &&
    clientEmail &&
    privateKey
  ) {
    return {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(
        /\\n/g,
        "\n"
      ),
    };
  }

  const serviceAccountPath = path.join(
    process.cwd(),
    "firebase-service-account.json"
  );

  const serviceAccount = JSON.parse(
    readFileSync(
      serviceAccountPath,
      "utf-8"
    )
  );

  return serviceAccount;
}

function getAdminApp(): App {
  const existingApps = getApps();

  if (existingApps.length > 0) {
    return existingApps[0];
  }

  return initializeApp({
    credential: cert(getServiceAccount()),
    databaseURL,
  });
}

function getAdminDatabase(): Database {
  return getDatabase(getAdminApp());
}

export const adminDatabase = new Proxy(
  {} as Database,
  {
    get(
      _target,
      property,
      receiver
    ) {
      const database = getAdminDatabase();
      const value = Reflect.get(
        database,
        property,
        receiver
      );

      if (typeof value === "function") {
        return value.bind(database);
      }

      return value;
    },
  }
);