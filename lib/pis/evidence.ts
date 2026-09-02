import type { Evidence } from "../../types/database";

/**
 * Creates a lookup map for evidence records.
 */
export function createEvidenceMap(
  evidence: Evidence[]
): Map<string, Evidence> {
  return new Map(
    evidence.map((item) => [item.id, item])
  );
}

/**
 * Returns true when at least one linked evidence record
 * is explicitly verified.
 *
 * Only "verified" counts as verified evidence for PIS.
 */
export function hasVerifiedEvidence(
  evidenceIds: string[] | undefined,
  evidenceById: Map<string, Evidence>
): boolean {
  if (!evidenceIds || evidenceIds.length === 0) {
    return false;
  }

  return evidenceIds.some((evidenceId) => {
    const evidence = evidenceById.get(evidenceId);

    return evidence?.verificationStatus === "verified";
  });
}

/**
 * Returns true when the given single evidence record
 * is explicitly verified.
 */
export function isVerifiedEvidence(
  evidenceId: string | undefined,
  evidenceById: Map<string, Evidence>
): boolean {
  if (!evidenceId) {
    return false;
  }

  return (
    evidenceById.get(evidenceId)?.verificationStatus ===
    "verified"
  );
}

/**
 * Returns the number of linked evidence records that
 * are explicitly verified.
 */
export function countVerifiedEvidence(
  evidenceIds: string[] | undefined,
  evidenceById: Map<string, Evidence>
): number {
  if (!evidenceIds || evidenceIds.length === 0) {
    return 0;
  }

  return evidenceIds.filter((evidenceId) => {
    const evidence = evidenceById.get(evidenceId);

    return evidence?.verificationStatus === "verified";
  }).length;
}
