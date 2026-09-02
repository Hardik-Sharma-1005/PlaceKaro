const ALIAS_MAP: Record<string, string> = {
  cse: "computer science engineering",
  dsa: "data structures and algorithms",
  js: "javascript",
  ts: "typescript",
  ml: "machine learning",
  dbms: "database management systems",
};

const DOMAIN_ROLE_MAP: Record<string, string[]> = {
  "software development": [
    "software development",
    "software engineering",
    "full stack development",
    "full stack developer",
    "backend development",
    "backend developer",
    "frontend development",
    "frontend developer",
  ],
  "web development": [
    "web development",
    "web developer",
    "frontend development",
    "frontend developer",
    "backend development",
    "backend developer",
    "full stack development",
    "full stack developer",
  ],
  "data engineering": [
    "data engineering",
    "data engineer",
    "data pipeline",
  ],
  "data science": [
    "data science",
    "data scientist",
    "data analytics",
  ],
  "data analytics": [
    "data analytics",
    "data analyst",
    "business analytics",
  ],
  "artificial intelligence": [
    "artificial intelligence",
    "ai",
    "ai engineering",
    "ai engineer",
  ],
  "machine learning": [
    "machine learning",
    "ml",
    "ml engineering",
    "ml engineer",
  ],
  cybersecurity: [
    "cybersecurity",
    "cyber security",
    "security engineering",
    "security engineer",
  ],
  "cloud computing": [
    "cloud computing",
    "cloud engineering",
    "cloud engineer",
    "cloud development",
  ],
  "mobile development": [
    "mobile development",
    "android development",
    "android developer",
    "ios development",
    "ios developer",
    "mobile developer",
  ],
};

function normalizeSpacing(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeText(value: string): string {
  return normalizeSpacing(
    value
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[_\-\\/]+/g, " ")
      .replace(/[()[\]{},.:;!?'"`]+/g, " ")
  );
}

export function canonicalize(value: string): string {
  const normalized = normalizeText(value);

  if (!normalized) {
    return "";
  }

  return normalizeText(ALIAS_MAP[normalized] ?? normalized);
}

function containsCanonicalPhrase(
  candidateCanonical: string,
  requiredCanonical: string
): boolean {
  if (!candidateCanonical || !requiredCanonical) {
    return false;
  }

  if (candidateCanonical === requiredCanonical) {
    return true;
  }

  const candidateWords = candidateCanonical.split(" ");
  const requiredWords = requiredCanonical.split(" ");

  if (requiredWords.length > candidateWords.length) {
    return false;
  }

  for (
    let start = 0;
    start <= candidateWords.length - requiredWords.length;
    start += 1
  ) {
    let matches = true;

    for (let index = 0; index < requiredWords.length; index += 1) {
      if (
        candidateWords[start + index] !==
        requiredWords[index]
      ) {
        matches = false;
        break;
      }
    }

    if (matches) {
      return true;
    }
  }

  return false;
}

export function matchesCanonical(
  candidate: string,
  required: string
): boolean {
  const candidateCanonical = canonicalize(candidate);
  const requiredCanonical = canonicalize(required);

  if (!candidateCanonical || !requiredCanonical) {
    return false;
  }

  return containsCanonicalPhrase(
    candidateCanonical,
    requiredCanonical
  );
}

export function uniqueCanonicalValues(
  values: string[]
): string[] {
  return Array.from(
    new Set(
      values
        .map(canonicalize)
        .filter((value) => value.length > 0)
    )
  );
}

export function matchesDomainTerm(
  candidateText: string,
  requiredDomain: string
): boolean {
  const requiredCanonical = canonicalize(requiredDomain);

  if (!requiredCanonical) {
    return false;
  }

  const acceptedTerms = DOMAIN_ROLE_MAP[requiredCanonical];

  if (!acceptedTerms) {
    return matchesCanonical(
      candidateText,
      requiredCanonical
    );
  }

  return acceptedTerms.some((acceptedTerm) =>
    matchesCanonical(candidateText, acceptedTerm)
  );
}

export function matchesDomainInText(
  texts: string[],
  requiredDomain: string
): boolean {
  return texts.some((text) =>
    matchesDomainTerm(text, requiredDomain)
  );
}

export function getCanonicalAliasMap(): Readonly<
  Record<string, string>
> {
  return ALIAS_MAP;
}

export function getDomainRoleMap(): Readonly<
  Record<string, string[]>
> {
  return DOMAIN_ROLE_MAP;
}