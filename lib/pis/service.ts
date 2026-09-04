import type {
  Achievement,
  Certification,
  Evidence,
  Internship,
  JobRequirements,
  PISConfiguration,
  Project,
  Skill,
  StudentProfile,
} from "../../types/database";

import {
  getData,
  getDataByChild,
} from "../realtime/database";

import { calculatePIS } from "./engine";
import type { PISInput, PISResult } from "./types";

async function getStudentProfile(
  studentId: string
): Promise<StudentProfile> {
  const profile = await getData<StudentProfile>(
    `studentProfiles/${studentId}`
  );

  if (!profile) {
    throw new Error(
      `Student profile not found for ${studentId}.`
    );
  }

  return profile;
}

async function getJobRequirements(
  jobId: string
): Promise<JobRequirements> {
  const requirements =
    await getData<JobRequirements>(
      `jobRequirements/${jobId}`
    );

  if (!requirements) {
    throw new Error(
      `Job requirements not found for ${jobId}.`
    );
  }

  return requirements;
}

async function getPISConfiguration(
  jobId: string
): Promise<PISConfiguration> {
  const configuration =
    await getData<PISConfiguration>(
      `pisConfigurations/${jobId}`
    );

  if (!configuration) {
    throw new Error(
      `PIS configuration not found for ${jobId}.`
    );
  }

  if (configuration.confirmed !== true) {
    throw new Error(
      `PIS configuration for ${jobId} has not been confirmed.`
    );
  }

  return configuration;
}

async function getCandidateData(
  studentId: string
): Promise<{
  skills: Skill[];
  projects: Project[];
  internships: Internship[];
  certifications: Certification[];
  achievements: Achievement[];
  evidence: Evidence[];
}> {
  const [
    skills,
    projects,
    internships,
    certifications,
    achievements,
    evidence,
  ] = await Promise.all([
    getDataByChild<Skill>(
      "skills",
      "studentId",
      studentId
    ),

    getDataByChild<Project>(
      "projects",
      "studentId",
      studentId
    ),

    getDataByChild<Internship>(
      "internships",
      "studentId",
      studentId
    ),

    getDataByChild<Certification>(
      "certifications",
      "studentId",
      studentId
    ),

    getDataByChild<Achievement>(
      "achievements",
      "studentId",
      studentId
    ),

    getDataByChild<Evidence>(
      "evidence",
      "studentId",
      studentId
    ),
  ]);

  return {
    skills,
    projects,
    internships,
    certifications,
    achievements,
    evidence,
  };
}

export async function buildPISInput(
  studentId: string,
  jobId: string
): Promise<PISInput> {
  if (!studentId) {
    throw new Error(
      "studentId is required."
    );
  }

  if (!jobId) {
    throw new Error(
      "jobId is required."
    );
  }

  const [
    profile,
    requirements,
    configuration,
    candidateData,
  ] = await Promise.all([
    getStudentProfile(studentId),
    getJobRequirements(jobId),
    getPISConfiguration(jobId),
    getCandidateData(studentId),
  ]);

  return {
    candidate: {
      profile,
      skills: candidateData.skills,
      projects: candidateData.projects,
      internships: candidateData.internships,
      certifications:
        candidateData.certifications,
      achievements:
        candidateData.achievements,
      evidence: candidateData.evidence,
    },

    job: {
      requirements,
    },

    configuration,
  };
}

export async function calculatePISFromFirebase(
  studentId: string,
  jobId: string
): Promise<PISResult> {
  const input = await buildPISInput(
    studentId,
    jobId
  );

  return calculatePIS(input);
}
