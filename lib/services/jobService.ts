import {
  ref,
  get,
  set,
  push,
  query,
  orderByChild,
  equalTo,
  update,
} from "firebase/database";
import { database } from "../firebase/database";
import {
  Job,
  JobRequirements,
  JobStatus,
  PISConfiguration,
} from "../../types/database";

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

      if (!snapshot.exists()) {
        return [];
      }

      const jobsData = snapshot.val() as Record<string, Job>;

      return Object.keys(jobsData)
        .map((key) => ({
          ...jobsData[key],
          id: key,
        }))
        .sort((a, b) => b.createdAt - a.createdAt);
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

      if (!snapshot.exists()) {
        return null;
      }

      return {
        ...(snapshot.val() as Omit<Job, "id">),
        id: jobId,
      };
    } catch (error) {
      console.error("Error fetching job:", error);
      throw error;
    }
  },

  /**
   * Fetches the requirements for a specific job.
   */
  async getJobRequirements(
    jobId: string
  ): Promise<JobRequirements | null> {
    try {
      const snapshot = await get(
        ref(database, `jobRequirements/${jobId}`)
      );

      if (!snapshot.exists()) {
        return null;
      }

      return snapshot.val() as JobRequirements;
    } catch (error) {
      console.error("Error fetching job requirements:", error);
      throw error;
    }
  },

  /**
   * Creates a new job.
   */
  async createJob(
    jobData: Omit<Job, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
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

      if (!newJobRef.key) {
        throw new Error("Firebase did not return a job ID.");
      }

      return newJobRef.key;
    } catch (error) {
      console.error("Error creating job:", error);
      throw error;
    }
  },

  /**
   * Updates an existing job's basic details.
   */
  async updateJob(
    jobId: string,
    updates: Partial<Omit<Job, "id" | "createdAt">>
  ): Promise<void> {
    try {
      const jobRef = ref(database, `jobs/${jobId}`);

      await update(jobRef, {
        ...updates,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Error updating job:", error);
      throw error;
    }
  },

  /**
   * Saves or updates the job requirements.
   */
  async updateJobRequirements(
    jobId: string,
    requirements: Omit<JobRequirements, "jobId">
  ): Promise<void> {
    try {
      const reqRef = ref(database, `jobRequirements/${jobId}`);

      await set(reqRef, {
        jobId,
        ...requirements,
      });
    } catch (error) {
      console.error("Error updating job requirements:", error);
      throw error;
    }
  },

  /**
   * Saves the recruiter-controlled PIS configuration
   * using the canonical PlaceKaro PIS schema.
   */
  async updateJobPISConfig(
    jobId: string,
    parameters: PISConfiguration["parameters"]
  ): Promise<void> {
    try {
      const configRef = ref(
        database,
        `pisConfigurations/${jobId}`
      );

      const configuration: PISConfiguration = {
        jobId,
        parameters,
        confirmed: true,
        updatedAt: Date.now(),
      };

      await set(configRef, configuration);
    } catch (error) {
      console.error("Error updating PIS configuration:", error);
      throw error;
    }
  },

  /**
   * Submits the job for placement-cell approval.
   */
  async requestJobApproval(jobId: string): Promise<void> {
    try {
      const jobRef = ref(database, `jobs/${jobId}`);

      await update(jobRef, {
        status: "pending_approval" as JobStatus,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Error submitting job for approval:", error);
      throw error;
    }
  },

  /**
   * Approves a job from the placement cell.
   *
   * Only a job currently waiting for approval should be
   * transitioned to published.
   */
  async approveJob(jobId: string): Promise<void> {
    try {
      const jobRef = ref(database, `jobs/${jobId}`);
      const snapshot = await get(jobRef);

      if (!snapshot.exists()) {
        throw new Error("Job not found.");
      }

      const currentJob = snapshot.val() as Omit<Job, "id">;

      if (currentJob.status !== "pending_approval") {
        throw new Error(
          `Only jobs pending approval can be published. Current status: ${currentJob.status}.`
        );
      }

      await update(jobRef, {
        status: "published" as JobStatus,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Error approving job:", error);
      throw error;
    }
  },
};