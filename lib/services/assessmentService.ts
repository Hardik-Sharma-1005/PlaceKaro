import { ref, get, set, push, query, orderByChild, equalTo, update, remove } from "firebase/database";
import { database } from "../firebase/database";
import { Assessment, AssessmentQuestion } from "../../types/database";

export const assessmentService = {
  /**
   * Fetches an assessment for a specific job.
   * Assuming a 1:1 relationship between Job and Assessment for now.
   */
  async getAssessmentByJobId(jobId: string): Promise<Assessment | null> {
    try {
      const q = query(ref(database, "assessments"), orderByChild("jobId"), equalTo(jobId));
      const snapshot = await get(q);
      
      if (!snapshot.exists()) return null;
      
      const data = snapshot.val();
      const keys = Object.keys(data);
      // Return the first assessment found for this job
      if (keys.length > 0) {
        return { ...data[keys[0]], id: keys[0] };
      }
      return null;
    } catch (error) {
      console.error("Error fetching assessment by job ID:", error);
      throw error;
    }
  },

  /**
   * Creates a new assessment for a job.
   */
  async createAssessment(assessmentData: Omit<Assessment, "id" | "createdAt">): Promise<string> {
    try {
      const assessmentsRef = ref(database, "assessments");
      const newRef = push(assessmentsRef);
      
      const newAssessment: Omit<Assessment, "id"> = {
        ...assessmentData,
        createdAt: Date.now()
      };
      
      await set(newRef, newAssessment);
      return newRef.key as string;
    } catch (error) {
      console.error("Error creating assessment:", error);
      throw error;
    }
  },

  /**
   * Updates an existing assessment.
   */
  async updateAssessment(assessmentId: string, updates: Partial<Assessment>): Promise<void> {
    try {
      const refToUpdate = ref(database, `assessments/${assessmentId}`);
      await update(refToUpdate, updates);
    } catch (error) {
      console.error("Error updating assessment:", error);
      throw error;
    }
  },

  /**
   * Fetches all questions for a specific assessment.
   */
  async getQuestionsByAssessmentId(assessmentId: string): Promise<AssessmentQuestion[]> {
    try {
      const q = query(ref(database, "assessmentQuestions"), orderByChild("assessmentId"), equalTo(assessmentId));
      const snapshot = await get(q);
      
      if (!snapshot.exists()) return [];
      
      const data = snapshot.val();
      return Object.keys(data).map(key => ({
        ...data[key],
        id: key
      }));
    } catch (error) {
      console.error("Error fetching questions:", error);
      throw error;
    }
  },

  /**
   * Adds a new question to an assessment.
   */
  async addQuestion(questionData: Omit<AssessmentQuestion, "id">): Promise<string> {
    try {
      const questionsRef = ref(database, "assessmentQuestions");
      const newRef = push(questionsRef);
      
      await set(newRef, questionData);
      return newRef.key as string;
    } catch (error) {
      console.error("Error adding question:", error);
      throw error;
    }
  },

  /**
   * Deletes a question.
   */
  async deleteQuestion(questionId: string): Promise<void> {
    try {
      await remove(ref(database, `assessmentQuestions/${questionId}`));
    } catch (error) {
      console.error("Error deleting question:", error);
      throw error;
    }
  }
};
