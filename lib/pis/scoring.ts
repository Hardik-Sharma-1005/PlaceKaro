import type {
  Achievement,
  Certification,
  Evidence,
  Internship,
  JobRequirements,
  Project,
  StudentProfile,
} from "../../types/database";
import type { PISInput } from "./types";
import {
  matchesCanonical,
  matchesDomainInText,
} from "./matching";
import {
  createEvidenceMap,
  hasVerifiedEvidence,
  isVerifiedEvidence,
} from "./evidence";

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, score));
}

function calculateAcademicPerformance(
  profile: StudentProfile
): number {
  return clampScore((profile.cgpa / 10) * 100);
}

function calculateAttendance(
  profile: StudentProfile
): number {
  return clampScore(profile.attendance);
}

function calculateBacklogs(
  profile: StudentProfile
): number {
  return clampScore(
    100 / (1 + Math.max(0, profile.backlogCount))
  );
}

function calculateGraduationYear(
  profile: StudentProfile,
  requirements: JobRequirements
): number | null {
  const preferredYears =
    requirements.hardEligibility.graduationYears;

  if (!preferredYears || preferredYears.length === 0) {
    return null;
  }

  return preferredYears.includes(profile.graduationYear)
    ? 100
    : 0;
}

function calculateVerifiedSkillMatchPercentage(
  verifiedCandidateSkills: string[],
  requiredSkills: string[]
): number | null {
  const uniqueRequiredSkills = Array.from(
    new Set(
      requiredSkills
        .map((skill) => skill.trim())
        .filter(Boolean)
    )
  );

  if (uniqueRequiredSkills.length === 0) {
    return null;
  }

  const matchedCount = uniqueRequiredSkills.filter(
    (requiredSkill) =>
      verifiedCandidateSkills.some((candidateSkill) =>
        matchesCanonical(
          candidateSkill,
          requiredSkill
        )
      )
  ).length;

  return clampScore(
    (matchedCount / uniqueRequiredSkills.length) * 100
  );
}

function getVerifiedCandidateSkillNames(
  input: PISInput
): string[] {
  const {
    candidate: { skills, evidence },
  } = input;

  const evidenceById = createEvidenceMap(evidence);

  return skills
    .filter((skill) =>
      hasVerifiedEvidence(
        skill.evidenceIds,
        evidenceById
      )
    )
    .map((skill) => skill.name);
}

function calculateProjectQuantityScore(
  verifiedProjects: Project[]
): number | null {
  if (verifiedProjects.length === 0) {
    return null;
  }

  return clampScore(
    Math.min(verifiedProjects.length / 2, 1) * 100
  );
}

function calculateProjectTechnicalRelevance(
  project: Project,
  requiredTechnicalSkills: string[]
): number | null {
  if (requiredTechnicalSkills.length === 0) {
    return null;
  }

  const projectTexts = [
    ...project.technologies,
    project.role,
    project.title,
    project.description,
  ];

  const uniqueRequiredSkills = Array.from(
    new Set(
      requiredTechnicalSkills
        .map((skill) => skill.trim())
        .filter(Boolean)
    )
  );

  const matchedCount = uniqueRequiredSkills.filter(
    (requiredSkill) =>
      projectTexts.some((projectText) =>
        matchesCanonical(
          projectText,
          requiredSkill
        )
      )
  ).length;

  return clampScore(
    (matchedCount / uniqueRequiredSkills.length) * 100
  );
}

function calculateProjectDomainRelevance(
  project: Project,
  requiredDomainSkills: string[]
): number | null {
  if (requiredDomainSkills.length === 0) {
    return null;
  }

  const projectTexts = [
    project.title,
    project.role,
    project.description,
    ...project.technologies,
  ];

  const uniqueRequiredDomains = Array.from(
    new Set(
      requiredDomainSkills
        .map((domain) => domain.trim())
        .filter(Boolean)
    )
  );

  const matchedCount = uniqueRequiredDomains.filter(
    (requiredDomain) =>
      matchesDomainInText(
        projectTexts,
        requiredDomain
      )
  ).length;

  return clampScore(
    (matchedCount / uniqueRequiredDomains.length) * 100
  );
}

