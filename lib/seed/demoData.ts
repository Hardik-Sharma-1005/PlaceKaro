import type {
  Achievement,
  Application,
  Assessment,
  AssessmentQuestion,
  AssessmentResult,
  Bookmark,
  Certification,
  Company,
  CompanyRecruiter,
  Evidence,
  Internship,
  Job,
  JobRequirements,
  Notification,
  PISComponents,
  PISScore,
  Project,
  Skill,
  StudentProfile,
  User,
} from "../../types/database";

const DEMO_TIMESTAMP = 1760000000000;

export const demoUsers: User[] = [
  {
    uid: "demo-student-001",
    email: "demo.student1@placekaro.dev",
    role: "student",
    displayName: "Aarav Mehta",
    isActive: true,
    createdAt: DEMO_TIMESTAMP,
    updatedAt: DEMO_TIMESTAMP,
  },
  {
    uid: "demo-student-002",
    email: "demo.student2@placekaro.dev",
    role: "student",
    displayName: "Priya Sharma",
    isActive: true,
    createdAt: DEMO_TIMESTAMP,
    updatedAt: DEMO_TIMESTAMP,
  },
  {
    uid: "demo-student-003",
    email: "demo.student3@placekaro.dev",
    role: "student",
    displayName: "Rohan Verma",
    isActive: true,
    createdAt: DEMO_TIMESTAMP,
    updatedAt: DEMO_TIMESTAMP,
  },
  {
    uid: "demo-company-001",
    email: "recruiter@techcorp.dev",
    role: "company",
    displayName: "Neha Kapoor",
    isActive: true,
    createdAt: DEMO_TIMESTAMP,
    updatedAt: DEMO_TIMESTAMP,
  },
  {
    uid: "demo-placement-001",
    email: "placement@placekaro.dev",
    role: "placement",
    displayName: "Placement Cell",
    isActive: true,
    createdAt: DEMO_TIMESTAMP,
    updatedAt: DEMO_TIMESTAMP,
  },
];

export const demoStudentProfiles: StudentProfile[] = [
  {
    userId: "demo-student-001",
    fullName: "Aarav Mehta",
    university: "JSS University Noida",
    degree: "B.Tech",
    branch: "Computer Science Engineering",
    graduationYear: 2029,
    cgpa: 8.7,
    attendance: 91,
    backlogCount: 0,
    profileCompletion: 94,
    createdAt: DEMO_TIMESTAMP,
    updatedAt: DEMO_TIMESTAMP,
  },
  {
    userId: "demo-student-002",
    fullName: "Priya Sharma",
    university: "JSS University Noida",
    degree: "B.Tech",
    branch: "Computer Science Engineering",
    graduationYear: 2029,
    cgpa: 9.1,
    attendance: 95,
    backlogCount: 0,
    profileCompletion: 97,
    createdAt: DEMO_TIMESTAMP,
    updatedAt: DEMO_TIMESTAMP,
  },
  {
    userId: "demo-student-003",
    fullName: "Rohan Verma",
    university: "JSS University Noida",
    degree: "B.Tech",
    branch: "Information Technology",
    graduationYear: 2029,
    cgpa: 7.9,
    attendance: 86,
    backlogCount: 1,
    profileCompletion: 82,
    createdAt: DEMO_TIMESTAMP,
    updatedAt: DEMO_TIMESTAMP,
  },
];

export const demoSkills: Skill[] = [
  {
    id: "skill-001",
    studentId: "demo-student-001",
    name: "Python",
    category: "Programming",
    level: "Advanced",
  },
  {
    id: "skill-002",
    studentId: "demo-student-001",
    name: "Data Structures and Algorithms",
    category: "Computer Science",
    level: "Intermediate",
  },
  {
    id: "skill-003",
    studentId: "demo-student-001",
    name: "React",
    category: "Web Development",
    level: "Intermediate",
  },
  {
    id: "skill-004",
    studentId: "demo-student-002",
    name: "Python",
    category: "Programming",
    level: "Advanced",
  },
  {
    id: "skill-005",
    studentId: "demo-student-002",
    name: "Machine Learning",
    category: "AI",
    level: "Advanced",
  },
  {
    id: "skill-006",
    studentId: "demo-student-002",
    name: "SQL",
    category: "Data",
    level: "Intermediate",
  },
  {
    id: "skill-007",
    studentId: "demo-student-003",
    name: "Java",
    category: "Programming",
    level: "Intermediate",
  },
  {
    id: "skill-008",
    studentId: "demo-student-003",
    name: "SQL",
    category: "Data",
    level: "Intermediate",
  },
];

