import { Application } from "../../types/database";
import {
  createData,
  getDataByChild,
  setData,
} from "../realtime/database";

export const applicationService = {
  /**
   * Fetches a student's application for a specific job.
   */
  async getApplication(
    studentId: string,
    jobId: string
  ): Promise<Application | null> {
    try {
      const applications = await getDataByChild<Application>(
        "applications",
        "studentId",
        studentId
      );

      return (
        applications.find(
          (application) => application.jobId === jobId
        ) ?? null
      );
    } catch (error) {
      console.error("Error fetching application:", error);
      throw error;
    }
  },

  /**
   * Creates an application for a student.
   *
   * Assessment unlocking is intentionally left false here.
   * Assessment access should be controlled by the established
   * assessment workflow rather than by the application itself.
   */
  async applyToJob(
    studentId: string,
    jobId: string
  ): Promise<string> {
    try {
      const existing = await this.getApplication(studentId, jobId);

      if (existing) {
        return existing.id;
      }

      const application: Omit<Application, "id"> = {
        studentId,
        jobId,
        status: "applied",
        appliedAt: Date.now(),
        assessmentUnlocked: false,
      };

      return await createData("applications", application);
    } catch (error) {
      console.error("Error applying to job:", error);
      throw error;
    }
  },

  /**
   * Fetches all applications for a student.
   */
  async getApplicationsForStudent(
    studentId: string
  ): Promise<Application[]> {
    try {
      return await getDataByChild<Application>(
        "applications",
        "studentId",
        studentId
      );
    } catch (error) {
      console.error(
        "Error fetching applications for student:",
        error
      );
      throw error;
    }
  },

  /**
   * Fetches all applications for a job.
   */
  async getApplicationsForJob(
    jobId: string
  ): Promise<Application[]> {
    try {
      return await getDataByChild<Application>(
        "applications",
        "jobId",
        jobId
      );
    } catch (error) {
      console.error(
        "Error fetching applications for job:",
        error
      );
      throw error;
    }
  },

  /**
   * Updates the status of an application.
   */
  async updateApplicationStatus(
    applicationId: string,
    status: Application["status"]
  ): Promise<void> {
    try {
      await setData(
        `applications/${applicationId}/status`,
        status
      );
    } catch (error) {
      console.error(
        "Error updating application status:",
        error
      );
      throw error;
    }
  },
};