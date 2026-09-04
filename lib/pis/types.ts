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

export type PISParameter =
  | "academicPerformance"
  | "attendance"
  | "backlogs"
  | "graduationYear"
  | "technicalSkills"
  | "domainSkills"
  | "projects"
  | "internships"
  | "certifications"
  | "achievements"
  | "evidenceQuality"
  | "preferredQualifications";

export interface PISInput {
  candidate: {
    profile: StudentProfile;
    skills: Skill[];
    projects: Project[];
    internships: Internship[];
    certifications: Certification[];
    achievements: Achievement[];
    evidence: Evidence[];
  };

  job: {
    requirements: JobRequirements;
  };

  configuration: PISConfiguration;
}

export type PISParameterStatus =
  | "calculated"
  | "missing";

export interface PISParameterResult {
  parameter: PISParameter;
  score: number;
  originalWeight: number;
  effectiveWeight: number;
  contribution: number;
  status: PISParameterStatus;
}

export type PISResultStatus =
  | "calculated"
  | "no_applicable_parameters"
  | "invalid_configuration";

export interface PISResult {
  studentId: string;
  jobId: string;
  score: number;
  components: PISParameterResult[];
  originalWeightTotal: number;
  effectiveWeightTotal: number;
  missingParameters: PISParameter[];
  status: PISResultStatus;
  calculatedAt: number;
}