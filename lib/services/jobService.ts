import { ref, get, set, push, query, orderByChild, equalTo, update } from "firebase/database";
import { database } from "../firebase/database";
import { Job, JobRequirements, JobStatus } from "../../types/database";

export const jobService = {
  /**
   * Fetches all jobs for a given company.
   */
  async getJobsByCompany(companyId: string): Promise<Job[]> {
    try {
      const jobsQuery = query(
        ref(database, "jobs"),
        orderByChild("companyId"),
        equalTo(companyId)
      );
      const snapshot = await get(jobsQuery);
      if (!snapshot.exists()) return [];
      
      const jobsData = snapshot.val();
      return Object.keys(jobsData).map(key => ({
        ...jobsData[key],
        id: key
      })).sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      throw error;
    }
  },

  /**
   * Fetches a specific job by ID.
   */
  async getJobById(jobId: string): Promise<Job | null> {
    try {
      const snapshot = await get(ref(database, `jobs/${jobId}`));
      if (!snapshot.exists()) return null;
      return { ...snapshot.val(), id: jobId };
    } catch (error) {
      console.error("Error fetching job:", error);
      throw error;
    }
  },

  /**
   * Fetches the requirements for a specific job.
   */
  async getJobRequirements(jobId: string): Promise<JobRequirements | null> {
    try {
      const snapshot = await get(ref(database, `jobRequirements/${jobId}`));
      if (!snapshot.exists()) return null;
      return snapshot.val() as JobRequirements;
    } catch (error) {
      console.error("Error fetching job requirements:", error);
      throw error;
    }
  },

  /**
   * Creates a new draft job.
   */
  async createJob(jobData: Omit<Job, "id" | "createdAt" | "updatedAt">): Promise<string> {
    try {
      const jobsRef = ref(database, "jobs");
      const newJobRef = push(jobsRef);
      const now = Date.now();
      
      const job: Omit<Job, "id"> = {
        ...jobData,
        createdAt: now,
        updatedAt: now,
      };
      
      await set(newJobRef, job);
      return newJobRef.key as string;
    } catch (error) {
      console.error("Error creating job:", error);
      throw error;
    }
  },

  /**
   * Updates an existing job's basic details.
   */
  async updateJob(jobId: string, updates: Partial<Omit<Job, "id" | "createdAt">>): Promise<void> {
    try {
      const jobRef = ref(database, `jobs/${jobId}`);
      await update(jobRef, {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Error updating job:", error);
      throw error;
    }
  },

  /**
   * Saves or updates the job requirements (Hard Eligibility).
   */
  async updateJobRequirements(jobId: string, requirements: Omit<JobRequirements, "jobId">): Promise<void> {
    try {
      const reqRef = ref(database, `jobRequirements/${jobId}`);
      await set(reqRef, {
        jobId,
        ...requirements
      });
    } catch (error) {
      console.error("Error updating job requirements:", error);
      throw error;
    }
  },

  /**
   * Saves the PIS configuration weightages for the job.
   * This is a custom node for the PIS Engine to read from later.
   */
  async updateJobPISConfig(jobId: string, config: Record<string, number>): Promise<void> {
    try {
      const configRef = ref(database, `jobPISConfig/${jobId}`);
      await set(configRef, config);
    } catch (error) {
      console.error("Error updating job PIS config:", error);
      throw error;
    }
  },

  /**
   * Submits the job for TPO approval instead of publishing directly.
   */
  async requestJobApproval(jobId: string): Promise<void> {
    try {
      const jobRef = ref(database, `jobs/${jobId}`);
      await update(jobRef, {
        status: "pending_approval" as JobStatus,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Error submitting job for approval:", error);
      throw error;
    }
  }
};
