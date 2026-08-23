import { getAuth } from "firebase-admin/auth";

import {
  demoAchievements,
  demoAssessmentQuestions,
  demoAssessments,
  demoAssessmentResults,
  demoApplications,
  demoBookmarks,
  demoCertifications,
  demoCompanies,
  demoCompanyRecruiters,
  demoEvidence,
  demoInternships,
  demoJobRequirements,
  demoJobs,
  demoNotifications,
  demoPISComponents,
  demoPISScores,
  demoProjects,
  demoSkills,
  demoStudentProfiles,
  demoUsers,
} from "./demoData";

import { adminDatabase } from "./firebaseAdmin";

const adminAuth = getAuth();

const DEMO_PASSWORD = "PlaceKaro@2026";

async function ensureDemoAuthUser(
  uid: string,
  email: string,
  displayName: string
): Promise<void> {
  try {
    const existingUser = await adminAuth.getUser(uid);

    await adminAuth.updateUser(uid, {
      email,
      displayName,
      password: DEMO_PASSWORD,
      emailVerified: true,
    });

    console.log(`Auth user updated: ${email}`);
  } catch (error) {
    const authError = error as {
      code?: string;
    };

    if (authError.code !== "auth/user-not-found") {
      throw error;
    }

    await adminAuth.createUser({
      uid,
      email,
      displayName,
      password: DEMO_PASSWORD,
      emailVerified: true,
    });

    console.log(`Created Auth user: ${email}`);
  }
}

async function ensureDemoAuthUsers(): Promise<void> {
  for (const user of demoUsers) {
    await ensureDemoAuthUser(
      user.uid,
      user.email,
      user.displayName
    );
  }
}

export async function writeDemoData(): Promise<void> {
  await ensureDemoAuthUsers();

  const updates: Record<string, unknown> = {};

  for (const user of demoUsers) {
    updates[`users/${user.uid}`] = user;
  }

  for (const profile of demoStudentProfiles) {
    updates[`studentProfiles/${profile.userId}`] = profile;
  }

  for (const skill of demoSkills) {
    updates[`skills/${skill.id}`] = skill;
  }

  for (const project of demoProjects) {
    updates[`projects/${project.id}`] = project;
  }

  for (const internship of demoInternships) {
    updates[`internships/${internship.id}`] = internship;
  }

  for (const certification of demoCertifications) {
    updates[`certifications/${certification.id}`] = certification;
  }

  for (const achievement of demoAchievements) {
    updates[`achievements/${achievement.id}`] = achievement;
  }

  for (const evidence of demoEvidence) {
    updates[`evidence/${evidence.id}`] = evidence;
  }

  for (const company of demoCompanies) {
    updates[`companies/${company.id}`] = company;
  }

  for (const recruiter of demoCompanyRecruiters) {
    updates[`companyRecruiters/${recruiter.id}`] = recruiter;
  }

  for (const job of demoJobs) {
    updates[`jobs/${job.id}`] = job;
  }

  for (const requirements of demoJobRequirements) {
    updates[`jobRequirements/${requirements.jobId}`] = requirements;
  }

  for (const pisScore of demoPISScores) {
    updates[`pisScores/${pisScore.id}`] = pisScore;
  }

  for (const pisComponents of demoPISComponents) {
    updates[`pisComponents/${pisComponents.pisId}`] = pisComponents;
  }

  for (const assessment of demoAssessments) {
    updates[`assessments/${assessment.id}`] = assessment;
  }

  for (const question of demoAssessmentQuestions) {
    updates[`assessmentQuestions/${question.id}`] = question;
  }

  for (const application of demoApplications) {
    updates[`applications/${application.id}`] = application;
  }

  for (const result of demoAssessmentResults) {
    updates[`assessmentResults/${result.id}`] = result;
  }

  for (const bookmark of demoBookmarks) {
    updates[`bookmarks/${bookmark.id}`] = bookmark;
  }

  for (const notification of demoNotifications) {
    updates[`notifications/${notification.id}`] = notification;
  }

  await adminDatabase.ref().update(updates);

  console.log("Demo database data written successfully.");
}