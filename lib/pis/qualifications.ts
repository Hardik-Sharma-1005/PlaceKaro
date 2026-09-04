import type {
  Achievement,
  Certification,
  Internship,
  Project,
} from "../../types/database";
import type { PISInput } from "./types";
import {
  canonicalize,
  matchesCanonical,
  matchesDomainInText,
} from "./matching";
import {
  createEvidenceMap,
  hasVerifiedEvidence,
  isVerifiedEvidence,
} from "./evidence";

export type PreferredQualificationType =
  | "relevant_project"
  | "internship_experience"
  | "technical_certification"
  | "domain_certification"
  | "relevant_achievement";

export interface SupportedPreferredQualification {
  type: PreferredQualificationType;
  canonicalRequirement: string;
  originalRequirement: string;
}

function isRelevantProject(
  project: Project,
  input: PISInput
): boolean {
  const {
    job: { requirements },
  } = input;

  const technicalSkills =
    requirements.competencies.technicalSkills ?? [];

  const domainSkills =
    requirements.competencies.domainSkills ?? [];

  const projectTexts = [
    ...project.technologies,
    project.role,
    project.title,
    project.description,
  ];

  const technicalMatch =
    technicalSkills.some((requiredSkill) =>
      projectTexts.some((projectText) =>
        matchesCanonical(
          projectText,
          requiredSkill
        )
      )
    );

  const domainMatch =
    domainSkills.some((requiredDomain) =>
      matchesDomainInText(
        projectTexts,
        requiredDomain
      )
    );

  return technicalMatch || domainMatch;
}

function isRelevantInternship(
  internship: Internship,
  input: PISInput
): boolean {
  const {
    job: { requirements },
  } = input;

  const technicalSkills =
    requirements.competencies.technicalSkills ?? [];

  const domainSkills =
    requirements.competencies.domainSkills ?? [];

  const internshipTexts = [
    internship.role,
    internship.organization,
    internship.description,
  ];

  const technicalMatch =
    technicalSkills.some((requiredSkill) =>
      internshipTexts.some((internshipText) =>
        matchesCanonical(
          internshipText,
          requiredSkill
        )
      )
    );

  const domainMatch =
    domainSkills.some((requiredDomain) =>
      matchesDomainInText(
        internshipTexts,
        requiredDomain
      )
    );

  return technicalMatch || domainMatch;
}

function isRelevantAchievement(
  achievement: Achievement,
  input: PISInput
): boolean {
  const {
    job: { requirements },
  } = input;

  const technicalSkills =
    requirements.competencies.technicalSkills ?? [];

  const domainSkills =
    requirements.competencies.domainSkills ?? [];

  const achievementTexts = [
    achievement.title,
    achievement.organization,
    achievement.category,
  ];

  const technicalMatch =
    technicalSkills.some((requiredSkill) =>
      achievementTexts.some((achievementText) =>
        matchesCanonical(
          achievementText,
          requiredSkill
        )
      )
    );

  const domainMatch =
    domainSkills.some((requiredDomain) =>
      matchesDomainInText(
        achievementTexts,
        requiredDomain
      )
    );

  return technicalMatch || domainMatch;
}

function isTechnicalCertificationRequirement(
  requirement: string,
  input: PISInput
): string | null {
  const canonicalRequirement = canonicalize(
    requirement
  );

  const technicalSkills =
    input.job.requirements.competencies
      .technicalSkills ?? [];

  const matchingSkill = technicalSkills.find(
    (skill) =>
      canonicalRequirement ===
      `${canonicalize(skill)} certification`
  );

  return matchingSkill ?? null;
}

function isDomainCertificationRequirement(
  requirement: string,
  input: PISInput
): string | null {
  const canonicalRequirement = canonicalize(
    requirement
  );

  const domainSkills =
    input.job.requirements.competencies.domainSkills ??
    [];

  const matchingDomain = domainSkills.find(
    (domain) =>
      canonicalRequirement ===
      `${canonicalize(domain)} certification`
  );

  return matchingDomain ?? null;
}

