"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "../../../lib/context/AuthContext";
import { RoleGuard } from "../../../lib/components/RoleGuard";
import { candidateService, CandidateWithSkills } from "../../../lib/services/candidateService";

function SearchDashboard() {
  const { user } = useAuth();
  
  // State for candidates
  const [candidates, setCandidates] = useState<CandidateWithSkills[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [minCgpa, setMinCgpa] = useState("");

  useEffect(() => {
    async function loadCandidates() {
      try {
        const data = await candidateService.getAllCandidates();
        setCandidates(data);
      } catch (error) {
        console.error("Failed to load candidates", error);
      } finally {
        setLoading(false);
      }
    }
    loadCandidates();
  }, []);

  // Compute matched candidates (Exact vs Potential)
  const { exactMatches, potentialMatches } = useMemo(() => {
    const exact: CandidateWithSkills[] = [];
    const potential: CandidateWithSkills[] = [];
    
    // Check if any filters are active
    const hasActiveFilters = searchTerm !== "" || branchFilter !== "" || yearFilter !== "" || minCgpa !== "";

    if (!hasActiveFilters) {
      // If no filters, show all as exact
      return { exactMatches: candidates, potentialMatches: [] };
    }

    candidates.forEach((candidate) => {
      let isExact = true;
      let hasSomeMatch = false;

      // 1. Keyword search (Name or Skill)
      const term = searchTerm.toLowerCase().trim();
      if (term !== "") {
        const matchesTerm = candidate.fullName.toLowerCase().includes(term) ||
          candidate.skills.some(skill => skill.name.toLowerCase().includes(term));
        if (!matchesTerm) isExact = false;
        else hasSomeMatch = true;
      }

      // 2. Branch
      if (branchFilter !== "") {
        if (candidate.branch !== branchFilter) isExact = false;
        else hasSomeMatch = true;
      }

      // 3. Graduation Year
      if (yearFilter !== "") {
        if (candidate.graduationYear.toString() !== yearFilter) isExact = false;
        else hasSomeMatch = true;
      }

      // 4. CGPA
      const parsedCgpa = parseFloat(minCgpa);
      if (!isNaN(parsedCgpa)) {
        if (candidate.cgpa < parsedCgpa) isExact = false;
        else hasSomeMatch = true;
      }

      if (isExact) {
        exact.push(candidate);
      } else if (hasSomeMatch) {
        potential.push(candidate);
      }
    });

    return { exactMatches: exact, potentialMatches: potential };
  }, [candidates, searchTerm, branchFilter, yearFilter, minCgpa]);

  // Derive unique filter options from data
  const branches = useMemo(() => Array.from(new Set(candidates.map(c => c.branch))).sort(), [candidates]);
  const years = useMemo(() => Array.from(new Set(candidates.map(c => c.graduationYear))).sort((a, b) => b - a), [candidates]);

  const renderCandidateCard = (candidate: CandidateWithSkills, isPotential: boolean = false) => (
    <div key={candidate.userId} className={`bg-white rounded-xl shadow-sm ring-1 p-5 flex flex-col hover:shadow-md transition-shadow ${isPotential ? 'ring-amber-200 bg-amber-50/10' : 'ring-slate-200'}`}>
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
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${isPotential ? 'bg-amber-50 text-amber-700 ring-amber-600/20' : 'bg-blue-50 text-blue-700 ring-blue-700/10'}`}>
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
                PLACEKARO <span className="text-slate-400 font-normal ml-2">| Search</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-5 sticky top-8">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Filters</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Keywords</label>
                <input
                  type="text"
                  placeholder="Name, Skill..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Branch</label>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6"
                >
                  <option value="">All Branches</option>
                  {branches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Graduation Year</label>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6"
                >
                  <option value="">All Years</option>
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Min. CGPA</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  placeholder="e.g. 7.5"
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(e.target.value)}
                  className="w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100">
              <button 
                onClick={() => {
                  setSearchTerm("");
                  setBranchFilter("");
                  setYearFilter("");
                  setMinCgpa("");
                }}
                className="w-full text-sm text-slate-500 hover:text-slate-900 font-medium"
              >
                Clear all filters
              </button>
            </div>
          </div>
        </aside>

        {/* Results Area */}
        <div className="flex-1">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Candidate Directory</h1>
              <p className="mt-1 text-sm text-slate-500">
                {loading ? "Searching..." : `Showing ${exactMatches.length + potentialMatches.length} candidates`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-4 text-sm text-slate-500">Loading candidate profiles...</p>
            </div>
          ) : exactMatches.length === 0 && potentialMatches.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-12 text-center">
              <h3 className="text-base font-semibold text-slate-900">No candidates found</h3>
              <p className="mt-2 text-sm text-slate-500">
                Try adjusting your filters to broaden your search.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Exact Matches */}
              {exactMatches.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-slate-900 mb-4 tracking-wide uppercase">
                    Exact Matches ({exactMatches.length})
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                    {exactMatches.map(candidate => renderCandidateCard(candidate, false))}
                  </div>
                </section>
              )}

              {/* Potential Matches */}
              {potentialMatches.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-sm font-semibold text-slate-500 tracking-wide uppercase">
                      Potential Matches ({potentialMatches.length})
                    </h2>
                    <div className="h-px flex-1 bg-slate-200"></div>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">These candidates match some, but not all, of your active filters.</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 opacity-90">
                    {potentialMatches.map(candidate => renderCandidateCard(candidate, true))}
                  </div>
                </section>
              )}

            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <RoleGuard allowedRoles={["company"]}>
      <SearchDashboard />
    </RoleGuard>
  );
}
