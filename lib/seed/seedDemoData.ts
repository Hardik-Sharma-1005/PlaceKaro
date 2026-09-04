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
  demoPISConfigurations,
  demoPISComponents,
  demoPISScores,
  demoProjects,
  demoSkills,
  demoStudentProfiles,
  demoUsers,
} from "./demoData";

import {
  createData,
  setData,
} from "../realtime/database";

export async function seedDemoData(): Promise<void> {
  for (const user of demoUsers) {
    await setData(`users/${user.uid}`, user);
  }

  for (const profile of demoStudentProfiles) {
    await setData(
      `studentProfiles/${profile.userId}`,
      profile
    );
  }

  for (const skill of demoSkills) {
    await setData(`skills/${skill.id}`, skill);
  }

  for (const project of demoProjects) {
    await setData(`projects/${project.id}`, project);
  }

  for (const internship of demoInternships) {
    await setData(
      `internships/${internship.id}`,
      internship
    );
  }

  for (const certification of demoCertifications) {
    await setData(
      `certifications/${certification.id}`,
      certification
    );
  }

  for (const achievement of demoAchievements) {
    await setData(
      `achievements/${achievement.id}`,
      achievement
    );
  }

  for (const evidence of demoEvidence) {
    await setData(
      `evidence/${evidence.id}`,
      evidence
    );
  }

  for (const company of demoCompanies) {
    await setData(
      `companies/${company.id}`,
      company
    );
  }

  for (const recruiter of demoCompanyRecruiters) {
    await setData(
      `companyRecruiters/${recruiter.id}`,
      recruiter
    );
  }

  for (const job of demoJobs) {
    await setData(`jobs/${job.id}`, job);
  }

  for (const requirements of demoJobRequirements) {
    await setData(
      `jobRequirements/${requirements.jobId}`,
      requirements
    );
  }

  for (const configuration of demoPISConfigurations) {
    await setData(
      `pisConfigurations/${configuration.jobId}`,
      configuration
    );
  }

  for (const pisScore of demoPISScores) {
    await setData(
      `pisScores/${pisScore.id}`,
      pisScore
    );
  }

  for (const pisComponents of demoPISComponents) {
    await setData(
      `pisComponents/${pisComponents.pisId}`,
      pisComponents
    );
  }

  for (const assessment of demoAssessments) {
    await setData(
      `assessments/${assessment.id}`,
      assessment
    );
  }

  for (const question of demoAssessmentQuestions) {
    await setData(
      `assessmentQuestions/${question.id}`,
      question
    );
  }

  for (const application of demoApplications) {
    await setData(
      `applications/${application.id}`,
      application
    );
  }

  for (const result of demoAssessmentResults) {
    await setData(
      `assessmentResults/${result.id}`,
      result
    );
  }

  for (const bookmark of demoBookmarks) {
    await setData(
      `bookmarks/${bookmark.id}`,
      bookmark
    );
  }

  for (const notification of demoNotifications) {
    await setData(
      `notifications/${notification.id}`,
      notification
    );
  }
}