export function parseSupportedPreferredQualification(
  requirement: string,
  input: PISInput
): SupportedPreferredQualification | null {
  const canonicalRequirement =
    canonicalize(requirement);

  if (!canonicalRequirement) {
    return null;
  }

  const relevantProjectPhrases = new Set([
    "relevant project",
    "relevant projects",
    "project experience",
    "project experience required",
  ]);

  if (
    relevantProjectPhrases.has(
      canonicalRequirement
    )
  ) {
    return {
      type: "relevant_project",
      canonicalRequirement,
      originalRequirement: requirement,
    };
  }

  const internshipPhrases = new Set([
    "internship",
    "internship experience",
    "relevant internship",
    "relevant internships",
    "relevant work experience",
  ]);

  if (
    internshipPhrases.has(
      canonicalRequirement
    )
  ) {
    return {
      type: "internship_experience",
      canonicalRequirement,
      originalRequirement: requirement,
    };
  }

  const achievementPhrases = new Set([
    "relevant achievement",
    "relevant achievements",
    "achievement experience",
  ]);

  if (
    achievementPhrases.has(
      canonicalRequirement
    )
  ) {
    return {
      type: "relevant_achievement",
      canonicalRequirement,
      originalRequirement: requirement,
    };
  }

  const technicalCertification =
    isTechnicalCertificationRequirement(
      requirement,
      input
    );

  if (technicalCertification) {
    return {
      type: "technical_certification",
      canonicalRequirement,
      originalRequirement: requirement,
    };
  }

  const domainCertification =
    isDomainCertificationRequirement(
      requirement,
      input
    );

  if (domainCertification) {
    return {
      type: "domain_certification",
      canonicalRequirement,
      originalRequirement: requirement,
    };
  }

  return null;
}

export function isPreferredQualificationSatisfied(
  qualification: SupportedPreferredQualification,
  input: PISInput
): boolean {
  const {
    candidate: {
      projects,
      internships,
      certifications,
      achievements,
      evidence,
    },
  } = input;

  const evidenceById = createEvidenceMap(evidence);

  switch (qualification.type) {
    case "relevant_project":
      return projects.some(
        (project) =>
          hasVerifiedEvidence(
            project.evidenceIds,
            evidenceById
          ) &&
          isRelevantProject(project, input)
      );

    case "internship_experience":
      return internships.some(
        (internship) =>
          hasVerifiedEvidence(
            internship.evidenceIds,
            evidenceById
          ) &&
          isRelevantInternship(
            internship,
            input
          )
      );

    case "relevant_achievement":
      return achievements.some(
        (achievement) =>
          isVerifiedEvidence(
            achievement.evidenceId,
            evidenceById
          ) &&
          isRelevantAchievement(
            achievement,
            input
          )
      );

    case "technical_certification": {
      const requiredSkill =
        isTechnicalCertificationRequirement(
          qualification.originalRequirement,
          input
        );

      if (!requiredSkill) {
        return false;
      }

      return certifications.some(
        (certification) =>
          isVerifiedEvidence(
            certification.evidenceId,
            evidenceById
          ) &&
          (
            matchesCanonical(
              certification.title,
              requiredSkill
            ) ||
            matchesCanonical(
              `${certification.title} certification`,
              `${requiredSkill} certification`
            )
          )
      );
    }

    case "domain_certification": {
      const requiredDomain =
        isDomainCertificationRequirement(
          qualification.originalRequirement,
          input
        );

      if (!requiredDomain) {
        return false;
      }

      return certifications.some(
        (certification) =>
          isVerifiedEvidence(
            certification.evidenceId,
            evidenceById
          ) &&
          (
            matchesCanonical(
              certification.title,
              requiredDomain
            ) ||
            matchesCanonical(
              `${certification.title} certification`,
              `${requiredDomain} certification`
            )
          )
      );
    }
  }
}

export function calculatePreferredQualificationScore(
  input: PISInput
): number | null {
  const requirements =
    input.job.requirements.competencies
      .preferredQualifications ?? [];

  if (requirements.length === 0) {
    return null;
  }

  const supportedQualifications =
    requirements
      .map((requirement) =>
        parseSupportedPreferredQualification(
          requirement,
          input
        )
      )
      .filter(
        (
          qualification
        ): qualification is SupportedPreferredQualification =>
          qualification !== null
      );

  if (supportedQualifications.length === 0) {
    return null;
  }

  const satisfiedCount =
    supportedQualifications.filter(
      (qualification) =>
        isPreferredQualificationSatisfied(
          qualification,
          input
        )
    ).length;

  return (
    (satisfiedCount /
      supportedQualifications.length) *
    100
  );
}
