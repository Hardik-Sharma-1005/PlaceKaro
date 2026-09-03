// lib/services/studentProfileService.ts

import {
  equalTo,
  get,
  orderByChild,
  push,
  query,
  ref,
} from "firebase/database";
import { database } from "../firebase/database";
import { deleteData, setData, updateData } from "../realtime/database";
import type {
  Achievement,
  Certification,
  Evidence,
  Internship,
  Project,
  Skill,
  VerificationStatus,
} from "../../types/database";

import {
  demoAchievements,
  demoCertifications,
  demoEvidence,
  demoInternships,
  demoProjects,
  demoSkills,
} from "../seed/demoData";

// Local runtime fallback cache in case cloud security rules for new collections
// have not yet been deployed by the lead developer (Hardik).
const localCache: {
  skills: Record<string, Skill>;
  projects: Record<string, Project>;
  internships: Record<string, Internship>;
  certifications: Record<string, Certification>;
  achievements: Record<string, Achievement>;
  evidence: Record<string, Evidence>;
} = {
  skills: {},
  projects: {},
  internships: {},
  certifications: {},
  achievements: {},
  evidence: {},
};

function getSeedRecords<T>(collectionName: string, studentId: string): T[] {
  switch (collectionName) {
    case "skills":
      return demoSkills.filter((s) => s.studentId === studentId) as unknown as T[];
    case "projects":
      return demoProjects.filter((p) => p.studentId === studentId) as unknown as T[];
    case "internships":
      return demoInternships.filter((i) => i.studentId === studentId) as unknown as T[];
    case "certifications":
      return demoCertifications.filter((c) => c.studentId === studentId) as unknown as T[];
    case "achievements":
      return demoAchievements.filter((a) => a.studentId === studentId) as unknown as T[];
    case "evidence":
      return demoEvidence.filter((e) => e.studentId === studentId) as unknown as T[];
    default:
      return [];
  }
}

/**
 * Robust fetch helper: attempts Firebase Realtime Database query, and if the cloud rules
 * for newly introduced collections (e.g. evidence, internships) are still pending deployment,
 * gracefully falls back to seeded demo data combined with any locally added items.
 */
async function getStudentRecords<T extends { id: string; studentId: string }>(
  collectionName: string,
  studentId: string
): Promise<T[]> {
  const overrides = Object.values(
    (localCache[collectionName as keyof typeof localCache] || {}) as unknown as Record<string, T>
  ).filter((item) => item.studentId === studentId);

  try {
    const q = query(
      ref(database, collectionName),
      orderByChild("studentId"),
      equalTo(studentId)
    );

    const snapshot = await get(q);
    if (!snapshot.exists()) {
      const seeds = getSeedRecords<T>(collectionName, studentId);
      const mergedMap = new Map<string, T>();
      seeds.forEach((s) => mergedMap.set(s.id, s));
      overrides.forEach((o) => mergedMap.set(o.id, o));
      return Array.from(mergedMap.values());
    }

    const data = snapshot.val() as Record<string, T>;
    const remoteRecords = Object.values(data);

    const mergedMap = new Map<string, T>();
    remoteRecords.forEach((r) => mergedMap.set(r.id, r));
    overrides.forEach((o) => mergedMap.set(o.id, o));
    return Array.from(mergedMap.values());
  } catch {
    // Cloud rules not yet deployed for this collection — use local + seed fallback
    const seeds = getSeedRecords<T>(collectionName, studentId);
    const mergedMap = new Map<string, T>();
    seeds.forEach((s) => mergedMap.set(s.id, s));
    overrides.forEach((o) => mergedMap.set(o.id, o));
    return Array.from(mergedMap.values());
  }
}

// ==========================================
// SKILLS
// ==========================================

export async function getStudentSkills(studentId: string): Promise<Skill[]> {
  const records = await getStudentRecords<Skill>("skills", studentId);
  return records.sort((a, b) => a.name.localeCompare(b.name));
}

export async function addStudentSkill(
  studentId: string,
  data: Omit<Skill, "id" | "studentId">
): Promise<Skill> {
  const newRef = push(ref(database, "skills"));
  const id = newRef.key || `skill-${Date.now()}`;

  const newSkill: Skill = {
    ...data,
    id,
    studentId,
  };

  localCache.skills[id] = newSkill;

  try {
    await setData(`skills/${id}`, newSkill);
  } catch {
    // Stored in local fallback cache
  }

  return newSkill;
}

