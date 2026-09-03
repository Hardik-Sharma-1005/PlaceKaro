"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../lib/context/AuthContext";
import { RoleGuard } from "../../../lib/components/RoleGuard";
import { candidateService, CandidateWithSkills } from "../../../lib/services/candidateService";
import { Bookmark } from "../../../types/database";

function BookmarksContent() {
  const { user } = useAuth();
  
  const [bookmarkedCandidates, setBookmarkedCandidates] = useState<CandidateWithSkills[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBookmarks() {
      if (!user || user.role !== "company") return;
      
      try {
        // Fetch the recruiter's bookmarks
        const bookmarks = await candidateService.getBookmarks(user.uid);
        const bookmarkedStudentIds = new Set(bookmarks.map(b => b.studentId));
        
        // Fetch all candidates and filter by bookmarked IDs
        // (In production, this would be an API call fetching only the specific IDs)
        const allCandidates = await candidateService.getAllCandidates();
        const filtered = allCandidates.filter(c => bookmarkedStudentIds.has(c.userId));
        
        setBookmarkedCandidates(filtered);
      } catch (error) {
        console.error("Failed to load bookmarks", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadBookmarks();
  }, [user]);

  const renderCandidateCard = (candidate: CandidateWithSkills) => (
    <div key={candidate.userId} className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-5 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-4">
          <h3 className="text-base font-semibold text-slate-900 truncate flex items-center gap-2">
            {candidate.fullName}
            {candidate.profileCompletion && candidate.profileCompletion >= 80 && (
              <span title="Profile Champion: Highly Complete Profile" className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-emerald-100 text-[10px] text-emerald-700">
                ✓
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{candidate.branch} • {candidate.graduationYear}</p>
        </div>
        <div className="flex-shrink-0">
          <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-700/10">
            {candidate.cgpa} CGPA
          </span>
        </div>
      </div>
      
      <div className="mt-4">
        <p className="text-xs text-slate-600 line-clamp-1">{candidate.university}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-1">
        {candidate.skills.slice(0, 3).map(skill => (
          <span key={skill.id} className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
            {skill.name}
            {skill.evidenceIds && skill.evidenceIds.length > 0 && (
              <span className="ml-1 text-emerald-600" title="Verified Skill">✓</span>
            )}
          </span>
        ))}
        {candidate.skills.length > 3 && (
          <span className="inline-flex items-center rounded bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            +{candidate.skills.length - 3} more
          </span>
        )}
      </div>
      
      <div className="mt-auto pt-5">
        <Link 
          href={`/recruiter/candidate/${candidate.userId}`}
          className="w-full inline-block text-center rounded bg-white px-2 py-1.5 text-xs font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
        >
          View Profile
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/recruiter" className="text-sm font-medium text-slate-500 hover:text-slate-900">
                &larr; Back to Dashboard
              </Link>
              <div className="h-4 w-px bg-slate-300"></div>
              <p className="text-sm font-bold tracking-widest text-slate-900">
                PLACEKARO <span className="text-slate-400 font-normal ml-2">| Bookmarks</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Bookmarked Profiles</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? "Loading..." : `You have saved ${bookmarkedCandidates.length} candidate${bookmarkedCandidates.length === 1 ? '' : 's'}.`}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          </div>
        ) : bookmarkedCandidates.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-12 text-center max-w-2xl mx-auto">
            <h3 className="text-base font-semibold text-slate-900">No bookmarks yet</h3>
            <p className="mt-2 text-sm text-slate-500 mb-6">
              You haven't bookmarked any candidates. Go to the Candidate Directory to start discovering talent.
            </p>
            <Link 
              href="/recruiter/search"
              className="rounded-md bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Search Candidates
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {bookmarkedCandidates.map(candidate => renderCandidateCard(candidate))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function BookmarksPage() {
  return (
    <RoleGuard allowedRoles={["company"]}>
      <BookmarksContent />
    </RoleGuard>
  );
}
