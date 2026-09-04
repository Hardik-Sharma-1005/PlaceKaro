// lib/components/profile/EvidenceSection.tsx

import { useState } from "react";
import type { Evidence } from "../../../types/database";
import {
  addStudentEvidence,
  deleteStudentEvidence,
  updateStudentEvidence,
} from "../../services/studentProfileService";
import { EvidenceBadge } from "./EvidenceBadge";

interface EvidenceSectionProps {
  studentId: string;
  evidenceList: Evidence[];
  onEvidenceUpdated: () => void;
}

const EVIDENCE_TYPES = [
  { value: "certificate", label: "Certificate" },
  { value: "project", label: "Project Code / Artifact" },
  { value: "internship", label: "Internship Letter" },
  { value: "achievement", label: "Competition / Award Proof" },
  { value: "transcript", label: "Academic Transcript" },
  { value: "other", label: "Other Document" },
];

const PRESETS = [
  {
    title: "AWS Cloud Solutions Architect Certificate",
    type: "certificate",
    fileUrl: "https://aws.amazon.com/verification/AWS-SAA-884920",
  },
  {
    title: "Placement Intelligence Platform GitHub Repo",
    type: "project",
    fileUrl: "https://github.com/Hardik-Sharma-1005/PlaceKaro",
  },
  {
    title: "TechNova Labs Internship Completion Letter",
    type: "internship",
    fileUrl: "https://example.com/letters/technova-internship.pdf",
  },
  {
    title: "National Hackathon 1st Place Certificate",
    type: "achievement",
    fileUrl: "https://example.com/certificates/hackathon-winner.pdf",
  },
];

export function EvidenceSection({
  studentId,
  evidenceList,
  onEvidenceUpdated,
}: EvidenceSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState<Evidence | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  const [formData, setFormData] = useState({
    title: "",
    type: "certificate",
    fileUrl: "",
  });

  const handleOpenAdd = () => {
    setEditingEvidence(null);
    setFormData({
      title: "",
      type: "certificate",
      fileUrl: "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (evidence: Evidence) => {
    setEditingEvidence(evidence);
    setFormData({
      title: evidence.title,
      type: evidence.type,
      fileUrl: evidence.fileUrl || "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleApplyPreset = (preset: (typeof PRESETS)[0]) => {
    setFormData({
      title: preset.title,
      type: preset.type,
      fileUrl: preset.fileUrl,
    });
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingEvidence(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError("Please enter a title for this evidence record.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingEvidence) {
        await updateStudentEvidence(editingEvidence.id, {
          title: formData.title.trim(),
          type: formData.type.trim(),
          fileUrl: formData.fileUrl.trim() || undefined,
        });
      } else {
        // Newly added records strictly default to 'unverified' to prevent false claims
        await addStudentEvidence(studentId, {
          title: formData.title.trim(),
          type: formData.type.trim(),
          fileUrl: formData.fileUrl.trim() || undefined,
          verificationStatus: "unverified",
        });
      }

      setIsModalOpen(false);
      onEvidenceUpdated();
    } catch (err) {
      console.error("Failed to save evidence:", err);
      setError("Failed to save evidence. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (evidenceId: string, title: string) => {
    if (
      !window.confirm(
        `Are you sure you want to remove "${title}" from your Evidence Vault? This will unlink it from attached profile items.`
      )
    ) {
      return;
    }

    try {
      await deleteStudentEvidence(evidenceId);
      onEvidenceUpdated();
    } catch (err) {
      console.error("Failed to delete evidence:", err);
      alert("Failed to delete evidence record.");
    }
  };

  // Filter evidence by type
  const filteredEvidence =
    filterType === "all"
      ? evidenceList
      : evidenceList.filter((e) => e.type.toLowerCase() === filterType.toLowerCase());

  // Statistics
  const verifiedCount = evidenceList.filter(
    (e) => e.verificationStatus === "verified" || e.verificationStatus === "approved"
  ).length;

  const unverifiedCount = evidenceList.length - verifiedCount;

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {/* Section Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-950">
              Evidence Vault & Verification Layer
            </h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {evidenceList.length} {evidenceList.length === 1 ? "record" : "records"}
            </span>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              {verifiedCount} verified
            </span>
            {unverifiedCount > 0 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                {unverifiedCount} unverified
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Institutional verification vault for certificates, GitHub repositories, and official completion letters.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <span>+ Add Evidence Record</span>
        </button>
      </div>

      {/* Verification Transparency Notice */}
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
            ℹ
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900">
              PlaceKaro Verification Integrity Standard
            </p>
            <p className="mt-0.5 text-xs leading-5 text-slate-600">
              Records marked <strong className="text-emerald-700 font-semibold">Verified Evidence</strong> have undergone institutional credential audit, automated third-party validation, or Placement Cell approval. Newly uploaded documents start as <strong className="text-slate-700 font-semibold">Unverified Evidence</strong> until audited, strictly guaranteeing candidate data honesty for recruiters.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      {evidenceList.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-1.5 border-b border-slate-100 pb-3">
          {[
            { id: "all", label: "All Records" },
            { id: "certificate", label: "Certificates" },
            { id: "project", label: "Project Repos" },
            { id: "internship", label: "Internship Letters" },
            { id: "achievement", label: "Awards" },
            { id: "transcript", label: "Transcripts" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                filterType === tab.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Evidence Cards Grid */}
      {filteredEvidence.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-700">
            {filterType === "all"
              ? "No evidence records uploaded yet"
              : `No evidence found under "${filterType}"`}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Upload supporting artifacts to link them to your skills, projects, and achievements.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvidence.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 p-5 transition hover:border-slate-300 hover:shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                    {item.type}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="text-xs font-medium text-slate-500 hover:text-slate-900"
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

                <h3 className="mt-2.5 text-sm font-semibold text-slate-900">
                  {item.title}
                </h3>

                {item.fileUrl && (
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex max-w-full items-center gap-1 truncate text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    title={item.fileUrl}
                  >
                    <span className="truncate">{item.fileUrl}</span>
                    <span className="shrink-0 text-[10px]">↗</span>
                  </a>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <EvidenceBadge
                  status={item.verificationStatus}
                  fileUrl={item.fileUrl}
                />

                <span className="text-[11px] text-slate-400">
                  {new Date(item.uploadedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Evidence Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                {editingEvidence ? "Edit Evidence Record" : "Add Evidence Record"}
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

            {/* Quick Presets for Demo */}
            {!editingEvidence && (
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
                      📎 {p.title.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Evidence Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Coursera Deep Learning Certificate"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Artifact Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  {EVIDENCE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Document / Verification Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/... or https://drive.google.com/..."
                  value={formData.fileUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fileUrl: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Provide a publicly auditable URL or document link.
                </p>
              </div>

              {!editingEvidence && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  Newly added evidence is labeled as <strong>Unverified Evidence</strong> until audited by placement authorities or verified credential issuers.
                </div>
              )}

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
                    : editingEvidence
                    ? "Update Record"
                    : "Save to Vault"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