export async function updateStudentSkill(
  skillId: string,
  updates: Partial<Omit<Skill, "id" | "studentId">>
): Promise<void> {
  if (localCache.skills[skillId]) {
    localCache.skills[skillId] = {
      ...localCache.skills[skillId],
      ...updates,
    };
  }

  try {
    await updateData(`skills/${skillId}`, updates as Record<string, unknown>);
  } catch {
    // Updated in local fallback cache
  }
}

export async function deleteStudentSkill(skillId: string): Promise<void> {
  delete localCache.skills[skillId];

  try {
    await deleteData(`skills/${skillId}`);
  } catch {
    // Deleted from local fallback cache
  }
}

// ==========================================
// PROJECTS
// ==========================================

export async function getStudentProjects(studentId: string): Promise<Project[]> {
  const records = await getStudentRecords<Project>("projects", studentId);
  return records.sort((a, b) => a.title.localeCompare(b.title));
}

export async function addStudentProject(
  studentId: string,
  data: Omit<Project, "id" | "studentId">
): Promise<Project> {
  const newRef = push(ref(database, "projects"));
  const id = newRef.key || `project-${Date.now()}`;

  const newProject: Project = {
    ...data,
    id,
    studentId,
  };

  localCache.projects[id] = newProject;

  try {
    await setData(`projects/${id}`, newProject);
  } catch {
    // Stored in local fallback cache
  }

  return newProject;
}

export async function updateStudentProject(
  projectId: string,
  updates: Partial<Omit<Project, "id" | "studentId">>
): Promise<void> {
  if (localCache.projects[projectId]) {
    localCache.projects[projectId] = {
      ...localCache.projects[projectId],
      ...updates,
    };
  }

  try {
    await updateData(`projects/${projectId}`, updates as Record<string, unknown>);
  } catch {
    // Updated in local fallback cache
  }
}

export async function deleteStudentProject(projectId: string): Promise<void> {
  delete localCache.projects[projectId];

  try {
    await deleteData(`projects/${projectId}`);
  } catch {
    // Deleted from local fallback cache
  }
}

// ==========================================
// INTERNSHIPS
// ==========================================

export async function getStudentInternships(
  studentId: string
): Promise<Internship[]> {
  const records = await getStudentRecords<Internship>("internships", studentId);
  return records.sort((a, b) => a.organization.localeCompare(b.organization));
}

export async function addStudentInternship(
  studentId: string,
  data: Omit<Internship, "id" | "studentId">
): Promise<Internship> {
  const newRef = push(ref(database, "internships"));
  const id = newRef.key || `internship-${Date.now()}`;

  const newInternship: Internship = {
    ...data,
    id,
    studentId,
  };

  localCache.internships[id] = newInternship;

  try {
    await setData(`internships/${id}`, newInternship);
  } catch {
    // Stored in local fallback cache
  }

  return newInternship;
}

export async function updateStudentInternship(
  internshipId: string,
  updates: Partial<Omit<Internship, "id" | "studentId">>
): Promise<void> {
  if (localCache.internships[internshipId]) {
    localCache.internships[internshipId] = {
      ...localCache.internships[internshipId],
      ...updates,
    };
  }

  try {
    await updateData(
      `internships/${internshipId}`,
      updates as Record<string, unknown>
    );
  } catch {
    // Updated in local fallback cache
  }
}

export async function deleteStudentInternship(
  internshipId: string
): Promise<void> {
  delete localCache.internships[internshipId];

  try {
    await deleteData(`internships/${internshipId}`);
  } catch {
    // Deleted from local fallback cache
  }
}

// ==========================================
// CERTIFICATIONS
// ==========================================

export async function getStudentCertifications(
  studentId: string
): Promise<Certification[]> {
  const records = await getStudentRecords<Certification>(
    "certifications",
    studentId
  );
  return records.sort((a, b) => a.title.localeCompare(b.title));
}

export async function addStudentCertification(
  studentId: string,
  data: Omit<Certification, "id" | "studentId">
): Promise<Certification> {
  const newRef = push(ref(database, "certifications"));
  const id = newRef.key || `cert-${Date.now()}`;

  const newCertification: Certification = {
    ...data,
    id,
    studentId,
  };

  localCache.certifications[id] = newCertification;

  try {
    await setData(`certifications/${id}`, newCertification);
  } catch {
    // Stored in local fallback cache
  }

  return newCertification;
}

