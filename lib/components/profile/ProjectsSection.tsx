// lib/components/profile/ProjectsSection.tsx

import { useState } from "react";
import type { Evidence, Project } from "../../../types/database";
import {
  addStudentProject,
  deleteStudentProject,
  updateStudentProject,
} from "../../services/studentProfileService";
import { EvidenceBadge } from "./EvidenceBadge";

interface ProjectsSectionProps {
  studentId: string;
  projects: Project[];
  evidenceList: Evidence[];
  onProjectsUpdated: () => void;
}

const COMMON_TECH = [
  "React",
  "TypeScript",
  "Python",
  "Next.js",
  "Node.js",
  "Tailwind CSS",
  "Firebase",
  "PostgreSQL",
  "MongoDB",
  "Docker",
  "AWS",
  "GraphQL",
];

const TEMPLATES = [
  {
    title: "AI Placement Preparation Assistant",
    role: "Full Stack Developer",
    technologies: ["React", "Python", "Firebase", "Tailwind CSS"],
    startDate: "Jan 2025",
    endDate: "Present",
    description:
      "Engineered an automated interview preparation tool with AI-driven mock questions, real-time code evaluation, and performance analytics.",
  },
  {
    title: "Distributed Microservices Architecture",
    role: "Backend Engineer",
    technologies: ["Node.js", "Docker", "PostgreSQL", "AWS"],
    startDate: "Aug 2024",
    endDate: "Dec 2024",
    description:
      "Designed a fault-tolerant microservices backend with asynchronous messaging, rate limiting, and 99.9% uptime deployment on cloud infrastructure.",
  },
];

