// lib/components/profile/InternshipsSection.tsx

import { useState } from "react";
import type { Evidence, Internship } from "../../../types/database";
import {
  addStudentInternship,
  deleteStudentInternship,
  updateStudentInternship,
} from "../../services/studentProfileService";
import { EvidenceBadge } from "./EvidenceBadge";

interface InternshipsSectionProps {
  studentId: string;
  internships: Internship[];
  evidenceList: Evidence[];
  onInternshipsUpdated: () => void;
}

const TEMPLATES = [
  {
    organization: "TechNova Labs",
    role: "Software Engineering Intern",
    startDate: "May 2025",
    endDate: "Jul 2025",
    description:
      "Contributed to high-throughput backend APIs and internal web dashboards. Automated data sync pipelines reducing latency by 25%.",
  },
  {
    organization: "DataSphere AI",
    role: "Machine Learning Intern",
    startDate: "Jan 2025",
    endDate: "Apr 2025",
    description:
      "Built feature extraction pipelines and evaluated baseline classification models on student assessment datasets.",
  },
];

export function InternshipsSection({
  studentId,
  internships,
  evidenceList,
  onInternshipsUpdated,
}: InternshipsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Internship | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    organization: "",
    role: "",
    startDate: "",
    endDate: "",
    description: "",
    evidenceId: "",
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      organization: "",
      role: "",
      startDate: "",
      endDate: "",
      description: "",
      evidenceId: "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Internship) => {
    setEditingItem(item);
    setFormData({
      organization: item.organization,
      role: item.role,
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      description: item.description,
      evidenceId: item.evidenceIds?.[0] || "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleApplyTemplate = (tmpl: (typeof TEMPLATES)[0]) => {
    setFormData({
      organization: tmpl.organization,
      role: tmpl.role,
      startDate: tmpl.startDate,
      endDate: tmpl.endDate,
      description: tmpl.description,
      evidenceId: "",
    });
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.organization.trim() || !formData.role.trim()) {
      setError("Please enter the organization name and your role.");
      return;
    }
    if (!formData.description.trim()) {
      setError("Please describe your responsibilities and achievements.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const evidenceIds = formData.evidenceId ? [formData.evidenceId] : undefined;

      if (editingItem) {
        await updateStudentInternship(editingItem.id, {
          organization: formData.organization.trim(),
          role: formData.role.trim(),
          startDate: formData.startDate.trim() || undefined,
          endDate: formData.endDate.trim() || undefined,
          description: formData.description.trim(),
          evidenceIds,
        });
      } else {
        await addStudentInternship(studentId, {
          organization: formData.organization.trim(),
          role: formData.role.trim(),
          startDate: formData.startDate.trim() || undefined,
          endDate: formData.endDate.trim() || undefined,
          description: formData.description.trim(),
          evidenceIds,
        });
      }

      setIsModalOpen(false);
      onInternshipsUpdated();
    } catch (err) {
      console.error("Failed to save internship:", err);
      setError("Failed to save internship. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, org: string) => {
    if (!window.confirm(`Are you sure you want to remove your internship at "${org}"?`)) {
      return;
    }
    try {
      await deleteStudentInternship(id);
      onInternshipsUpdated();
    } catch (err) {
      console.error("Failed to delete internship:", err);
      alert("Failed to delete internship record.");
    }
  };

  const verifiedCount = internships.filter((item) => {
    if (!item.evidenceIds?.length) return false;
    const ev = evidenceList.find((e) => e.id === item.evidenceIds![0]);
    return ev?.verificationStatus === "verified" || ev?.verificationStatus === "approved";
  }).length;

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-950">Internships & Professional Experience</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {internships.length} {internships.length === 1 ? "experience" : "experiences"}
            </span>
            {verifiedCount > 0 && (
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {verifiedCount} verified
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Industry employment history, research internships, and verifiable company experience.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <span>+ Add Internship</span>
        </button>
      </div>

      {internships.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-700">No internships added yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Add industry internships or practical training experiences to strengthen your recruiter profile.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {internships.map((item) => {
            const attachedEvidence = item.evidenceIds?.length
              ? evidenceList.find((e) => e.id === item.evidenceIds![0])
              : undefined;

            return (
              <article
                key={item.id}
                className="group rounded-xl border border-slate-200 p-6 transition hover:border-slate-300 hover:shadow-xs"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-950">
                        {item.role}
                      </h3>
                      <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        {item.organization}
                      </span>
                    </div>

                    {(item.startDate || item.endDate) && (
                      <p className="mt-1 text-xs text-slate-400">
                        {item.startDate || "Start"} → {item.endDate || "Present"}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                      Edit
                    </button>
                    <span className="text-slate-200">•</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.organization)}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div>
                    {attachedEvidence ? (
                      <EvidenceBadge
                        status={attachedEvidence.verificationStatus}
                        title={attachedEvidence.title}
                        fileUrl={attachedEvidence.fileUrl}
                      />
                    ) : (
                      <span className="inline-block rounded-full border border-dashed border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-400">
                        No completion letter linked
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-400">Industry Experience</span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                {editingItem ? "Edit Internship" : "Add Internship Experience"}
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

            {/* Quick Demo Templates */}
            {!editingItem && (
              <div className="mt-3">
                <p className="text-[11px] font-medium text-slate-400">
                  Quick demo templates:
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.role}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-200"
                    >
                      ⚡ {tmpl.role} @ {tmpl.organization}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Organization / Company
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., TechNova Labs, Google, Microsoft"
                  value={formData.organization}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, organization: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Role / Position
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Software Engineering Intern"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, role: e.target.value }))
                  }
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
                    placeholder="e.g., May 2025"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    End Date
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., July 2025 or Present"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Description of Work & Contributions
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your daily responsibilities, tools used, and measurable results..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Attach Evidence (Offer Letter / Certificate)
                </label>
                <select
                  value={formData.evidenceId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, evidenceId: e.target.value }))
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
                  Link an official document from your Evidence Vault for institutional verification.
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
                  {submitting ? "Saving..." : editingItem ? "Update Internship" : "Add Internship"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
