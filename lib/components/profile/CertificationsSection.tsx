// lib/components/profile/CertificationsSection.tsx

import { useState } from "react";
import type { Certification, Evidence } from "../../../types/database";
import {
  addStudentCertification,
  deleteStudentCertification,
  updateStudentCertification,
} from "../../services/studentProfileService";
import { EvidenceBadge } from "./EvidenceBadge";

interface CertificationsSectionProps {
  studentId: string;
  certifications: Certification[];
  evidenceList: Evidence[];
  onCertificationsUpdated: () => void;
}

const PRESETS = [
  {
    title: "AWS Certified Solutions Architect - Associate",
    issuer: "Amazon Web Services (AWS)",
    credentialId: "AWS-SAA-884920",
  },
  {
    title: "Google Cloud Professional Data Engineer",
    issuer: "Google Cloud",
    credentialId: "GCP-PDE-10294",
  },
  {
    title: "Deep Learning Specialization",
    issuer: "DeepLearning.AI / Coursera",
    credentialId: "COURSERA-DL-994",
  },
  {
    title: "Meta Front-End Developer Professional Certificate",
    issuer: "Meta",
    credentialId: "META-FED-55102",
  },
];

export function CertificationsSection({
  studentId,
  certifications,
  evidenceList,
  onCertificationsUpdated,
}: CertificationsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Certification | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    issuer: "",
    issueDate: "",
    credentialId: "",
    evidenceId: "",
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      issuer: "",
      issueDate: new Date().toISOString().split("T")[0],
      credentialId: "",
      evidenceId: "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Certification) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      issuer: item.issuer,
      issueDate: item.issueDate || "",
      credentialId: item.credentialId || "",
      evidenceId: item.evidenceId || "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleApplyPreset = (preset: (typeof PRESETS)[0]) => {
    setFormData((prev) => ({
      ...prev,
      title: preset.title,
      issuer: preset.issuer,
      credentialId: preset.credentialId,
    }));
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.issuer.trim()) {
      setError("Please enter the certification title and issuer.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingItem) {
        await updateStudentCertification(editingItem.id, {
          title: formData.title.trim(),
          issuer: formData.issuer.trim(),
          issueDate: formData.issueDate.trim() || undefined,
          credentialId: formData.credentialId.trim() || undefined,
          evidenceId: formData.evidenceId || undefined,
        });
      } else {
        await addStudentCertification(studentId, {
          title: formData.title.trim(),
          issuer: formData.issuer.trim(),
          issueDate: formData.issueDate.trim() || undefined,
          credentialId: formData.credentialId.trim() || undefined,
          evidenceId: formData.evidenceId || undefined,
        });
      }

      setIsModalOpen(false);
      onCertificationsUpdated();
    } catch (err) {
      console.error("Failed to save certification:", err);
      setError("Failed to save certification. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove "${title}"?`)) {
      return;
    }
    try {
      await deleteStudentCertification(id);
      onCertificationsUpdated();
    } catch (err) {
      console.error("Failed to delete certification:", err);
      alert("Failed to delete certification record.");
    }
  };

  const verifiedCount = certifications.filter((item) => {
    if (!item.evidenceId) return false;
    const ev = evidenceList.find((e) => e.id === item.evidenceId);
    return ev?.verificationStatus === "verified" || ev?.verificationStatus === "approved";
  }).length;

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-950">Certifications & Licenses</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {certifications.length} {certifications.length === 1 ? "certificate" : "certificates"}
            </span>
            {verifiedCount > 0 && (
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {verifiedCount} verified
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Industry credentials, professional cloud exams, and verified specialized coursework.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <span>+ Add Certification</span>
        </button>
      </div>

      {certifications.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-700">No certifications added yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Showcase certifications from AWS, Google Cloud, Coursera, or industry bodies.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certifications.map((item) => {
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
                        {item.issuer}
                      </p>
                    </div>

                    {item.issueDate && (
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {item.issueDate}
                      </span>
                    )}
                  </div>

                  {item.credentialId && (
                    <p className="mt-2 text-xs text-slate-500">
                      ID: <span className="font-mono text-slate-800">{item.credentialId}</span>
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
                        No certificate file attached
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
                {editingItem ? "Edit Certification" : "Add Certification"}
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
                  Quick presets:
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {PRESETS.map((p) => (
                    <button
                      key={p.title}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-200"
                    >
                      + {p.title.split(" - ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Certification Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., AWS Certified Solutions Architect"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Issuing Organization
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Amazon Web Services, Google, Coursera"
                  value={formData.issuer}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, issuer: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, issueDate: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Credential ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., AWS-SAA-10293"
                    value={formData.credentialId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        credentialId: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Attach Evidence (PDF / Certificate proof)
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
                  Attach an uploaded certificate record to display verified authenticity.
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
                  {submitting ? "Saving..." : editingItem ? "Update Certificate" : "Add Certificate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
