export type JobData = {
  jobTitle: string;
  companyName: string;
  location: string;
  jobType: string;
  description: string;
};

export type Requirement = {
  id: number;
  category: string;
  name: string;
  value: string;
  mandatory: boolean;
};

export type EligibilityData = {
  minCGPA: number;
  maxBacklogs: number;
  degreeRequired: boolean;
  branchRequired: boolean;
  internshipRequired: boolean;
};

export type PISParameter = {
  id: number;
  name: string;
  description: string;
  weight: number;
  enabled: boolean;
};

export type RecruitmentData = {
  job: JobData;
  requirements: Requirement[];
  eligibility: EligibilityData;
  pisParameters: PISParameter[];
};

export const defaultRecruitmentData: RecruitmentData = {
  job: {
    jobTitle: "Frontend Developer",
    companyName: "PlaceKaro Demo Company",
    location: "Noida",
    jobType: "Full Time",
    description:
      "We are looking for a frontend developer with strong web development skills.",
  },

  requirements: [
    {
      id: 1,
      category: "Education",
      name: "Degree",
      value: "B.Tech / B.E.",
      mandatory: true,
    },
    {
      id: 2,
      category: "Academic",
      name: "Minimum CGPA",
      value: "7.0",
      mandatory: true,
    },
    {
      id: 3,
      category: "Skills",
      name: "Programming",
      value: "JavaScript, TypeScript, React",
      mandatory: true,
    },
    {
      id: 4,
      category: "Skills",
      name: "Database",
      value: "SQL",
      mandatory: false,
    },
    {
      id: 5,
      category: "Experience",
      name: "Experience",
      value: "0–2 years",
      mandatory: false,
    },
  ],

  eligibility: {
    minCGPA: 7.0,
    maxBacklogs: 0,
    degreeRequired: true,
    branchRequired: false,
    internshipRequired: false,
  },

  pisParameters: [
    {
      id: 1,
      name: "Academic Performance",
      description: "Overall academic performance and GPA.",
      weight: 25,
      enabled: true,
    },
    {
      id: 2,
      name: "Technical Skills",
      description: "Match between candidate skills and job requirements.",
      weight: 30,
      enabled: true,
    },
    {
      id: 3,
      name: "Internships",
      description: "Relevant internship experience.",
      weight: 20,
      enabled: true,
    },
    {
      id: 4,
      name: "Projects",
      description: "Relevant academic or personal projects.",
      weight: 15,
      enabled: true,
    },
    {
      id: 5,
      name: "Certifications",
      description: "Relevant professional certifications.",
      weight: 10,
      enabled: true,
    },
  ],
};

const STORAGE_KEY = "placekaro-recruitment-data";

export function saveRecruitmentData(data: RecruitmentData) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

export function getRecruitmentData(): RecruitmentData {
  if (typeof window === "undefined") {
    return defaultRecruitmentData;
  }

  const savedData = localStorage.getItem(STORAGE_KEY);

  if (!savedData) {
    return defaultRecruitmentData;
  }

  try {
    return JSON.parse(savedData) as RecruitmentData;
  } catch {
    return defaultRecruitmentData;
  }
}

export function clearRecruitmentData() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}