function calculateProjectRelevance(
  project: Project,
  requirements: JobRequirements
): number | null {
  const technicalRelevance =
    calculateProjectTechnicalRelevance(
      project,
      requirements.competencies
        .technicalSkills ?? []
    );

  const domainRelevance =
    calculateProjectDomainRelevance(
      project,
      requirements.competencies
        .domainSkills ?? []
    );

  const applicableScores = [
    technicalRelevance,
    domainRelevance,
  ].filter(
    (score): score is number => score !== null
  );

  if (applicableScores.length === 0) {
    return null;
  }

  return clampScore(
    applicableScores.reduce(
      (total, score) => total + score,
      0
    ) / applicableScores.length
  );
}

function calculateProjectScore(
  input: PISInput
): number | null {
  const {
    candidate: { projects, evidence },
    job: { requirements },
  } = input;

  const evidenceById = createEvidenceMap(evidence);

  const verifiedProjects = projects.filter((project) =>
    hasVerifiedEvidence(
      project.evidenceIds,
      evidenceById
    )
  );

  const quantityScore =
    calculateProjectQuantityScore(
      verifiedProjects
    );

  if (quantityScore === null) {
    return null;
  }

  const relevanceScores = verifiedProjects
    .map((project) =>
      calculateProjectRelevance(
        project,
        requirements
      )
    )
    .filter(
      (score): score is number => score !== null
    );

  if (relevanceScores.length === 0) {
    return quantityScore;
  }

  const relevanceScore = clampScore(
    relevanceScores.reduce(
      (total, score) => total + score,
      0
    ) / relevanceScores.length
  );

  return clampScore(
    quantityScore * 0.4 +
      relevanceScore * 0.6
  );
}

function calculateInternshipQuantityScore(
  verifiedInternships: Internship[]
): number | null {
  if (verifiedInternships.length === 0) {
    return null;
  }

  return clampScore(
    Math.min(
      verifiedInternships.length / 2,
      1
    ) * 100
  );
}

function calculateInternshipTechnicalRelevance(
  internship: Internship,
  requiredTechnicalSkills: string[]
): number | null {
  if (requiredTechnicalSkills.length === 0) {
    return null;
  }

  const internshipTexts = [
    internship.role,
    internship.organization,
    internship.description,
  ];

  const uniqueRequiredSkills = Array.from(
    new Set(
      requiredTechnicalSkills
        .map((skill) => skill.trim())
        .filter(Boolean)
    )
  );

  const matchedCount = uniqueRequiredSkills.filter(
    (requiredSkill) =>
      internshipTexts.some((internshipText) =>
        matchesCanonical(
          internshipText,
          requiredSkill
        )
      )
  ).length;

  return clampScore(
    (matchedCount / uniqueRequiredSkills.length) * 100
  );
}

function calculateInternshipDomainRelevance(
  internship: Internship,
  requiredDomainSkills: string[]
): number | null {
  if (requiredDomainSkills.length === 0) {
    return null;
  }

  const internshipTexts = [
    internship.role,
    internship.organization,
    internship.description,
  ];

  const uniqueRequiredDomains = Array.from(
    new Set(
      requiredDomainSkills
        .map((domain) => domain.trim())
        .filter(Boolean)
    )
  );

  const matchedCount = uniqueRequiredDomains.filter(
    (requiredDomain) =>
      matchesDomainInText(
        internshipTexts,
        requiredDomain
      )
  ).length;

  return clampScore(
    (matchedCount / uniqueRequiredDomains.length) * 100
  );
}

function calculateInternshipRelevance(
  internship: Internship,
  requirements: JobRequirements
): number | null {
  const technicalRelevance =
    calculateInternshipTechnicalRelevance(
      internship,
      requirements.competencies
        .technicalSkills ?? []
    );

  const domainRelevance =
    calculateInternshipDomainRelevance(
      internship,
      requirements.competencies
        .domainSkills ?? []
    );

  const applicableScores = [
    technicalRelevance,
    domainRelevance,
  ].filter(
    (score): score is number => score !== null
  );

  if (applicableScores.length === 0) {
    return null;
  }

  return clampScore(
    applicableScores.reduce(
      (total, score) => total + score,
      0
    ) / applicableScores.length
  );
}

function calculateInternshipScore(
  input: PISInput
): number | null {
  const {
    candidate: { internships, evidence },
    job: { requirements },
  } = input;

  const evidenceById = createEvidenceMap(evidence);

  const verifiedInternships =
    internships.filter((internship) =>
      hasVerifiedEvidence(
        internship.evidenceIds,
        evidenceById
      )
    );

  const quantityScore =
    calculateInternshipQuantityScore(
      verifiedInternships
    );

  if (quantityScore === null) {
    return null;
  }

  const relevanceScores = verifiedInternships
    .map((internship) =>
      calculateInternshipRelevance(
        internship,
        requirements
      )
    )
    .filter(
      (score): score is number => score !== null
    );

  if (relevanceScores.length === 0) {
    return quantityScore;
  }

  const relevanceScore = clampScore(
    relevanceScores.reduce(
      (total, score) => total + score,
      0
    ) / relevanceScores.length
  );

  return clampScore(
    quantityScore * 0.4 +
      relevanceScore * 0.6
  );
}

