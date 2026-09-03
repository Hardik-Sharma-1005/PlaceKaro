import { ref, get, set, push, query, orderByChild, equalTo } from "firebase/database";
import { database } from "../firebase/database";
import { Interview } from "../../types/database";

export const interviewService = {
  /**
   * Schedules a new interview.
   */
  async scheduleInterview(interviewData: Omit<Interview, "id">): Promise<string> {
    try {
      const interviewsRef = ref(database, "interviews");
      const newRef = push(interviewsRef);
      
      const newInterview: Omit<Interview, "id"> = {
        ...interviewData
      };
      
      await set(newRef, newInterview);
      return newRef.key as string;
    } catch (error) {
      console.error("Error scheduling interview:", error);
      throw error;
    }
  },

  /**
   * Fetches interviews for a specific application.
   */
  async getInterviewsForApplication(applicationId: string): Promise<Interview[]> {
    try {
      const q = query(ref(database, "interviews"), orderByChild("applicationId"), equalTo(applicationId));
      const snapshot = await get(q);
      
      if (!snapshot.exists()) return [];
      
      const data = snapshot.val();
      return Object.keys(data).map(key => ({ ...data[key], id: key }));
    } catch (error) {
      console.error("Error fetching interviews for application:", error);
      throw error;
    }
  },

  /**
   * Fetches interviews for a specific student.
   */
  async getInterviewsForStudent(studentId: string): Promise<Interview[]> {
    try {
      const q = query(ref(database, "interviews"), orderByChild("studentId"), equalTo(studentId));
      const snapshot = await get(q);
      
      if (!snapshot.exists()) return [];
      
      const data = snapshot.val();
      return Object.keys(data).map(key => ({ ...data[key], id: key }));
    } catch (error) {
      console.error("Error fetching interviews for student:", error);
      throw error;
    }
  },

  /**
   * Updates an interview status.
   */
  async updateInterviewStatus(interviewId: string, status: Interview['status']): Promise<void> {
    try {
      const interviewRef = ref(database, `interviews/${interviewId}/status`);
      await set(interviewRef, status);
    } catch (error) {
      console.error("Error updating interview status:", error);
      throw error;
    }
  }
};
