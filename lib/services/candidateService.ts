import { ref, get, set, remove, push } from "firebase/database";
import { database } from "../firebase/database";
import { StudentProfile, Skill, Project, Internship, Certification, Achievement, Bookmark } from "../../types/database";

export interface CandidateWithSkills extends StudentProfile {
  skills: Skill[];
}

export interface FullCandidateProfile extends CandidateWithSkills {
  projects: Project[];
  internships: Internship[];
  certifications: Certification[];
  achievements: Achievement[];
}

export const candidateService = {
  /**
   * Fetches all student profiles and their associated skills.
   * Note: In a production app with thousands of users, this would be handled
   * via an indexing service (like Algolia/Typesense) or server-side pagination.
   * For the MVP, we fetch and filter on the client.
   */
  async getAllCandidates(): Promise<CandidateWithSkills[]> {
    try {
      const profilesRef = ref(database, "studentProfiles");
      const skillsRef = ref(database, "skills");

      const [profilesSnapshot, skillsSnapshot] = await Promise.all([
        get(profilesRef),
        get(skillsRef),
      ]);

      const profilesData = profilesSnapshot.val() || {};
      const skillsData = skillsSnapshot.val() || {};

      // Convert skills object to array
      const allSkills: Skill[] = Object.values(skillsData);

      // Group skills by studentId for quick lookup
      const skillsByStudent: Record<string, Skill[]> = {};
      allSkills.forEach((skill) => {
        if (!skillsByStudent[skill.studentId]) {
          skillsByStudent[skill.studentId] = [];
        }
        skillsByStudent[skill.studentId].push(skill);
      });

      // Map profiles and attach skills
      const candidates: CandidateWithSkills[] = Object.values(profilesData).map(
        (profile: any) => {
          return {
            ...profile,
            skills: skillsByStudent[profile.userId] || [],
          };
        }
      );

      return candidates;
    } catch (error) {
      console.error("Error fetching candidates:", error);
      throw error;
    }
  },

  /**
   * Fetches the complete profile for a single candidate, including all entities.
   */
  async getCandidateById(studentId: string): Promise<FullCandidateProfile | null> {
    try {
      const profileRef = ref(database, `studentProfiles/${studentId}`);
      const profileSnapshot = await get(profileRef);
      if (!profileSnapshot.exists()) return null;

      const profile = profileSnapshot.val() as StudentProfile;

      // Fetch related data
      const [
        skillsSnap,
        projectsSnap,
        internshipsSnap,
        certsSnap,
        achievementsSnap
      ] = await Promise.all([
        get(ref(database, "skills")),
        get(ref(database, "projects")),
        get(ref(database, "internships")),
        get(ref(database, "certifications")),
        get(ref(database, "achievements")),
      ]);

      const skills: Skill[] = Object.values(skillsSnap.val() || {}).filter((s: any) => s.studentId === studentId);
      const projects: Project[] = Object.values(projectsSnap.val() || {}).filter((p: any) => p.studentId === studentId);
      const internships: Internship[] = Object.values(internshipsSnap.val() || {}).filter((i: any) => i.studentId === studentId);
      const certifications: Certification[] = Object.values(certsSnap.val() || {}).filter((c: any) => c.studentId === studentId);
      const achievements: Achievement[] = Object.values(achievementsSnap.val() || {}).filter((a: any) => a.studentId === studentId);

      return {
        ...profile,
        skills,
        projects,
        internships,
        certifications,
        achievements,
      };
    } catch (error) {
      console.error("Error fetching full candidate profile:", error);
      throw error;
    }
  },

  /**
   * Fetches all bookmarks for a given recruiter.
   */
  async getBookmarks(recruiterId: string): Promise<Bookmark[]> {
    try {
      const bookmarksRef = ref(database, "bookmarks");
      const bookmarksSnapshot = await get(bookmarksRef);
      const allBookmarks = bookmarksSnapshot.val() || {};
      
      const recruiterBookmarks = Object.keys(allBookmarks)
        .map(key => ({ ...allBookmarks[key], id: key }))
        .filter((bookmark: Bookmark) => bookmark.recruiterId === recruiterId);
        
      return recruiterBookmarks;
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      throw error;
    }
  },

  /**
   * Bookmarks a candidate for a recruiter.
   */
  async bookmarkCandidate(recruiterId: string, companyId: string, studentId: string): Promise<string> {
    try {
      const bookmarksRef = ref(database, "bookmarks");
      const newBookmarkRef = push(bookmarksRef);
      const bookmarkData: Omit<Bookmark, "id"> = {
        companyId,
        recruiterId,
        studentId,
        createdAt: Date.now(),
      };
      
      await set(newBookmarkRef, bookmarkData);
      return newBookmarkRef.key as string;
    } catch (error) {
      console.error("Error adding bookmark:", error);
      throw error;
    }
  },

  /**
   * Removes a bookmark.
   */
  async removeBookmark(bookmarkId: string): Promise<void> {
    try {
      const bookmarkRef = ref(database, `bookmarks/${bookmarkId}`);
      await remove(bookmarkRef);
    } catch (error) {
      console.error("Error removing bookmark:", error);
      throw error;
    }
  }
};
