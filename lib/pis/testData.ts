import {
  demoAchievements,
  demoCertifications,
  demoEvidence,
  demoInternships,
  demoJobRequirements,
  demoProjects,
  demoSkills,
  demoStudentProfiles,
  demoUsers,
} from "../seed/demoData";

import type {
  Evidence,
  JobRequirements,
  Project,
} from "../../types/database";

import type { PISInput } from "./types";

function getDemoJobRequirements(): JobRequirements {
  const requirements = demoJobRequirements.find(
    (item) => item.jobId === "job-001"
  );

  if (!requirements) {
    throw new Error(
      "Demo job requirements for job-001 were not found."
    );
  }

  return requirements;
}

function createTestEvidence(
  studentId: string,
  evidenceId: string,
  title: string,
  type: string
): Evidence {
  return {
    id: evidenceId,
    studentId,
    type,
    title,
    uploadedAt: 1760000000000,
    verificationStatus: "verified",
    verifiedAt: 1760000000000,
  };
}

function buildCandidateInput(
  studentId: string,
  jobRequirements: JobRequirements
): PISInput {
  const profile = demoStudentProfiles.find(
    (item) => item.userId === studentId
  );

  if (!profile) {
    throw new Error(
      `Demo student profile not found for ${studentId}.`
    );
  }

  const baseSkills = demoSkills.filter(
    (skill) => skill.studentId === studentId
  );

  const baseProjects = demoProjects.filter(
    (project) => project.studentId === studentId
  );

  const baseInternships = demoInternships.filter(
    (internship) =>
      internship.studentId === studentId
  );

  const baseCertifications =
    demoCertifications.filter(
      (certification) =>
        certification.studentId === studentId
    );

  const baseAchievements =
    demoAchievements.filter(
      (achievement) =>
        achievement.studentId === studentId
    );

  const baseEvidence = demoEvidence.filter(
    (evidence) =>
      evidence.studentId === studentId
  );

  const testEvidence: Evidence[] = [
    ...baseEvidence,
  ];

  const skills = baseSkills.map((skill, index) => {
    const evidenceId =
      `pis-test-${studentId}-skill-${index + 1}`;

    testEvidence.push(
      createTestEvidence(
        studentId,
        evidenceId,
        `${skill.name} Verification`,
        "skill"
      )
    );

    return {
      ...skill,
      evidenceIds: [evidenceId],
    };
  });

  const projects: Project[] = baseProjects.map(
    (project, index) => {
      const evidenceId =
        `pis-test-${studentId}-project-${index + 1}`;

      testEvidence.push(
        createTestEvidence(
          studentId,
          evidenceId,
          `${project.title} Verification`,
          "project"
        )
      );

      return {
        ...project,
        evidenceIds: [evidenceId],
      };
    }
  );

  const internships = baseInternships.map(
    (internship, index) => {
      const evidenceId =
        `pis-test-${studentId}-internship-${index + 1}`;

      testEvidence.push(
        createTestEvidence(
          studentId,
          evidenceId,
          `${internship.role} Verification`,
          "internship"
        )
      );

      return {
        ...internship,
        evidenceIds: [evidenceId],
      };
    }
  );

  const certifications =
    baseCertifications.map(
      (certification, index) => {
        const evidenceId =
          `pis-test-${studentId}-certification-${index + 1}`;

        testEvidence.push(
          createTestEvidence(
            studentId,
            evidenceId,
            `${certification.title} Verification`,
            "certificate"
          )
        );

        return {
          ...certification,
          evidenceId,
        };
      }
    );

  const achievements =
    baseAchievements.map(
      (achievement, index) => {
        const evidenceId =
          `pis-test-${studentId}-achievement-${index + 1}`;

        testEvidence.push(
          createTestEvidence(
            studentId,
            evidenceId,
            `${achievement.title} Verification`,
            "achievement"
          )
        );

        return {
          ...achievement,
          evidenceId,
        };
      }
    );

  return {
    candidate: {
      profile,
      skills,
      projects,
      internships,
      certifications,
      achievements,
      evidence: testEvidence,
    },

    job: {
      requirements: jobRequirements,
    },

    configuration: {
      jobId: "job-001",

      parameters: {
        academicPerformance: 25,
        technicalSkills: 35,
        projects: 20,
        internships: 20,
      },

      confirmed: true,
      updatedAt: 1760000000000,
    },
  };
}

const jobRequirements =
  getDemoJobRequirements();

export const demoPISInputs: PISInput[] =
  demoUsers
    .filter(
      (user) => user.role === "student"
    )
    .map((student) =>
      buildCandidateInput(
        student.uid,
        jobRequirements
      )
    );