function calculateCertificationQuantityScore(
  verifiedCertifications: Certification[]
): number | null {
  if (verifiedCertifications.length === 0) {
    return null;
  }

  return clampScore(
    Math.min(
      verifiedCertifications.length / 2,
      1
    ) * 100
  );
}

function calculateCertificationRelevance(
  certification: Certification,
  requirements: JobRequirements
): number | null {
  const texts = [
    certification.title,
    certification.issuer,
  ];

  const technicalSkills =
    requirements.competencies
      .technicalSkills ?? [];

  const domainSkills =
    requirements.competencies
      .domainSkills ?? [];

  const technicalRelevance =
    technicalSkills.length > 0
      ? calculateTextRequirementMatch(
          texts,
          technicalSkills
        )
      : null;

  const domainRelevance =
    domainSkills.length > 0
      ? calculateTextRequirementMatch(
          texts,
          domainSkills
        )
      : null;

  const applicableScores = [
    technicalRelevance,
    domainRelevance,
  ].filter(
    (score): score is number => score !== null
  );

  if (applicableScores.length === 0) {
    return null;
  }

  return clampScore(
    applicableScores.reduce(
      (total, score) => total + score,
      0
    ) / applicableScores.length
  );
}

function calculateAchievementRelevance(
  achievement: Achievement,
  requirements: JobRequirements
): number | null {
  const texts = [
    achievement.title,
    achievement.organization,
    achievement.category,
  ];

  const technicalSkills =
    requirements.competencies
      .technicalSkills ?? [];

  const domainSkills =
    requirements.competencies
      .domainSkills ?? [];

  const technicalRelevance =
    technicalSkills.length > 0
      ? calculateTextRequirementMatch(
          texts,
          technicalSkills
        )
      : null;

  const domainRelevance =
    domainSkills.length > 0
      ? calculateTextRequirementMatch(
          texts,
          domainSkills
        )
      : null;

  const applicableScores = [
    technicalRelevance,
    domainRelevance,
  ].filter(
    (score): score is number => score !== null
  );

  if (applicableScores.length === 0) {
    return null;
  }

  return clampScore(
    applicableScores.reduce(
      (total, score) => total + score,
      0
    ) / applicableScores.length
  );
}

function calculateTextRequirementMatch(
  texts: string[],
  requirements: string[]
): number | null {
  const uniqueRequirements = Array.from(
    new Set(
      requirements
        .map((requirement) => requirement.trim())
        .filter(Boolean)
    )
  );

  if (uniqueRequirements.length === 0) {
    return null;
  }

  const matchedCount = uniqueRequirements.filter(
    (requirement) =>
      texts.some((text) =>
        matchesCanonical(
          text,
          requirement
        )
      )
  ).length;

  return clampScore(
    (matchedCount / uniqueRequirements.length) * 100
  );
}

function calculateCertificationScore(
  input: PISInput
): number | null {
  const {
    candidate: {
      certifications,
      evidence,
    },
    job: { requirements },
  } = input;

  const evidenceById = createEvidenceMap(evidence);

  const verifiedCertifications =
    certifications.filter((certification) =>
      isVerifiedEvidence(
        certification.evidenceId,
        evidenceById
      )
    );

  const quantityScore =
    calculateCertificationQuantityScore(
      verifiedCertifications
    );

  if (quantityScore === null) {
    return null;
  }

  const relevanceScores =
    verifiedCertifications
      .map((certification) =>
        calculateCertificationRelevance(
          certification,
          requirements
        )
      )
      .filter(
        (score): score is number =>
          score !== null
      );

  if (relevanceScores.length === 0) {
    return quantityScore;
  }

  const relevanceScore = clampScore(
    relevanceScores.reduce(
      (total, score) => total + score,
      0
    ) / relevanceScores.length
  );

  return clampScore(
    quantityScore * 0.3 +
      relevanceScore * 0.7
  );
}

function calculateAchievementQuantityScore(
  verifiedAchievements: Achievement[]
): number | null {
  if (verifiedAchievements.length === 0) {
    return null;
  }

  return clampScore(
    Math.min(
      verifiedAchievements.length / 2,
      1
    ) * 100
  );
}