export const demoProjects: Project[] = [
  {
    id: "project-001",
    studentId: "demo-student-001",
    title: "Campus Placement Analyzer",
    description:
      "A web application that analyzes student employability data and highlights placement readiness.",
    technologies: ["Python", "React", "Firebase"],
    role: "Full Stack Developer",
  },
  {
    id: "project-002",
    studentId: "demo-student-002",
    title: "Student Performance Predictor",
    description:
      "A machine learning model that predicts student performance using academic indicators.",
    technologies: ["Python", "Pandas", "Scikit-learn"],
    role: "Machine Learning Developer",
  },
  {
    id: "project-003",
    studentId: "demo-student-003",
    title: "Inventory Management System",
    description:
      "A database-backed application for managing inventory, orders, and stock levels.",
    technologies: ["Java", "SQL"],
    role: "Backend Developer",
  },
];

export const demoInternships: Internship[] = [
  {
    id: "internship-001",
    studentId: "demo-student-001",
    organization: "TechNova Labs",
    role: "Software Engineering Intern",
    description:
      "Worked on internal web tools and contributed to backend APIs.",
  },
  {
    id: "internship-002",
    studentId: "demo-student-002",
    organization: "DataSphere AI",
    role: "Machine Learning Intern",
    description:
      "Worked on data preparation and baseline machine learning models.",
  },
];

export const demoCertifications: Certification[] = [
  {
    id: "cert-001",
    studentId: "demo-student-001",
    title: "Python Programming Fundamentals",
    issuer: "Coursera",
    issueDate: "2026-05-15",
  },
  {
    id: "cert-002",
    studentId: "demo-student-002",
    title: "Machine Learning Foundations",
    issuer: "Google",
    issueDate: "2026-06-20",
  },
];

export const demoAchievements: Achievement[] = [
  {
    id: "achievement-001",
    studentId: "demo-student-001",
    title: "Hackathon Finalist",
    organization: "University Innovation Challenge",
    date: "2026-04-10",
    category: "Hackathon",
  },
  {
    id: "achievement-002",
    studentId: "demo-student-002",
    title: "Top 10 Project Presentation",
    organization: "JSS University Noida",
    date: "2026-03-18",
    category: "Academic",
  },
];

export const demoEvidence: Evidence[] = [
  {
    id: "evidence-001",
    studentId: "demo-student-001",
    type: "certificate",
    title: "Python Programming Fundamentals Certificate",
    uploadedAt: DEMO_TIMESTAMP,
    verificationStatus: "verified",
    verifiedAt: DEMO_TIMESTAMP,
  },
  {
    id: "evidence-002",
    studentId: "demo-student-001",
    type: "project",
    title: "Campus Placement Analyzer Evidence",
    uploadedAt: DEMO_TIMESTAMP,
    verificationStatus: "verified",
    verifiedAt: DEMO_TIMESTAMP,
  },
  {
    id: "evidence-003",
    studentId: "demo-student-002",
    type: "certificate",
    title: "Machine Learning Foundations Certificate",
    uploadedAt: DEMO_TIMESTAMP,
    verificationStatus: "verified",
    verifiedAt: DEMO_TIMESTAMP,
  },
];

export const demoCompanies: Company[] = [
  {
    id: "company-001",
    name: "TechCorp Solutions",
    website: "https://example.com",
    emailDomain: "techcorp.dev",
    registrationInfo: "Demo verified company",
    verificationStatus: "approved",
    universityApproval: true,
    createdAt: DEMO_TIMESTAMP,
  },
];

export const demoCompanyRecruiters: CompanyRecruiter[] = [
  {
    id: "recruiter-001",
    userId: "demo-company-001",
    companyId: "company-001",
    name: "Neha Kapoor",
    designation: "Talent Acquisition Manager",
    officialEmail: "recruiter@techcorp.dev",
    verificationStatus: "approved",
  },
];

export const demoJobs: Job[] = [
  {
    id: "job-001",
    companyId: "company-001",
    recruiterId: "recruiter-001",
    title: "Software Engineer Intern",
    description:
      "Looking for students with strong programming fundamentals, Python, problem solving and relevant project experience.",
    status: "published",
    assessmentId: "assessment-001",
    assessmentAccessModel: "role_fit",
    shortlistType: "top_n",
    shortlistValue: 5,
    createdAt: DEMO_TIMESTAMP,
    updatedAt: DEMO_TIMESTAMP,
  },
];

export const demoJobRequirements: JobRequirements[] = [
  {
    jobId: "job-001",
    hardEligibility: {
      branches: [
        "Computer Science Engineering",
        "Information Technology",
      ],
      graduationYears: [2029],
      minimumCGPA: 7.5,
      maximumBacklogs: 1,
    },
    competencies: {
      technicalSkills: ["Python", "Data Structures and Algorithms"],
      domainSkills: ["Software Development"],
      preferredQualifications: ["Relevant projects", "Internship experience"],
    },
    confirmedByCompany: true,
  },
];