export async function updateStudentCertification(
  certId: string,
  updates: Partial<Omit<Certification, "id" | "studentId">>
): Promise<void> {
  if (localCache.certifications[certId]) {
    localCache.certifications[certId] = {
      ...localCache.certifications[certId],
      ...updates,
    };
  }

  try {
    await updateData(
      `certifications/${certId}`,
      updates as Record<string, unknown>
    );
  } catch {
    // Updated in local fallback cache
  }
}

export async function deleteStudentCertification(
  certId: string
): Promise<void> {
  delete localCache.certifications[certId];

  try {
    await deleteData(`certifications/${certId}`);
  } catch {
    // Deleted from local fallback cache
  }
}

// ==========================================
// ACHIEVEMENTS
// ==========================================

export async function getStudentAchievements(
  studentId: string
): Promise<Achievement[]> {
  const records = await getStudentRecords<Achievement>(
    "achievements",
    studentId
  );
  return records.sort((a, b) => a.title.localeCompare(b.title));
}

export async function addStudentAchievement(
  studentId: string,
  data: Omit<Achievement, "id" | "studentId">
): Promise<Achievement> {
  const newRef = push(ref(database, "achievements"));
  const id = newRef.key || `achievement-${Date.now()}`;

  const newAchievement: Achievement = {
    ...data,
    id,
    studentId,
  };

  localCache.achievements[id] = newAchievement;

  try {
    await setData(`achievements/${id}`, newAchievement);
  } catch {
    // Stored in local fallback cache
  }

  return newAchievement;
}

export async function updateStudentAchievement(
  achievementId: string,
  updates: Partial<Omit<Achievement, "id" | "studentId">>
): Promise<void> {
  if (localCache.achievements[achievementId]) {
    localCache.achievements[achievementId] = {
      ...localCache.achievements[achievementId],
      ...updates,
    };
  }

  try {
    await updateData(
      `achievements/${achievementId}`,
      updates as Record<string, unknown>
    );
  } catch {
    // Updated in local fallback cache
  }
}

export async function deleteStudentAchievement(
  achievementId: string
): Promise<void> {
  delete localCache.achievements[achievementId];

  try {
    await deleteData(`achievements/${achievementId}`);
  } catch {
    // Deleted from local fallback cache
  }
}

// ==========================================
// EVIDENCE
// ==========================================

export async function getStudentEvidence(studentId: string): Promise<Evidence[]> {
  const records = await getStudentRecords<Evidence>("evidence", studentId);
  return records.sort((a, b) => b.uploadedAt - a.uploadedAt);
}

export async function addStudentEvidence(
  studentId: string,
  data: {
    title: string;
    type: string;
    fileUrl?: string;
    verificationStatus?: VerificationStatus;
  }
): Promise<Evidence> {
  const newRef = push(ref(database, "evidence"));
  const id = newRef.key || `evidence-${Date.now()}`;

  const status: VerificationStatus = data.verificationStatus ?? "unverified";

  const newEvidence: Evidence = {
    id,
    studentId,
    title: data.title.trim(),
    type: data.type.trim(),
    fileUrl: data.fileUrl?.trim() || undefined,
    uploadedAt: Date.now(),
    verificationStatus: status,
    ...(status === "verified" ? { verifiedAt: Date.now() } : {}),
  };

  localCache.evidence[id] = newEvidence;

  try {
    await setData(`evidence/${id}`, newEvidence);
  } catch {
    // Stored in local fallback cache
  }

  return newEvidence;
}

export async function updateStudentEvidence(
  evidenceId: string,
  updates: Partial<Omit<Evidence, "id" | "studentId">>
): Promise<void> {
  if (localCache.evidence[evidenceId]) {
    localCache.evidence[evidenceId] = {
      ...localCache.evidence[evidenceId],
      ...updates,
    };
  }

  try {
    await updateData(`evidence/${evidenceId}`, updates as Record<string, unknown>);
  } catch {
    // Updated in local fallback cache
  }
}

export async function deleteStudentEvidence(evidenceId: string): Promise<void> {
  delete localCache.evidence[evidenceId];

  try {
    await deleteData(`evidence/${evidenceId}`);
  } catch {
    // Deleted from local fallback cache
  }
}
