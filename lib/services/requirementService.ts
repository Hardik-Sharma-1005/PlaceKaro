import {
  normalizeText,
  getDomainRoleMap,
} from "../pis/matching";

export type RequirementCategory =
  | "technical_skill"
  | "domain_skill"
  | "preferred_qualification";

export interface ExtractedRequirement {
  id: string;
  name: string;
  category: RequirementCategory;
  mandatory: boolean;
  detectedSnippet?: string;
}

export interface ProvisionalEligibility {
  minimumCGPA?: number;
  maximumBacklogs?: number;
  branches?: string[];
  graduationYears?: number[];
}

export interface JDExtractionResult {
  requirements: ExtractedRequirement[];
  provisionalEligibility: ProvisionalEligibility;
}

// Canonical Technical Skills dictionary aligned with platform demo data & industry standards
const KNOWN_TECHNICAL_SKILLS: Array<{
  name: string;
  patterns: string[];
}> = [
  { name: "Python", patterns: ["python", "py"] },
  { name: "JavaScript", patterns: ["javascript", "js", "es6"] },
  { name: "TypeScript", patterns: ["typescript", "ts"] },
  { name: "React", patterns: ["react", "react.js", "reactjs"] },
  { name: "Next.js", patterns: ["next.js", "nextjs", "next"] },
  { name: "Node.js", patterns: ["node.js", "nodejs", "node"] },
  { name: "Express", patterns: ["express", "express.js", "expressjs"] },
  { name: "Java", patterns: ["java"] },
  { name: "C++", patterns: ["c++", "cpp"] },
  { name: "C", patterns: ["c programming", "c language"] },
  { name: "C#", patterns: ["c#", "csharp"] },
  { name: "SQL", patterns: ["sql", "rdbms"] },
  { name: "PostgreSQL", patterns: ["postgresql", "postgres"] },
  { name: "MySQL", patterns: ["mysql"] },
  { name: "MongoDB", patterns: ["mongodb", "mongo"] },
  { name: "Redis", patterns: ["redis"] },
  { name: "Firebase", patterns: ["firebase", "firestore"] },
  { name: "Data Structures and Algorithms", patterns: ["data structures and algorithms", "dsa", "data structures", "algorithms"] },
  { name: "HTML/CSS", patterns: ["html", "css", "html5", "css3"] },
  { name: "Tailwind CSS", patterns: ["tailwind", "tailwindcss"] },
  { name: "Git", patterns: ["git", "github", "gitlab"] },
  { name: "Docker", patterns: ["docker", "containerization"] },
  { name: "Kubernetes", patterns: ["kubernetes", "k8s"] },
  { name: "AWS", patterns: ["aws", "amazon web services"] },
  { name: "GCP", patterns: ["gcp", "google cloud platform", "google cloud"] },
  { name: "Azure", patterns: ["azure", "microsoft azure"] },
  { name: "Linux", patterns: ["linux", "unix"] },
  { name: "REST API", patterns: ["rest api", "restful api", "rest apis"] },
  { name: "GraphQL", patterns: ["graphql"] },
  { name: "Scrum", patterns: ["scrum", "agile"] },
  { name: "SDLC", patterns: ["sdlc", "software development lifecycle"] },
  { name: "Tableau", patterns: ["tableau"] },
  { name: "Power BI", patterns: ["power bi", "powerbi"] },
];

// Canonical Domain Skills derived from DOMAIN_ROLE_MAP in lib/pis/matching.ts
const CANONICAL_DOMAINS: Array<{
  name: string;
  canonicalKey: string;
}> = [
  { name: "Software Development", canonicalKey: "software development" },
  { name: "Web Development", canonicalKey: "web development" },
  { name: "Data Engineering", canonicalKey: "data engineering" },
  { name: "Data Science", canonicalKey: "data science" },
  { name: "Data Analytics", canonicalKey: "data analytics" },
  { name: "Artificial Intelligence", canonicalKey: "artificial intelligence" },
  { name: "Machine Learning", canonicalKey: "machine learning" },
  { name: "Cybersecurity", canonicalKey: "cybersecurity" },
  { name: "Cloud Computing", canonicalKey: "cloud computing" },
  { name: "Mobile Development", canonicalKey: "mobile development" },
];

