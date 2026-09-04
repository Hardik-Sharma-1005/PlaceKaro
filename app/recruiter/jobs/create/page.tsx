"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../lib/context/AuthContext";
import { RoleGuard } from "../../../../lib/components/RoleGuard";
import { jobService } from "../../../../lib/services/jobService";
import { AssessmentAccessModel } from "../../../../types/database";

const AVAILABLE_BRANCHES = ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil", "Electrical"];
const PIS_FACTORS = ["Technical Skills", "Domain Skills", "CGPA", "Projects", "Internships", "Certifications"];

function JobCreationWizard() {
  const { user } = useAuth();
  const router = useRouter();

  // Wizard State
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Basic Details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Step 2: Hard Eligibility
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [minCgpa, setMinCgpa] = useState("7.0");
  const [maxBacklogs, setMaxBacklogs] = useState("0");
  const [graduationYears, setGraduationYears] = useState<string[]>(["2024", "2025"]);

  // Step 3: PIS Configuration
  const [accessModel, setAccessModel] = useState<AssessmentAccessModel>("all_eligible");
  const [weights, setWeights] = useState<Record<string, number>>(
    PIS_FACTORS.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {})
  );

  const toggleBranch = (branch: string) => {
    setSelectedBranches(prev => 
      prev.includes(branch) ? prev.filter(b => b !== branch) : [...prev, branch]
    );
  };

  const toggleYear = (year: string) => {
    setGraduationYears(prev => 
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  const handleWeightChange = (factor: string, value: string) => {
    const num = parseInt(value) || 0;
    setWeights(prev => ({ ...prev, [factor]: num }));
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const handlePublish = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      // 1. Create Job (Draft)
      const jobId = await jobService.createJob({
        companyId: user.uid,
        recruiterId: user.uid,
        title,
        description,
        status: "draft",
        assessmentAccessModel: accessModel
      });

      // 2. Set Requirements
      await jobService.updateJobRequirements(jobId, {
        hardEligibility: {
          branches: selectedBranches,
          graduationYears: graduationYears.map(y => parseInt(y)),
          minimumCGPA: parseFloat(minCgpa),
          maximumBacklogs: parseInt(maxBacklogs)
        },
        competencies: {},
        confirmedByCompany: true
      });

      // 3. Set PIS Weights
      await jobService.updateJobPISConfig(jobId, weights);

      // 4. Request Approval
      await jobService.requestJobApproval(jobId);
      router.push("/recruiter/jobs");
    } catch (error) {
      console.error("Failed to publish job", error);
      alert("Failed to publish job. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-4">
            <Link href="/recruiter/jobs" className="text-sm font-medium text-slate-500 hover:text-slate-900">
              &larr; Cancel
            </Link>
            <div className="h-4 w-px bg-slate-300"></div>
            <p className="text-sm font-bold tracking-widest text-slate-900">Create New Job</p>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded"></div>
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-900 -z-10 rounded transition-all duration-300"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            ></div>
            
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ring-4 ring-slate-50 transition-colors ${
                s <= step ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {s}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs font-medium text-slate-500 px-1">
            <span>Basics</span>
            <span>Eligibility</span>
            <span>PIS Config</span>
            <span>Publish</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-6 sm:p-8">
          
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Job Details & JD</h2>
                <p className="text-sm text-slate-500 mt-1">Provide the basic information for this opening.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700">Job Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Frontend Developer"
                  className="mt-1 block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Job Description (JD)</label>
                <textarea 
                  rows={6}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the role, responsibilities, and ideal candidate..."
                  className="mt-1 block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6" 
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Hard Eligibility</h2>
                <p className="text-sm text-slate-500 mt-1">Set strict cut-offs. Students not meeting these will not be eligible.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Allowed Branches</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABLE_BRANCHES.map(branch => (
                    <label key={branch} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${selectedBranches.includes(branch) ? 'bg-slate-50 border-slate-900' : 'bg-white border-slate-200'}`}>
                      <input type="checkbox" checked={selectedBranches.includes(branch)} onChange={() => toggleBranch(branch)} className="h-4 w-4 text-slate-900 focus:ring-slate-900 border-slate-300 rounded" />
                      <span className="text-sm font-medium text-slate-700">{branch}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Minimum CGPA</label>
                  <input type="number" step="0.1" value={minCgpa} onChange={e => setMinCgpa(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Max Active Backlogs</label>
                  <input type="number" value={maxBacklogs} onChange={e => setMaxBacklogs(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Graduation Year</label>
                <div className="flex gap-2">
                  {["2024", "2025", "2026"].map(year => (
                    <label key={year} className={`flex items-center gap-2 p-2 px-4 rounded-full border cursor-pointer ${graduationYears.includes(year) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'}`}>
                      <input type="checkbox" className="hidden" checked={graduationYears.includes(year)} onChange={() => toggleYear(year)} />
                      <span className="text-sm font-medium">{year}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Placement Intelligence Score (PIS)</h2>
                <p className="text-sm text-slate-500 mt-1">Configure how candidates will be ranked and accessed.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Assessment Access Model</label>
                <select value={accessModel} onChange={e => setAccessModel(e.target.value as AssessmentAccessModel)} className="mt-1 block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6">
                  <option value="all_eligible">All Eligible (Anyone passing Hard Eligibility)</option>
                  <option value="role_fit">Role Fit (Ranked by PIS cut-off)</option>
                  <option value="custom">Custom (Manual Invite)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-900">PIS Weightage Configuration</h3>
                    <p className="text-xs text-slate-500">Distribute 100% across the factors.</p>
                  </div>
                  <span className={`text-sm font-bold ${totalWeight === 100 ? 'text-emerald-600' : 'text-red-600'}`}>
                    Total: {totalWeight}%
                  </span>
                </div>
                
                <div className="space-y-3">
                  {PIS_FACTORS.map(factor => (
                    <div key={factor} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 w-1/3">{factor}</span>
                      <div className="w-2/3 flex items-center gap-4">
                        <input 
                          type="range" 
                          min="0" max="100" 
                          value={weights[factor]} 
                          onChange={(e) => handleWeightChange(factor, e.target.value)}
                          className="w-full accent-slate-900" 
                        />
                        <span className="text-sm font-medium w-12 text-right">{weights[factor]}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                {totalWeight !== 100 && (
                  <p className="text-xs text-red-600 mt-2">Weights must exactly total 100% to proceed.</p>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Confirm & Publish</h2>
                <p className="text-sm text-slate-500 mt-1">Review the job details before pushing it live to students.</p>
              </div>

              <div className="bg-slate-50 rounded-lg p-5 ring-1 ring-inset ring-slate-200 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Job Title</h3>
                  <p className="text-base font-semibold text-slate-900">{title}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs font-medium text-slate-500">Eligibility</h3>
                    <p className="text-sm font-medium text-slate-900">{selectedBranches.length} Branches • CGPA {minCgpa}+</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-slate-500">Access Model</h3>
                    <p className="text-sm font-medium text-slate-900 capitalize">{accessModel.replace('_', ' ')}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-slate-500 mb-2">PIS Configuration</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(weights).filter(([_, w]) => w > 0).map(([factor, weight]) => (
                      <span key={factor} className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                        {factor}: {weight}%
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-blue-600 mt-0.5">ℹ️</span>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900">Ready for Assessment</h4>
                    <p className="text-xs text-blue-700 mt-1">
                      Publishing this job will immediately make it visible to eligible students based on the PIS engine rankings. 
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-center">
            <button 
              onClick={() => setStep(prev => Math.max(1, prev - 1))}
              disabled={step === 1 || isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-50"
            >
              Back
            </button>

            {step < 4 ? (
              <button 
                onClick={() => setStep(prev => prev + 1)}
                disabled={(!title && step === 1) || (totalWeight !== 100 && step === 3)}
                className="rounded-md bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
              >
                Next Step
              </button>
            ) : (
              <button 
                onClick={handlePublish}
                disabled={isSubmitting}
                className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <div className="h-4 w-4 rounded-full border-2 border-white border-r-transparent animate-spin"></div>}
                Publish Job Post
              </button>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default function JobCreationPage() {
  return (
    <RoleGuard allowedRoles={["company"]}>
      <JobCreationWizard />
    </RoleGuard>
  );
}
