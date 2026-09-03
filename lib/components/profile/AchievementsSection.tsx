// lib/components/profile/AchievementsSection.tsx

import { useState } from "react";
import type { Achievement, Evidence } from "../../../types/database";
import {
  addStudentAchievement,
  deleteStudentAchievement,
  updateStudentAchievement,
} from "../../services/studentProfileService";
import { EvidenceBadge } from "./EvidenceBadge";

interface AchievementsSectionProps {
  studentId: string;
  achievements: Achievement[];
  evidenceList: Evidence[];
  onAchievementsUpdated: () => void;
}

const CATEGORIES = [
  "Hackathon",
  "Coding Competition",
  "Academic Honor",
  "Open Source",
  "Publication",
  "Extracurricular",
  "Other",
];

const PRESETS = [
  {
    title: "1st Place Winner - Smart India Hackathon",
    organization: "Ministry of Education & AICTE",
    category: "Hackathon",
  },
  {
    title: "ICPC Regional Finalist",
    organization: "International Collegiate Programming Contest",
    category: "Coding Competition",
  },
  {
    title: "Dean's Academic Excellence Honor Roll",
    organization: "JSS University Noida",
    category: "Academic Honor",
  },
];

export function AchievementsSection({
  studentId,
  achievements,
  evidenceList,
  onAchievementsUpdated,
}: AchievementsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Achievement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    organization: "",
    date: "",
    category: CATEGORIES[0],
    evidenceId: "",
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      organization: "",
      date: new Date().toISOString().split("T")[0],
      category: CATEGORIES[0],
      evidenceId: "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Achievement) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      organization: item.organization,
      date: item.date || "",
      category: item.category || CATEGORIES[0],
      evidenceId: item.evidenceId || "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleApplyPreset = (preset: (typeof PRESETS)[0]) => {
    setFormData((prev) => ({
      ...prev,
      title: preset.title,
      organization: preset.organization,
      category: preset.category,
    }));
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.organization.trim()) {
      setError("Please enter achievement title and hosting organization.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingItem) {
        await updateStudentAchievement(editingItem.id, {
          title: formData.title.trim(),
          organization: formData.organization.trim(),
          date: formData.date.trim() || undefined,
          category: formData.category,
          evidenceId: formData.evidenceId || undefined,
        });
      } else {
        await addStudentAchievement(studentId, {
          title: formData.title.trim(),
          organization: formData.organization.trim(),
          date: formData.date.trim() || undefined,
          category: formData.category,
          evidenceId: formData.evidenceId || undefined,
        });
      }

      setIsModalOpen(false);
      onAchievementsUpdated();
    } catch (err) {
      console.error("Failed to save achievement:", err);
      setError("Failed to save achievement. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove "${title}"?`)) {
      return;
    }
    try {
      await deleteStudentAchievement(id);
      onAchievementsUpdated();
    } catch (err) {
      console.error("Failed to delete achievement:", err);
      alert("Failed to delete achievement record.");
    }
  };

  const verifiedCount = achievements.filter((item) => {
    if (!item.evidenceId) return false;
    const ev = evidenceList.find((e) => e.id === item.evidenceId);
    return ev?.verificationStatus === "verified" || ev?.verificationStatus === "approved";
  }).length;

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-950">Achievements & Honors</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {achievements.length} {achievements.length === 1 ? "achievement" : "achievements"}
            </span>
            {verifiedCount > 0 && (
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {verifiedCount} verified
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Hackathon wins, competitive programming ranks, research publications, and recognized honors.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <span>+ Add Achievement</span>
        </button>
      </div>

      {achievements.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-700">No achievements added yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Add hackathon awards, competition rankings, or academic honors.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((item) => {
            const attachedEvidence = item.evidenceId
              ? evidenceList.find((e) => e.id === item.evidenceId)
              : undefined;

            return (
              <div
                key={item.id}
                className="group flex flex-col justify-between rounded-xl border border-slate-200 p-5 transition hover:border-slate-300 hover:shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {item.title}
                      </h3>
                      <p className="mt-0.5 text-xs font-medium text-slate-600">
                        {item.organization}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                      {item.category}
                    </span>
                  </div>

                  {item.date && (
                    <p className="mt-2 text-xs text-slate-400">
                      Awarded: {item.date}
                    </p>
                  )}

                  <div className="mt-3">
                    {attachedEvidence ? (
                      <EvidenceBadge
                        status={attachedEvidence.verificationStatus}
                        title={attachedEvidence.title}
                        fileUrl={attachedEvidence.fileUrl}
                      />
                    ) : (
                      <span className="inline-block rounded-full border border-dashed border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-400">
                        No certificate / award proof linked
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    Edit
                  </button>
                  <span className="text-slate-200">•</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.title)}
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                {editingItem ? "Edit Achievement" : "Add Achievement / Honor"}
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

            {/* Quick Presets */}
            {!editingItem && (
              <div className="mt-3">
                <p className="text-[11px] font-medium text-slate-400">
                  Quick demo presets:
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {PRESETS.map((p) => (
                    <button
                      key={p.title}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-200"
                    >
                      🏆 {p.title.split(" - ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Achievement / Honor Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 1st Place Winner - National Hackathon"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Hosting Organization / Event
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Ministry of Education / TechFest"
                  value={formData.organization}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      organization: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    Date Received
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Attach Evidence (Certificate / Proof of Award)
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
                  Link an official award proof or certificate from your Evidence Vault.
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
                  {submitting ? "Saving..." : editingItem ? "Update Achievement" : "Add Achievement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