const PREFERRED_KEYWORDS = [
  "preferred",
  "plus",
  "bonus",
  "nice to have",
  "good to have",
  "advantage",
  "optional",
  "desirable",
];

function isSentencePreferred(sentence: string): boolean {
  const lower = sentence.toLowerCase();
  return PREFERRED_KEYWORDS.some((kw) => lower.includes(kw));
}

function extractTechnicalSkills(sentences: string[]): ExtractedRequirement[] {
  const found: ExtractedRequirement[] = [];
  const seenNames = new Set<string>();

  for (const sentence of sentences) {
    const normalized = normalizeText(sentence);
    const words = new Set(normalized.split(" "));

    for (const skill of KNOWN_TECHNICAL_SKILLS) {
      if (seenNames.has(skill.name)) continue;

      let matched = false;
      for (const pattern of skill.patterns) {
        if (pattern.includes(" ")) {
          if (normalized.includes(pattern)) {
            matched = true;
            break;
          }
        } else {
          if (words.has(pattern)) {
            matched = true;
            break;
          }
        }
      }

      if (matched) {
        seenNames.add(skill.name);
        const preferred = isSentencePreferred(sentence);
        found.push({
          id: `tech-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: skill.name,
          category: "technical_skill",
          mandatory: !preferred,
          detectedSnippet: sentence.trim().slice(0, 100),
        });
      }
    }
  }

  return found;
}

function matchesPhraseOrWord(text: string, phrase: string): boolean {
  if (phrase.length <= 3) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    return regex.test(text);
  }
  return text.includes(phrase);
}

function extractDomainSkills(sentences: string[]): ExtractedRequirement[] {
  const found: ExtractedRequirement[] = [];
  const seenNames = new Set<string>();
  const domainRoleMap = getDomainRoleMap();

  for (const sentence of sentences) {
    const normalized = normalizeText(sentence);

    for (const domain of CANONICAL_DOMAINS) {
      if (seenNames.has(domain.name)) continue;

      const aliases: readonly string[] =
        domainRoleMap[domain.canonicalKey] || [domain.canonicalKey];
      const matched = aliases.some((alias: string) =>
        matchesPhraseOrWord(normalized, alias)
      );

      if (matched) {
        seenNames.add(domain.name);
        const preferred = isSentencePreferred(sentence);
        found.push({
          id: `domain-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: domain.name,
          category: "domain_skill",
          mandatory: !preferred,
          detectedSnippet: sentence.trim().slice(0, 100),
        });
      }
    }
  }

  return found;
}

function extractPreferredQualifications(sentences: string[]): ExtractedRequirement[] {
  const found: ExtractedRequirement[] = [];
  const seenNames = new Set<string>();

  for (const sentence of sentences) {
    const normalized = normalizeText(sentence);

    // Project experience
    if (
      !seenNames.has("Relevant projects") &&
      (normalized.includes("relevant project") ||
        normalized.includes("project experience") ||
        normalized.includes("personal projects") ||
        normalized.includes("academic projects"))
    ) {
      seenNames.add("Relevant projects");
      found.push({
        id: `qual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: "Relevant projects",
        category: "preferred_qualification",
        mandatory: false,
        detectedSnippet: sentence.trim().slice(0, 100),
      });
    }

    // Internship experience
    if (
      !seenNames.has("Internship experience") &&
      (normalized.includes("internship") ||
        normalized.includes("intern experience") ||
        normalized.includes("prior work experience") ||
        normalized.includes("previous internship"))
    ) {
      seenNames.add("Internship experience");
      found.push({
        id: `qual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: "Internship experience",
        category: "preferred_qualification",
        mandatory: false,
        detectedSnippet: sentence.trim().slice(0, 100),
      });
    }

    // Relevant achievements
    if (
      !seenNames.has("Relevant achievements") &&
      (normalized.includes("achievement") ||
        normalized.includes("hackathon") ||
        normalized.includes("competitive programming") ||
        normalized.includes("contests") ||
        normalized.includes("awards"))
    ) {
      seenNames.add("Relevant achievements");
      found.push({
        id: `qual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: "Relevant achievements",
        category: "preferred_qualification",
        mandatory: false,
        detectedSnippet: sentence.trim().slice(0, 100),
      });
    }

    // Technical certification check: "<skill> certification"
    if (normalized.includes("certification") || normalized.includes("certified")) {
      for (const skill of KNOWN_TECHNICAL_SKILLS) {
        const certName = `${skill.name} certification`;
        if (seenNames.has(certName)) continue;

        if (skill.patterns.some((p) => normalized.includes(p))) {
          seenNames.add(certName);
          found.push({
            id: `qual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: certName,
            category: "preferred_qualification",
            mandatory: false,
            detectedSnippet: sentence.trim().slice(0, 100),
          });
        }
      }
    }
  }

  return found;
}

