// lib/components/profile/SkillsSection.tsx

import { useState } from "react";
import type { Evidence, Skill } from "../../../types/database";
import {
  addStudentSkill,
  deleteStudentSkill,
  updateStudentSkill,
} from "../../services/studentProfileService";
import { EvidenceBadge } from "./EvidenceBadge";

interface SkillsSectionProps {
  studentId: string;
  skills: Skill[];
  evidenceList: Evidence[];
  onSkillsUpdated: () => void;
}

const CATEGORIES = [
  "Programming",
  "Web Development",
  "Mobile Development",
  "AI & Machine Learning",
  "Cloud & DevOps",
  "Database & Systems",
  "Computer Science",
  "Soft Skills",
];

const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

// Quick suggestion chips for rapid portfolio addition during demo
const SUGGESTIONS: { name: string; category: string; level: string }[] = [
  { name: "Python", category: "Programming", level: "Advanced" },
  { name: "TypeScript", category: "Web Development", level: "Intermediate" },
  { name: "React", category: "Web Development", level: "Advanced" },
  { name: "Data Structures & Algorithms", category: "Computer Science", level: "Advanced" },
  { name: "Node.js", category: "Web Development", level: "Intermediate" },
  { name: "SQL", category: "Database & Systems", level: "Intermediate" },
  { name: "Docker", category: "Cloud & DevOps", level: "Intermediate" },
  { name: "AWS", category: "Cloud & DevOps", level: "Beginner" },
  { name: "Machine Learning", category: "AI & Machine Learning", level: "Intermediate" },
];

export function SkillsSection({
  studentId,
  skills,
  evidenceList,
  onSkillsUpdated,
}: SkillsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("All");

  const [formData, setFormData] = useState({
    name: "",
    category: CATEGORIES[0],
    level: LEVELS[1], // default "Intermediate"
    evidenceId: "",
  });

  const handleOpenAdd = () => {
    setEditingSkill(null);
    setFormData({
      name: "",
      category: CATEGORIES[0],
      level: LEVELS[1],
      evidenceId: "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setFormData({
      name: skill.name,
      category: skill.category,
      level: skill.level,
      evidenceId: skill.evidenceIds?.[0] || "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleApplySuggestion = (s: { name: string; category: string; level: string }) => {
    setFormData((prev) => ({
      ...prev,
      name: s.name,
      category: s.category,
      level: s.level,
    }));
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingSkill(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Please enter a skill name.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const evidenceIds = formData.evidenceId ? [formData.evidenceId] : undefined;

      if (editingSkill) {
        await updateStudentSkill(editingSkill.id, {
          name: formData.name.trim(),
          category: formData.category,
          level: formData.level,
          evidenceIds,
        });
      } else {
        await addStudentSkill(studentId, {
          name: formData.name.trim(),
          category: formData.category,
          level: formData.level,
          evidenceIds,
        });
      }

      setIsModalOpen(false);
      onSkillsUpdated();
    } catch (err) {
      console.error("Failed to save skill:", err);
      setError("Failed to save skill. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (skillId: string, name: string) => {
    if (
      !window.confirm(
        `Are you sure you want to remove "${name}" from your skills portfolio?`
      )
    ) {
      return;
    }

    try {
      await deleteStudentSkill(skillId);
      onSkillsUpdated();
    } catch (err) {
      console.error("Failed to delete skill:", err);
      alert("Failed to delete skill.");
    }
  };

  // Filter skills based on selected category pill
  const filteredSkills =
    filterCategory === "All"
      ? skills
      : skills.filter((s) => s.category.toLowerCase().includes(filterCategory.toLowerCase()));

  // Count skills with verified evidence
  const verifiedSkillsCount = skills.filter((s) => {
    if (!s.evidenceIds?.length) return false;
    const ev = evidenceList.find((e) => e.id === s.evidenceIds![0]);
    return ev?.verificationStatus === "verified" || ev?.verificationStatus === "approved";
  }).length;

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-950">Skills & Competencies</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {skills.length} {skills.length === 1 ? "skill" : "skills"}
            </span>
            {verifiedSkillsCount > 0 && (
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {verifiedSkillsCount} verified
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Technical proficiencies backed by verified project code and certificates.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <span>+ Add Skill</span>
        </button>
      </div>

      {/* Category Pills Filter */}
      {skills.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-1.5 border-b border-slate-100 pb-3">
          {["All", "Programming", "Web Development", "AI & Machine Learning", "Cloud & DevOps", "Computer Science"].map(
            (cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                  filterCategory === cat
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>
      )}

      {/* Skills Grid */}
      {filteredSkills.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-700">
            {filterCategory === "All"
              ? "No skills added yet"
              : `No skills found in "${filterCategory}"`}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Click "+ Add Skill" to start showcasing your technical strengths.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSkills.map((skill) => {
            const attachedEvidence = skill.evidenceIds?.length
              ? evidenceList.find((e) => e.id === skill.evidenceIds![0])
              : undefined;

            return (
              <div
                key={skill.id}
                className="group flex flex-col justify-between rounded-xl border border-slate-200 p-5 transition hover:border-slate-300 hover:shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {skill.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {skill.category}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        skill.level === "Advanced" || skill.level === "Expert"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {skill.level}
                    </span>
                  </div>

                  {/* Evidence Display */}
                  {attachedEvidence ? (
                    <div className="mt-3">
                      <EvidenceBadge
                        status={attachedEvidence.verificationStatus}
                        title={attachedEvidence.title}
                        fileUrl={attachedEvidence.fileUrl}
                      />
                    </div>
                  ) : (
                    <div className="mt-3">
                      <span className="inline-block rounded-full bg-slate-50 border border-dashed border-slate-200 px-2.5 py-0.5 text-[11px] text-slate-400">
                        No evidence linked
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(skill)}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    Edit
                  </button>
                  <span className="text-slate-200">•</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(skill.id, skill.name)}
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Skill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                {editingSkill ? "Edit Skill" : "Add New Skill"}
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

            {/* Suggestions for quick demo insertion */}
            {!editingSkill && (
              <div className="mt-3">
                <p className="text-[11px] font-medium text-slate-400">
                  Quick suggestions:
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {SUGGESTIONS.slice(0, 6).map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => handleApplySuggestion(s)}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-200"
                    >
                      + {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Skill Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Python, React, PostgreSQL"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Proficiency Level
                </label>
                <select
                  value={formData.level}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, level: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  {LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Attach Evidence (Optional)
                </label>
                <select
                  value={formData.evidenceId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      evidenceId: e.target.value,
                    }))
                  }
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
                  Attach a verified certificate or code artifact to back up this skill.
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
                    : editingSkill
                    ? "Update Skill"
                    : "Add Skill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
