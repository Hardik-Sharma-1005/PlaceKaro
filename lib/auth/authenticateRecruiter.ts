import { getAuth } from "firebase-admin/auth";

import { adminDatabase } from "../seed/firebaseAdmin";

import type {
  User,
  CompanyRecruiter,
} from "../../types/database";

/**
 * Error thrown when a recruiter authentication or
 * authorization check fails. Callers should catch this
 * and return an HTTP 401 response.
 */
export class RecruiterAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecruiterAuthError";
  }
}

/**
 * Resolved identity of an authenticated recruiter.
 */
export interface RecruiterIdentity {
  uid: string;
  user: User;
  recruiter: CompanyRecruiter;
  recruiterId: string;
  companyId: string;
}

/**
 * Authenticates an incoming request as a company recruiter
 * and resolves the recruiter's identity.
 *
 * Steps:
 * 1. Extracts and verifies the Bearer token from the
 *    Authorization header using Firebase Admin Auth.
 * 2. Reads the users/{uid} record and confirms the role
 *    is "company" and the account is active.
 * 3. Queries companyRecruiters by userId to find the
 *    unique recruiter record for this Firebase UID.
 *
 * @throws {RecruiterAuthError} when any authentication or
 * authorization check fails.
 */
export async function authenticateRecruiter(
  request: Request
): Promise<RecruiterIdentity> {
  // --- Extract Bearer token ---

  const authorization =
    request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new RecruiterAuthError(
      "Missing authentication token."
    );
  }

  const token = authorization
    .slice("Bearer ".length)
    .trim();

  if (!token) {
    throw new RecruiterAuthError(
      "Missing authentication token."
    );
  }

  // --- Verify token via Firebase Admin ---

  let uid: string;

  try {
    const decodedToken =
      await getAuth().verifyIdToken(token);
    uid = decodedToken.uid;
  } catch {
    throw new RecruiterAuthError(
      "Invalid or expired authentication token."
    );
  }

  // --- Read user record ---

  const userSnapshot = await adminDatabase
    .ref(`users/${uid}`)
    .get();

  if (!userSnapshot.exists()) {
    throw new RecruiterAuthError(
      "User account record not found."
    );
  }

  const user = userSnapshot.val() as User;

  if (user.role !== "company") {
    throw new RecruiterAuthError(
      "Only company accounts can perform this action."
    );
  }

  if (user.isActive === false) {
    throw new RecruiterAuthError(
      "This company account is inactive."
    );
  }

  // --- Resolve CompanyRecruiter by userId ---

  const recruitersSnapshot = await adminDatabase
    .ref("companyRecruiters")
    .orderByChild("userId")
    .equalTo(uid)
    .get();

  if (!recruitersSnapshot.exists()) {
    throw new RecruiterAuthError(
      "No recruiter profile found for this account."
    );
  }

  const recruitersMap = recruitersSnapshot.val() as Record<
    string,
    CompanyRecruiter
  >;

  const entries = Object.entries(recruitersMap);

  if (entries.length !== 1) {
    throw new RecruiterAuthError(
      "Unable to resolve a unique recruiter profile for this account."
    );
  }

  const [recruiterId, recruiter] = entries[0];

  return {
    uid,
    user,
    recruiter,
    recruiterId,
    companyId: recruiter.companyId,
  };
}