function extractProvisionalEligibility(fullText: string): ProvisionalEligibility {
  const result: ProvisionalEligibility = {};
  const lower = fullText.toLowerCase();

  // CGPA match: e.g. "cgpa >= 7.5", "cgpa of 7.0", "minimum 8.0 cgpa"
  const cgpaRegex = /(?:cgpa|gpa)\s*(?:>=|=>|:|of|is|\s)?\s*([0-9](?:\.[0-9]+)?)/i;
  const cgpaMatch = lower.match(cgpaRegex);
  if (cgpaMatch && cgpaMatch[1]) {
    const val = Number.parseFloat(cgpaMatch[1]);
    if (Number.isFinite(val) && val >= 0 && val <= 10) {
      result.minimumCGPA = val;
    }
  }

  // Backlogs match: e.g. "no backlogs", "0 backlogs", "zero active backlogs"
  if (
    lower.includes("no backlogs") ||
    lower.includes("no active backlogs") ||
    lower.includes("0 backlogs") ||
    lower.includes("zero backlogs")
  ) {
    result.maximumBacklogs = 0;
  } else {
    const backlogRegex = /(?:max|maximum|at most)\s*([0-9]+)\s*backlog/i;
    const backlogMatch = lower.match(backlogRegex);
    if (backlogMatch && backlogMatch[1]) {
      const bVal = Number.parseInt(backlogMatch[1], 10);
      if (Number.isInteger(bVal) && bVal >= 0) {
        result.maximumBacklogs = bVal;
      }
    }
  }

  // Branches
  const detectedBranches: string[] = [];
  if (
    lower.includes("computer science") ||
    matchesPhraseOrWord(lower, "cse") ||
    matchesPhraseOrWord(lower, "cs")
  ) {
    detectedBranches.push("Computer Science");
  }
  if (
    lower.includes("information technology") ||
    matchesPhraseOrWord(lower, "it")
  ) {
    detectedBranches.push("Information Technology");
  }
  if (
    lower.includes("electronics") ||
    matchesPhraseOrWord(lower, "ece")
  ) {
    detectedBranches.push("Electronics");
  }
  if (
    lower.includes("electrical") ||
    matchesPhraseOrWord(lower, "eee")
  ) {
    detectedBranches.push("Electrical");
  }
  if (
    lower.includes("mechanical") ||
    matchesPhraseOrWord(lower, "me")
  ) {
    detectedBranches.push("Mechanical");
  }
  if (
    lower.includes("civil") ||
    matchesPhraseOrWord(lower, "ce")
  ) {
    detectedBranches.push("Civil");
  }

  if (detectedBranches.length > 0) {
    result.branches = Array.from(new Set(detectedBranches));
  }

  // Graduation Years: 2027..2031
  const detectedYears: number[] = [];
  for (const year of [2027, 2028, 2029, 2030, 2031]) {
    if (lower.includes(year.toString())) {
      detectedYears.push(year);
    }
  }
  if (detectedYears.length > 0) {
    result.graduationYears = detectedYears;
  }

  return result;
}

/**
 * Deterministically extracts requirements and provisional eligibility criteria
 * from raw job description text.
 */
export function extractRequirementsFromJD(description: string): JDExtractionResult {
  if (!description || !description.trim()) {
    return {
      requirements: [],
      provisionalEligibility: {},
    };
  }

  // Split description into sentences / bullet points
  const rawSentences = description
    .split(/[\n\r;•\-\*\.]+|\s{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  const technicalSkills = extractTechnicalSkills(rawSentences);
  const domainSkills = extractDomainSkills(rawSentences);
  const preferredQualifications = extractPreferredQualifications(rawSentences);
  const provisionalEligibility = extractProvisionalEligibility(description);

  return {
    requirements: [
      ...technicalSkills,
      ...domainSkills,
      ...preferredQualifications,
    ],
    provisionalEligibility,
  };
}
