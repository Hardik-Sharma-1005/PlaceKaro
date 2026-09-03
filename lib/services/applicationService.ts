import { ref, get, set, push, query, orderByChild, equalTo } from "firebase/database";
import { database } from "../firebase/database";
import { Application, AssessmentResult } from "../../types/database";

export const applicationService = {
  /**
   * Fetches a student's application for a specific job.
   */
  async getApplication(studentId: string, jobId: string): Promise<Application | null> {
    try {
      const q = query(ref(database, "applications"), orderByChild("studentId"), equalTo(studentId));
      const snapshot = await get(q);
      
      if (!snapshot.exists()) return null;
      
      const data = snapshot.val();
      const matchKey = Object.keys(data).find(key => data[key].jobId === jobId);
      
      if (matchKey) {
        return { ...data[matchKey], id: matchKey };
      }
      return null;
    } catch (error) {
      console.error("Error fetching application:", error);
      throw error;
    }
  },

  /**
   * Applies to a job.
   */
  async applyToJob(studentId: string, jobId: string): Promise<string> {
    try {
      // Prevent duplicate applications
      const existing = await this.getApplication(studentId, jobId);
      if (existing) return existing.id;

      const appsRef = ref(database, "applications");
      const newRef = push(appsRef);
      
      const newApp: Omit<Application, "id"> = {
        studentId,
        jobId,
        status: "applied",
        appliedAt: Date.now(),
        assessmentUnlocked: true // Auto-unlock for MVP testing
      };
      
      await set(newRef, newApp);
      return newRef.key as string;
    } catch (error) {
      console.error("Error applying to job:", error);
      throw error;
    }
  },

  /**
   * Submits an assessment result.
   */
  async submitAssessmentResult(resultData: Omit<AssessmentResult, "id" | "submittedAt">): Promise<string> {
    try {
      const resultsRef = ref(database, "assessmentResults");
      const newRef = push(resultsRef);
      
      const result: Omit<AssessmentResult, "id"> = {
        ...resultData,
        submittedAt: Date.now()
      };
      
      await set(newRef, result);
      return newRef.key as string;
    } catch (error) {
      console.error("Error submitting assessment result:", error);
      throw error;
    }
  },

  /**
   * Fetches a student's result for a specific assessment.
   */
  async getAssessmentResult(studentId: string, assessmentId: string): Promise<AssessmentResult | null> {
    try {
      const q = query(ref(database, "assessmentResults"), orderByChild("studentId"), equalTo(studentId));
      const snapshot = await get(q);
      
      if (!snapshot.exists()) return null;
      
      const data = snapshot.val();
      const matchKey = Object.keys(data).find(key => data[key].assessmentId === assessmentId);
      
      if (matchKey) {
        return { ...data[matchKey], id: matchKey };
      }
      return null;
    } catch (error) {
      console.error("Error fetching assessment result:", error);
      throw error;
    }
  },

  /**
   * Fetches all applications for a given job.
   */
  async getApplicationsForJob(jobId: string): Promise<Application[]> {
    try {
      const q = query(ref(database, "applications"), orderByChild("jobId"), equalTo(jobId));
      const snapshot = await get(q);
      
      if (!snapshot.exists()) return [];
      
      const data = snapshot.val();
      return Object.keys(data).map(key => ({ ...data[key], id: key }));
    } catch (error) {
      console.error("Error fetching applications for job:", error);
      throw error;
    }
  },

  /**
   * Fetches all applications for a given student.
   */
  async getApplicationsForStudent(studentId: string): Promise<Application[]> {
    try {
      const q = query(ref(database, "applications"), orderByChild("studentId"), equalTo(studentId));
      const snapshot = await get(q);
      
      if (!snapshot.exists()) return [];
      
      const data = snapshot.val();
      return Object.keys(data).map(key => ({ ...data[key], id: key }));
    } catch (error) {
      console.error("Error fetching applications for student:", error);
      throw error;
    }
  },

  /**
   * Updates the status of an application.
   */
  async updateApplicationStatus(applicationId: string, status: Application['status']): Promise<void> {
    try {
      const appRef = ref(database, `applications/${applicationId}/status`);
      await set(appRef, status);
    } catch (error) {
      console.error("Error updating application status:", error);
      throw error;
    }
  },

  /**
   * Fetches a student's result for a specific job (assumes 1 assessment per job).
   */
  async getAssessmentResultByStudentAndJob(studentId: string, jobId: string): Promise<AssessmentResult | null> {
    try {
      const q = query(ref(database, "assessmentResults"), orderByChild("studentId"), equalTo(studentId));
      const snapshot = await get(q);
      
      if (!snapshot.exists()) return null;
      
      const data = snapshot.val();
      const matchKey = Object.keys(data).find(key => data[key].jobId === jobId);
      
      if (matchKey) {
        return { ...data[matchKey], id: matchKey };
      }
      return null;
    } catch (error) {
      console.error("Error fetching assessment result by job:", error);
      throw error;
    }
  }
};
