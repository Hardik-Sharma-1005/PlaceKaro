import { ref, get, update, query, orderByChild, equalTo } from "firebase/database";
import { database } from "../firebase/database";
import { Job, JobStatus, StudentProfile, VerificationStatus } from "../../types/database";

export const placementService = {
  /**
   * Fetches all jobs that are pending approval by the TPO.
   */
  async getPendingJobs(): Promise<Job[]> {
    try {
      const jobsQuery = query(
        ref(database, "jobs"),
        orderByChild("status"),
        equalTo("pending_approval")
      );
      
      const snapshot = await get(jobsQuery);
      if (!snapshot.exists()) return [];
      
      const jobsData = snapshot.val();
      return Object.keys(jobsData).map(key => ({
        ...jobsData[key],
        id: key
      })).sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error("Error fetching pending jobs:", error);
      throw error;
    }
  },

  /**
   * Approves a job and publishes it.
   */
  async approveJob(jobId: string): Promise<void> {
    try {
      const jobRef = ref(database, `jobs/${jobId}`);
      await update(jobRef, {
        status: "published" as JobStatus,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Error approving job:", error);
      throw error;
    }
  },

  /**
   * Rejects a job.
   */
  async rejectJob(jobId: string): Promise<void> {
    try {
      const jobRef = ref(database, `jobs/${jobId}`);
      await update(jobRef, {
        status: "rejected" as JobStatus,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Error rejecting job:", error);
      throw error;
    }
  },

  /**
   * Fetches all student profiles.
   */
  async getAllStudents(): Promise<StudentProfile[]> {
    try {
      const snapshot = await get(ref(database, "studentProfiles"));
      if (!snapshot.exists()) return [];
      
      const studentsData = snapshot.val();
      return Object.keys(studentsData).map(key => ({
        ...studentsData[key],
        userId: key
      })).sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error("Error fetching students:", error);
      throw error;
    }
  },

  /**
   * TPO Dashboard stats
   */
  async getDashboardStats(): Promise<{
    totalStudents: number,
    publishedJobs: number,
    pendingJobs: number
  }> {
    try {
      const [studentsSnap, jobsSnap] = await Promise.all([
        get(ref(database, "studentProfiles")),
        get(ref(database, "jobs"))
      ]);

      const totalStudents = studentsSnap.exists() ? Object.keys(studentsSnap.val()).length : 0;
      
      let publishedJobs = 0;
      let pendingJobs = 0;
      
      if (jobsSnap.exists()) {
        const jobsData = jobsSnap.val();
        Object.values(jobsData).forEach((job: any) => {
          if (job.status === "published") publishedJobs++;
          if (job.status === "pending_approval") pendingJobs++;
        });
      }

      return { totalStudents, publishedJobs, pendingJobs };
    } catch (error) {
      console.error("Error fetching TPO stats:", error);
      throw error;
    }
  }
};
