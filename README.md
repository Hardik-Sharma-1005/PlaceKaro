# PlaceKaro

### Placement Intelligence Platform

PlaceKaro is an AI-powered employability intelligence platform designed to help higher-education institutions build evidence-backed student employability profiles and connect students, recruiters, and placement cells through structured data.

The prototype focuses on transforming fragmented student information into a structured, verifiable employability profile.

---

## Core Concept

PlaceKaro connects three stakeholders:

- **Students** — build and maintain their employability profiles
- **Companies / Recruiters** — discover candidates, create opportunities, and evaluate applicants
- **Placement Cells** — access institutional employability intelligence

The platform is built around a simple principle:

> **Evidence-backed employability profiles are more useful than resumes alone.**

---

## Prototype Features

### Student

- Firebase authentication
- Student dashboard
- Profile completion tracking
- Academic profile management
- Skills
- Projects
- Opportunities
- Assessment availability
- Activity / notifications
- Responsive dashboard and profile UI

### Recruiter

The architecture supports:

- Candidate discovery
- Natural-language candidate search
- Job creation
- JD processing
- PIS configuration
- Assessments
- Candidate shortlisting

### Placement Cell

The architecture supports:

- Institutional employability intelligence
- Student employability visibility
- Attention areas
- Batch and branch insights

---

## Placement Intelligence Score

PlaceKaro uses a role-specific **Placement Intelligence Score (PIS)**.

PIS is:

- Role-specific
- Evidence-backed
- Deterministic in the MVP
- Calculated only after a job exists
- Separate from assessment scores

Students do not see their PIS.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.3.1 |
| Language | TypeScript |
| UI | React |
| Styling | Tailwind CSS v4 |
| Routing | Next.js App Router |
| Authentication | Firebase Authentication |
| Database | Firebase Realtime Database |
| Backend/Admin | Firebase Admin SDK |
| AI | Gemini API / Firebase AI approach |
| Development | VS Code, Turbopack, ESLint |
| Runtime | Node.js |
| Package Manager | npm |
| Deployment Target | Vercel |
| Repository | GitHub |

---

## Architecture

```text
Student / Recruiter / Placement Cell
                 │
                 ▼
          Next.js Frontend
                 │
        ┌────────┴────────┐
        ▼                 ▼
 Firebase Auth      Realtime Database
                          │
                          ▼
                 Firebase Admin SDK
                    (seed/admin)