export const demoPISScores: PISScore[] = [
  {
    id: "pis-001",
    studentId: "demo-student-001",
    jobId: "job-001",
    score: 91,
    calculatedAt: DEMO_TIMESTAMP,
  },
  {
    id: "pis-002",
    studentId: "demo-student-002",
    jobId: "job-001",
    score: 94,
    calculatedAt: DEMO_TIMESTAMP,
  },
  {
    id: "pis-003",
    studentId: "demo-student-003",
    jobId: "job-001",
    score: 73,
    calculatedAt: DEMO_TIMESTAMP,
  },
];

export const demoPISComponents: PISComponents[] = [
  {
    pisId: "pis-001",
    academic: {
      score: 90,
      weight: 25,
    },
    technicalSkills: {
      score: 94,
      weight: 35,
    },
    projects: {
      score: 88,
      weight: 20,
    },
    experience: {
      score: 92,
      weight: 20,
    },
  },
  {
    pisId: "pis-002",
    academic: {
      score: 96,
      weight: 25,
    },
    technicalSkills: {
      score: 96,
      weight: 35,
    },
    projects: {
      score: 92,
      weight: 20,
    },
    experience: {
      score: 90,
      weight: 20,
    },
  },
  {
    pisId: "pis-003",
    academic: {
      score: 78,
      weight: 25,
    },
    technicalSkills: {
      score: 72,
      weight: 35,
    },
    projects: {
      score: 70,
      weight: 20,
    },
    experience: {
      score: 72,
      weight: 20,
    },
  },
];

export const demoAssessments: Assessment[] = [
  {
    id: "assessment-001",
    jobId: "job-001",
    title: "Software Engineering Fundamentals",
    durationMinutes: 30,
    totalMarks: 20,
    published: true,
    createdAt: DEMO_TIMESTAMP,
  },
];

export const demoAssessmentQuestions: AssessmentQuestion[] = [
  {
    id: "question-001",
    assessmentId: "assessment-001",
    question: "Which data structure follows the FIFO principle?",
    type: "mcq",
    options: {
      A: "Stack",
      B: "Queue",
      C: "Tree",
      D: "Graph",
    },
    correctAnswer: "B",
    marks: 5,
  },
  {
    id: "question-002",
    assessmentId: "assessment-001",
    question: "Which Python data type stores key-value pairs?",
    type: "mcq",
    options: {
      A: "List",
      B: "Tuple",
      C: "Dictionary",
      D: "Set",
    },
    correctAnswer: "C",
    marks: 5,
  },
  {
    id: "question-003",
    assessmentId: "assessment-001",
    question: "What is the average time complexity of binary search?",
    type: "mcq",
    options: {
      A: "O(n)",
      B: "O(log n)",
      C: "O(n log n)",
      D: "O(1)",
    },
    correctAnswer: "B",
    marks: 5,
  },
  {
    id: "question-004",
    assessmentId: "assessment-001",
    question: "Which technology is commonly used to create user interfaces in the browser?",
    type: "mcq",
    options: {
      A: "React",
      B: "MySQL",
      C: "Python",
      D: "Firebase Realtime Database",
    },
    correctAnswer: "A",
    marks: 5,
  },
];

export const demoApplications: Application[] = [
  {
    id: "application-001",
    studentId: "demo-student-001",
    jobId: "job-001",
    status: "applied",
    appliedAt: DEMO_TIMESTAMP,
    assessmentUnlocked: true,
  },
  {
    id: "application-002",
    studentId: "demo-student-002",
    jobId: "job-001",
    status: "invited",
    assessmentUnlocked: false,
  },
];

export const demoAssessmentResults: AssessmentResult[] = [
  {
    id: "result-001",
    assessmentId: "assessment-001",
    jobId: "job-001",
    studentId: "demo-student-001",
    score: 17,
    totalMarks: 20,
    percentage: 85,
    status: "qualified",
    submittedAt: DEMO_TIMESTAMP,
  },
];

export const demoBookmarks: Bookmark[] = [
  {
    id: "bookmark-001",
    companyId: "company-001",
    recruiterId: "recruiter-001",
    studentId: "demo-student-001",
    createdAt: DEMO_TIMESTAMP,
  },
];

export const demoNotifications: Notification[] = [
  {
    id: "notification-001",
    userId: "demo-student-001",
    type: "assessment_invitation",
    title: "Assessment Available",
    message:
      "Your assessment for Software Engineer Intern is now available.",
    relatedJobId: "job-001",
    isRead: false,
    createdAt: DEMO_TIMESTAMP,
  },
  {
    id: "notification-002",
    userId: "demo-student-002",
    type: "new_opportunity",
    title: "New Opportunity",
    message:
      "You have been invited to apply for Software Engineer Intern.",
    relatedJobId: "job-001",
    isRead: false,
    createdAt: DEMO_TIMESTAMP,
  },
];