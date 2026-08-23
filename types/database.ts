// types/database.ts

export type UserRole = "student" | "company" | "placement";

export type VerificationStatus =
  | "pending"
  | "unverified"
  | "verified"
  | "approved"
  | "rejected";

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  photoURL?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface StudentProfile {
  userId: string;
  fullName: string;
  university: string;
  degree: string;
  branch: string;
  graduationYear: number;
  cgpa: number;
  attendance: number;
  backlogCount: number;
  profileCompletion: number;
  createdAt: number;
  updatedAt: number;
}

export interface Skill {
  id: string;
  studentId: string;
  name: string;
  category: string;
  level: string;
  evidenceIds?: string[];
}

export interface Project {
  id: string;
  studentId: string;
  title: string;
  description: string;
  technologies: string[];
  role: string;
  startDate?: string;
  endDate?: string;
  evidenceIds?: string[];
}

export interface Internship {
  id: string;
  studentId: string;
  organization: string;
  role: string;
  startDate?: string;
  endDate?: string;
  description: string;
  evidenceIds?: string[];
}

export interface Certification {
  id: string;
  studentId: string;
  title: string;
  issuer: string;
  issueDate?: string;
  credentialId?: string;
  evidenceId?: string;
}

export interface Achievement {
  id: string;
  studentId: string;
  title: string;
  organization: string;
  date?: string;
  category: string;
  evidenceId?: string;
}

export interface Evidence {
  id: string;
  studentId: string;
  type: string;
  title: string;
  fileUrl?: string;
  uploadedAt: number;
  verificationStatus: VerificationStatus;
  verifiedAt?: number;
}

export interface Company {
  id: string;
  name: string;
  website?: string;
  emailDomain?: string;
  registrationInfo?: string;
  verificationStatus: VerificationStatus;
  universityApproval: boolean;
  createdAt: number;
}

export interface CompanyRecruiter {
  id: string;
  userId: string;
  companyId: string;
  name: string;
  designation: string;
  officialEmail: string;
  verificationStatus: VerificationStatus;
}

export type JobStatus = "draft" | "published" | "closed";

export type AssessmentAccessModel =
  | "all_eligible"
  | "role_fit"
  | "custom";

export type ShortlistType = "cutoff" | "top_n";

export interface Job {
  id: string;
  companyId: string;
  recruiterId: string;
  title: string;
  description: string;
  status: JobStatus;
  assessmentId?: string;
  assessmentAccessModel: AssessmentAccessModel;
  shortlistType?: ShortlistType;
  shortlistValue?: number;
  createdAt: number;
  updatedAt: number;
}

export interface JobRequirements {
  jobId: string;
  hardEligibility: {
    branches?: string[];
    graduationYears?: number[];
    minimumCGPA?: number | null;
    maximumBacklogs?: number | null;
  };
  competencies: {
    technicalSkills?: string[];
    domainSkills?: string[];
    preferredQualifications?: string[];
  };
  confirmedByCompany: boolean;
}

export interface PISScore {
  id: string;
  studentId: string;
  jobId: string;
  score: number;
  calculatedAt: number;
}

export interface PISComponent {
  score: number;
  weight: number;
}

export interface PISComponents {
  pisId: string;
  [factorName: string]: PISComponent | string;
}

export interface Assessment {
  id: string;
  jobId: string;
  title: string;
  durationMinutes: number;
  totalMarks: number;
  published: boolean;
  createdAt: number;
}

export type QuestionType = "mcq";

export interface AssessmentQuestion {
  id: string;
  assessmentId: string;
  question: string;
  type: QuestionType;
  options: Record<string, string>;
  correctAnswer: string;
  marks: number;
}

export type ApplicationStatus =
  | "invited"
  | "applied"
  | "withdrawn";

export interface Application {
  id: string;
  studentId: string;
  jobId: string;
  status: ApplicationStatus;
  appliedAt?: number;
  assessmentUnlocked: boolean;
}

export type AssessmentResultStatus = "qualified" | "not_qualified";

export interface AssessmentResult {
  id: string;
  assessmentId: string;
  jobId: string;
  studentId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  status: AssessmentResultStatus;
  submittedAt: number;
}

export interface Bookmark {
  id: string;
  companyId: string;
  recruiterId: string;
  studentId: string;
  createdAt: number;
}

export type NotificationType =
  | "assessment_invitation"
  | "application_update"
  | "new_opportunity"
  | "system";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedJobId?: string;
  isRead: boolean;
  createdAt: number;
}