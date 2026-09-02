import type { PISConfiguration } from "../../types/database";
import type {
  PISInput,
  PISParameter,
  PISParameterResult,
  PISResult,
} from "./types";
import {
  calculateAchievementParameterScore,
  calculateCertificationParameterScore,
  calculateEvidenceQualityParameterScore,
  calculateInternshipParameterScore,
  calculateProjectParameterScore,
  calculateSkillParameterScores,
  calculateSimpleParameterScores,
} from "./scoring";
import { calculatePreferredQualificationScore } from "./qualifications";

const PIS_PARAMETERS: readonly PISParameter[] = [
  "academicPerformance",
  "attendance",
  "backlogs",
  "graduationYear",
  "technicalSkills",
  "domainSkills",
  "projects",
  "internships",
  "certifications",
  "achievements",
  "evidenceQuality",
  "preferredQualifications",
];

function isPISParameter(
  value: string
): value is PISParameter {
  return PIS_PARAMETERS.includes(
    value as PISParameter
  );
}

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, score));
}

function roundScore(
  score: number,
  decimals = 4
): number {
  const factor = 10 ** decimals;
  return Math.round(score * factor) / factor;
}

function validateConfiguration(
  configuration: PISConfiguration
): string | null {
  if (!configuration.jobId) {
    return "PIS configuration must include a jobId.";
  }

  if (!configuration.parameters) {
    return "PIS configuration must include parameters.";
  }

  const entries = Object.entries(
    configuration.parameters
  );

  if (entries.length === 0) {
    return "At least one PIS parameter must be selected.";
  }

  let totalWeight = 0;

  for (const [parameter, weight] of entries) {
    if (!isPISParameter(parameter)) {
      return `Unsupported PIS parameter: ${parameter}.`;
    }

    if (
      typeof weight !== "number" ||
      !Number.isFinite(weight)
    ) {
      return `Weight for ${parameter} must be a finite number.`;
    }

    if (weight <= 0) {
      return `Weight for ${parameter} must be greater than 0.`;
    }

    totalWeight += weight;
  }

  if (Math.abs(totalWeight - 100) > 0.000001) {
    return `PIS configuration weights must total 100. Current total: ${totalWeight}.`;
  }

  return null;
}

function calculateParameterScore(
  parameter: PISParameter,
  input: PISInput
): number | null {
  switch (parameter) {
    case "academicPerformance":
    case "attendance":
    case "backlogs":
    case "graduationYear": {
      const scores =
        calculateSimpleParameterScores(input);

      return scores[parameter];
    }

    case "technicalSkills":
    case "domainSkills": {
      const scores =
        calculateSkillParameterScores(input);

      return scores[parameter];
    }

    case "projects":
      return calculateProjectParameterScore(input);

    case "internships":
      return calculateInternshipParameterScore(input);

    case "certifications":
      return calculateCertificationParameterScore(
        input
      );

    case "achievements":
      return calculateAchievementParameterScore(
        input
      );

    case "evidenceQuality":
      return calculateEvidenceQualityParameterScore(
        input
      );

    case "preferredQualifications":
      return calculatePreferredQualificationScore(
        input
      );
  }
}

function buildParameterResults(
  input: PISInput,
  configuration: PISConfiguration
): {
  components: PISParameterResult[];
  missingParameters: PISParameter[];
  availableParameters: PISParameter[];
} {
  const components: PISParameterResult[] = [];
  const missingParameters: PISParameter[] = [];
  const availableParameters: PISParameter[] = [];

  for (const [
    parameter,
    originalWeight,
  ] of Object.entries(configuration.parameters)) {
    if (!isPISParameter(parameter)) {
      continue;
    }

    const score = calculateParameterScore(
      parameter,
      input
    );

    if (score === null) {
      missingParameters.push(parameter);

      components.push({
        parameter,
        score: 0,
        originalWeight,
        effectiveWeight: 0,
        contribution: 0,
        status: "missing",
      });

      continue;
    }

    availableParameters.push(parameter);

    components.push({
      parameter,
      score: clampScore(score),
      originalWeight,
      effectiveWeight: 0,
      contribution: 0,
      status: "calculated",
    });
  }

  return {
    components,
    missingParameters,
    availableParameters,
  };
}

function applyEffectiveWeights(
  components: PISParameterResult[]
): {
  components: PISParameterResult[];
  effectiveWeightTotal: number;
} {
  const availableWeightTotal =
    components
      .filter(
        (component) =>
          component.status === "calculated"
      )
      .reduce(
        (total, component) =>
          total + component.originalWeight,
        0
      );

  if (availableWeightTotal <= 0) {
    return {
      components: components.map((component) => ({
        ...component,
        effectiveWeight: 0,
        contribution: 0,
      })),
      effectiveWeightTotal: 0,
    };
  }

  const updatedComponents = components.map(
    (component) => {
      if (component.status === "missing") {
        return {
          ...component,
          effectiveWeight: 0,
          contribution: 0,
        };
      }

      const effectiveWeight =
        (component.originalWeight /
          availableWeightTotal) *
        100;

      const contribution =
        (component.score * effectiveWeight) / 100;

      return {
        ...component,
        effectiveWeight,
        contribution,
      };
    }
  );

  const effectiveWeightTotal =
    updatedComponents.reduce(
      (total, component) =>
        total + component.effectiveWeight,
      0
    );

  return {
    components: updatedComponents,
    effectiveWeightTotal,
  };
}

export function calculatePIS(
  input: PISInput
): PISResult {
  const configuration = input.configuration;

  const configurationError =
    validateConfiguration(configuration);

  const calculatedAt = Date.now();

  if (configurationError) {
    return {
      studentId: input.candidate.profile.userId,
      jobId: input.job.requirements.jobId,
      score: 0,
      components: [],
      originalWeightTotal: 0,
      effectiveWeightTotal: 0,
      missingParameters: [],
      status: "invalid_configuration",
      calculatedAt,
    };
  }

  const originalWeightTotal =
    Object.values(
      configuration.parameters
    ).reduce(
      (total, weight) => total + weight,
      0
    );

  const {
    components: initialComponents,
    missingParameters,
  } = buildParameterResults(
    input,
    configuration
  );

  const {
    components,
    effectiveWeightTotal,
  } = applyEffectiveWeights(
    initialComponents
  );

  if (effectiveWeightTotal === 0) {
    return {
      studentId: input.candidate.profile.userId,
      jobId: input.job.requirements.jobId,
      score: 0,
      components,
      originalWeightTotal,
      effectiveWeightTotal,
      missingParameters,
      status: "no_applicable_parameters",
      calculatedAt,
    };
  }

  const score = roundScore(
    clampScore(
      components.reduce(
        (total, component) =>
          total + component.contribution,
        0
      )
    )
  );

  return {
    studentId: input.candidate.profile.userId,
    jobId: input.job.requirements.jobId,
    score,
    components: components.map((component) => ({
      ...component,
      score: roundScore(component.score),
      effectiveWeight: roundScore(
        component.effectiveWeight
      ),
      contribution: roundScore(
        component.contribution
      ),
    })),
    originalWeightTotal: roundScore(
      originalWeightTotal
    ),
    effectiveWeightTotal: roundScore(
      effectiveWeightTotal
    ),
    missingParameters,
    status: "calculated",
    calculatedAt,
  };
}
