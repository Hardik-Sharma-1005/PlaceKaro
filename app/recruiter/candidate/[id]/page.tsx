"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../lib/context/AuthContext";
import { RoleGuard } from "../../../../lib/components/RoleGuard";
import { candidateService, FullCandidateProfile } from "../../../../lib/services/candidateService";

function CandidateProfileContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const studentId = params?.id as string;
  
  const [profile, setProfile] = useState<FullCandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Bookmark state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [bookmarking, setBookmarking] = useState(false);

  useEffect(() => {
    if (!studentId) return;

    async function loadData() {
      try {
        const data = await candidateService.getCandidateById(studentId);
        setProfile(data);
        
        // Also check if this user is already bookmarked by the recruiter
        if (user && user.role === "company") {
          const bookmarks = await candidateService.getBookmarks(user.uid);
          const existingBookmark = bookmarks.find(b => b.studentId === studentId);
          if (existingBookmark) {
            setIsBookmarked(true);
            setBookmarkId(existingBookmark.id);
          }
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [studentId, user]);

  const handleBookmarkToggle = async () => {
    if (!user || user.role !== "company") return;
    
    setBookmarking(true);
    try {
      if (isBookmarked && bookmarkId) {
        await candidateService.removeBookmark(bookmarkId);
        setIsBookmarked(false);
        setBookmarkId(null);
      } else {
        // Since we don't store companyId separately in context for MVP, we just use user.uid as companyId for now.
        // In a real app, user model might have a companyId.
        const newId = await candidateService.bookmarkCandidate(user.uid, user.uid, studentId);
        setIsBookmarked(true);
        setBookmarkId(newId);
      }
    } catch (error) {
      console.error("Failed to toggle bookmark", error);
    } finally {
      setBookmarking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Candidate Not Found</h1>
        <p className="text-slate-500 mb-6">The profile you are looking for does not exist or has been removed.</p>
        <button onClick={() => router.back()} className="rounded-md bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="text-sm font-medium text-slate-500 hover:text-slate-900">
                &larr; Back
              </button>
              <div className="h-4 w-px bg-slate-300"></div>
              <p className="text-sm font-bold tracking-widest text-slate-900">
                PLACEKARO
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden mb-6">
          <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {profile.fullName}
                </h1>
                {profile.profileCompletion >= 80 && (
                  <span title="Profile Champion" className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Profile Champion
                  </span>
                )}
              </div>
              <p className="mt-2 text-lg text-slate-600">
                {profile.degree} in {profile.branch} • Class of {profile.graduationYear}
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-900">{profile.cgpa}</span> CGPA
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-900">{profile.attendance}%</span> Attendance
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-900">{profile.backlogCount}</span> Active Backlogs
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">{profile.university}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:flex-col md:w-48 shrink-0">
              <button 
                onClick={handleBookmarkToggle}
                disabled={bookmarking}
                className={`flex-1 md:flex-none justify-center rounded-md px-3.5 py-2.5 text-sm font-semibold shadow-sm ring-1 ring-inset transition-colors flex items-center gap-2 ${
                  isBookmarked 
                    ? 'bg-amber-50 text-amber-900 ring-amber-300 hover:bg-amber-100' 
                    : 'bg-white text-slate-900 ring-slate-300 hover:bg-slate-50'
                }`}
              >
                {bookmarking ? "Saving..." : isBookmarked ? "★ Bookmarked" : "☆ Bookmark"}
              </button>
              <button className="flex-1 md:flex-none justify-center rounded-md bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 flex items-center gap-2">
                Invite to Assessment
              </button>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Skills & Certs */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Skills */}
            <section className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Verified Skills</h2>
              {profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map(skill => (
                    <span key={skill.id} className="inline-flex items-center gap-1.5 rounded bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                      {skill.name}
                      {skill.evidenceIds && skill.evidenceIds.length > 0 && (
                        <span className="text-emerald-600" title="Has Verified Evidence">✓</span>
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No skills listed.</p>
              )}
            </section>

            {/* Certifications */}
            <section className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Certifications</h2>
              {profile.certifications.length > 0 ? (
                <div className="space-y-4">
                  {profile.certifications.map(cert => (
                    <div key={cert.id} className="text-sm">
                      <p className="font-medium text-slate-900">{cert.title}</p>
                      <p className="text-slate-500">{cert.issuer}</p>
                      {cert.issueDate && <p className="text-xs text-slate-400 mt-1">Issued: {cert.issueDate}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No certifications listed.</p>
              )}
            </section>
            
            {/* Achievements */}
            <section className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Achievements</h2>
              {profile.achievements.length > 0 ? (
                <div className="space-y-4">
                  {profile.achievements.map(achv => (
                    <div key={achv.id} className="text-sm">
                      <p className="font-medium text-slate-900">{achv.title}</p>
                      <p className="text-slate-500">{achv.organization}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No achievements listed.</p>
              )}
            </section>

          </div>

          {/* Right Column - Experience & Projects */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Internships */}
            <section className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Work Experience & Internships</h2>
              {profile.internships.length > 0 ? (
                <div className="space-y-6">
                  {profile.internships.map(internship => (
                    <div key={internship.id} className="relative pl-4 border-l-2 border-slate-200">
                      <div className="absolute w-2 h-2 bg-slate-400 rounded-full -left-[5px] top-1.5 ring-4 ring-white"></div>
                      <h3 className="text-sm font-semibold text-slate-900">{internship.role}</h3>
                      <p className="text-sm text-slate-600 mt-0.5">{internship.organization}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {internship.startDate || "Unknown Start"} - {internship.endDate || "Present"}
                      </p>
                      <p className="text-sm text-slate-600 mt-3 whitespace-pre-wrap">{internship.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No work experience listed.</p>
              )}
            </section>

            {/* Projects */}
            <section className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Key Projects</h2>
              {profile.projects.length > 0 ? (
                <div className="space-y-6">
                  {profile.projects.map(project => (
                    <div key={project.id} className="bg-slate-50 rounded-lg p-4 ring-1 ring-inset ring-slate-200">
                      <h3 className="text-sm font-semibold text-slate-900">{project.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">Role: {project.role}</p>
                      <p className="text-sm text-slate-600 mt-3 whitespace-pre-wrap">{project.description}</p>
                      
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {project.technologies.map(tech => (
                            <span key={tech} className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No projects listed.</p>
              )}
            </section>

          </div>

        </div>
      </main>
    </div>
  );
}

export default function CandidateProfilePage() {
  return (
    <RoleGuard allowedRoles={["company"]}>
      <CandidateProfileContent />
    </RoleGuard>
  );
}