export function ProjectsSection({
  studentId,
  projects,
  evidenceList,
  onProjectsUpdated,
}: ProjectsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");
  const [evidenceId, setEvidenceId] = useState("");

  const handleOpenAdd = () => {
    setEditingProject(null);
    setTitle("");
    setRole("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setTechnologies(["React", "TypeScript"]);
    setTechInput("");
    setEvidenceId("");
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setTitle(project.title);
    setRole(project.role);
    setDescription(project.description);
    setStartDate(project.startDate || "");
    setEndDate(project.endDate || "");
    setTechnologies([...project.technologies]);
    setTechInput("");
    setEvidenceId(project.evidenceIds?.[0] || "");
    setError(null);
    setIsModalOpen(true);
  };

  const handleApplyTemplate = (tmpl: (typeof TEMPLATES)[0]) => {
    setTitle(tmpl.title);
    setRole(tmpl.role);
    setDescription(tmpl.description);
    setStartDate(tmpl.startDate);
    setEndDate(tmpl.endDate);
    setTechnologies([...tmpl.technologies]);
  };

  const handleAddTech = (tech: string) => {
    const trimmed = tech.trim();
    if (trimmed && !technologies.includes(trimmed)) {
      setTechnologies((prev) => [...prev, trimmed]);
    }
    setTechInput("");
  };

  const handleRemoveTech = (techToRemove: string) => {
    setTechnologies((prev) => prev.filter((t) => t !== techToRemove));
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a project title.");
      return;
    }
    if (!role.trim()) {
      setError("Please enter your role in the project.");
      return;
    }
    if (!description.trim()) {
      setError("Please provide a description of the project.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const evidenceIds = evidenceId ? [evidenceId] : undefined;

      if (editingProject) {
        await updateStudentProject(editingProject.id, {
          title: title.trim(),
          role: role.trim(),
          description: description.trim(),
          technologies,
          startDate: startDate.trim() || undefined,
          endDate: endDate.trim() || undefined,
          evidenceIds,
        });
      } else {
        await addStudentProject(studentId, {
          title: title.trim(),
          role: role.trim(),
          description: description.trim(),
          technologies,
          startDate: startDate.trim() || undefined,
          endDate: endDate.trim() || undefined,
          evidenceIds,
        });
      }

      setIsModalOpen(false);
      onProjectsUpdated();
    } catch (err) {
      console.error("Failed to save project:", err);
      setError("Failed to save project. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (projectId: string, projectTitle: string) => {
    if (
      !window.confirm(
        `Are you sure you want to remove "${projectTitle}" from your portfolio?`
      )
    ) {
      return;
    }

    try {
      await deleteStudentProject(projectId);
      onProjectsUpdated();
    } catch (err) {
      console.error("Failed to delete project:", err);
      alert("Failed to delete project.");
    }
  };

  const verifiedProjectsCount = projects.filter((p) => {
    if (!p.evidenceIds?.length) return false;
    const ev = evidenceList.find((e) => e.id === p.evidenceIds![0]);
    return ev?.verificationStatus === "verified" || ev?.verificationStatus === "approved";
  }).length;

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {/* Section Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-950">
              Projects & Practical Implementations
            </h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {projects.length} {projects.length === 1 ? "project" : "projects"}
            </span>
            {verifiedProjectsCount > 0 && (
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {verifiedProjectsCount} verified
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Showcase your real-world systems, full-stack applications, and verifiable technical builds.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <span>+ Add Project</span>
        </button>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-700">
            No projects added yet
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Add applications, machine learning models, or systems you have built to your portfolio.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {projects.map((project) => {
            const attachedEvidence = project.evidenceIds?.length
              ? evidenceList.find((e) => e.id === project.evidenceIds![0])
              : undefined;

            return (
              <article
                key={project.id}
                className="group rounded-xl border border-slate-200 p-6 transition hover:border-slate-300 hover:shadow-xs"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-950">
                        {project.title}
                      </h3>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {project.role}
                      </span>
                    </div>

                    {(project.startDate || project.endDate) && (
                      <p className="mt-1 text-xs text-slate-400">
                        {project.startDate || "Start"} → {project.endDate || "Present"}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(project)}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                      Edit
                    </button>
                    <span className="text-slate-200">•</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(project.id, project.title)}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {project.description}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  {/* Tech Stack Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Evidence Status Badge */}
                  <div>
                    {attachedEvidence ? (
                      <EvidenceBadge
                        status={attachedEvidence.verificationStatus}
                        title={attachedEvidence.title}
                        fileUrl={attachedEvidence.fileUrl}
                      />
                    ) : (
                      <span className="inline-block rounded-full border border-dashed border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-400">
                        No repository / artifact linked
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Add / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                {editingProject ? "Edit Project" : "Add Project to Portfolio"}
              </h3>
              <button
                type="button"
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                {error}
              </div>
            )}

            {/* Quick Templates for Demo */}
            {!editingProject && (
              <div className="mt-3">
                <p className="text-[11px] font-medium text-slate-400">
                  Quick demo templates:
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.title}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-200"
                    >
                      ⚡ {tmpl.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Campus Placement Intelligence Platform"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Your Role
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Lead Developer, ML Researcher"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Start Date
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Jan 2025"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    End Date
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Present or May 2025"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              {/* Interactive Technologies Chips Input */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Technologies & Frameworks
                </label>

                {/* Selected chips */}
                <div className="mt-1.5 flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-xl border border-slate-300 p-2">
                  {technologies.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-0.5 text-xs font-medium text-white"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => handleRemoveTech(tech)}
                        className="text-slate-300 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  <input
                    type="text"
                    placeholder={
                      technologies.length === 0 ? "Type tech and press Enter..." : "Add more..."
                    }
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        handleAddTech(techInput);
                      }
                    }}
                    className="flex-1 min-w-[120px] bg-transparent text-sm outline-none"
                  />
                </div>

                {/* Quick add suggestions */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {COMMON_TECH.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleAddTech(t)}
                      className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition ${
                        technologies.includes(t)
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                      disabled={technologies.includes(t)}
                    >
                      + {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Description & Impact
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the system architecture, your technical contributions, and metrics..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Attach Evidence (e.g. GitHub Repo / Live URL)
                </label>
                <select
                  value={evidenceId}
                  onChange={(e) => setEvidenceId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">-- None (Unverified) --</option>
                  {evidenceList.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} [{ev.verificationStatus.toUpperCase()}]
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  Select a repository proof or artifact link from your Evidence Vault.
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {submitting
                    ? "Saving..."
                    : editingProject
                    ? "Update Project"
                    : "Add Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