function calculateAchievementScore(
  input: PISInput
): number | null {
  const {
    candidate: {
      achievements,
      evidence,
    },
    job: { requirements },
  } = input;

  const evidenceById = createEvidenceMap(evidence);

  const verifiedAchievements =
    achievements.filter((achievement) =>
      isVerifiedEvidence(
        achievement.evidenceId,
        evidenceById
      )
    );

  const quantityScore =
    calculateAchievementQuantityScore(
      verifiedAchievements
    );

  if (quantityScore === null) {
    return null;
  }

  const relevanceScores =
    verifiedAchievements
      .map((achievement) =>
        calculateAchievementRelevance(
          achievement,
          requirements
        )
      )
      .filter(
        (score): score is number =>
          score !== null
      );

  if (relevanceScores.length === 0) {
    return quantityScore;
  }

  const relevanceScore = clampScore(
    relevanceScores.reduce(
      (total, score) => total + score,
      0
    ) / relevanceScores.length
  );

  return clampScore(
    quantityScore * 0.3 +
      relevanceScore * 0.7
  );
}

function calculateEvidenceQualityScore(
  input: PISInput
): number | null {
  const {
    candidate: {
      skills,
      projects,
      internships,
      certifications,
      achievements,
      evidence,
    },
  } = input;

  const evidenceById = createEvidenceMap(evidence);

  const totalEligibleItems =
    skills.length +
    projects.length +
    internships.length +
    certifications.length +
    achievements.length;

  if (totalEligibleItems === 0) {
    return null;
  }

  let verifiedCoveredItems = 0;

  for (const skill of skills) {
    if (
      hasVerifiedEvidence(
        skill.evidenceIds,
        evidenceById
      )
    ) {
      verifiedCoveredItems += 1;
    }
  }

  for (const project of projects) {
    if (
      hasVerifiedEvidence(
        project.evidenceIds,
        evidenceById
      )
    ) {
      verifiedCoveredItems += 1;
    }
  }

  for (const internship of internships) {
    if (
      hasVerifiedEvidence(
        internship.evidenceIds,
        evidenceById
      )
    ) {
      verifiedCoveredItems += 1;
    }
  }

  for (const certification of certifications) {
    if (
      isVerifiedEvidence(
        certification.evidenceId,
        evidenceById
      )
    ) {
      verifiedCoveredItems += 1;
    }
  }

  for (const achievement of achievements) {
    if (
      isVerifiedEvidence(
        achievement.evidenceId,
        evidenceById
      )
    ) {
      verifiedCoveredItems += 1;
    }
  }

  return clampScore(
    (verifiedCoveredItems /
      totalEligibleItems) *
      100
  );
}

export function calculateSimpleParameterScores(
  input: PISInput
): Record<string, number | null> {
  const {
    candidate: { profile },
    job: { requirements },
  } = input;

  return {
    academicPerformance:
      calculateAcademicPerformance(profile),

    attendance:
      calculateAttendance(profile),

    backlogs:
      calculateBacklogs(profile),

    graduationYear:
      calculateGraduationYear(
        profile,
        requirements
      ),
  };
}

export function calculateSkillParameterScores(
  input: PISInput
): {
  technicalSkills: number | null;
  domainSkills: number | null;
} {
  const {
    job: { requirements },
  } = input;

  const verifiedCandidateSkillNames =
    getVerifiedCandidateSkillNames(input);

  return {
    technicalSkills:
      calculateVerifiedSkillMatchPercentage(
        verifiedCandidateSkillNames,
        requirements.competencies
          .technicalSkills ?? []
      ),

    domainSkills:
      calculateVerifiedSkillMatchPercentage(
        verifiedCandidateSkillNames,
        requirements.competencies
          .domainSkills ?? []
      ),
  };
}

export function calculateProjectParameterScore(
  input: PISInput
): number | null {
  return calculateProjectScore(input);
}

export function calculateInternshipParameterScore(
  input: PISInput
): number | null {
  return calculateInternshipScore(input);
}

export function calculateCertificationParameterScore(
  input: PISInput
): number | null {
  return calculateCertificationScore(input);
}

export function calculateAchievementParameterScore(
  input: PISInput
): number | null {
  return calculateAchievementScore(input);
}

export function calculateEvidenceQualityParameterScore(
  input: PISInput
): number | null {
  return calculateEvidenceQualityScore(input);
}
