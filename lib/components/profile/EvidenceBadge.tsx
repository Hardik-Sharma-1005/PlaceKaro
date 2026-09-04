// lib/components/profile/EvidenceBadge.tsx

import React from "react";
import type { VerificationStatus } from "../../../types/database";

interface EvidenceBadgeProps {
  status: VerificationStatus;
  title?: string;
  fileUrl?: string;
  showIcon?: boolean;
}

export function EvidenceBadge({
  status,
  title,
  fileUrl,
  showIcon = true,
}: EvidenceBadgeProps) {
  const getBadgeStyle = (currentStatus: VerificationStatus) => {
    switch (currentStatus) {
      case "verified":
      case "approved":
        return {
          container: "bg-emerald-50 border-emerald-200 text-emerald-700",
          dot: "bg-emerald-500",
          label: "Verified Evidence",
        };
      case "pending":
        return {
          container: "bg-amber-50 border-amber-200 text-amber-700",
          dot: "bg-amber-500",
          label: "Verification Pending",
        };
      case "rejected":
        return {
          container: "bg-rose-50 border-rose-200 text-rose-700",
          dot: "bg-rose-500",
          label: "Rejected",
        };
      case "unverified":
      default:
        return {
          container: "bg-slate-100 border-slate-200 text-slate-600",
          dot: "bg-slate-400",
          label: "Unverified Evidence",
        };
    }
  };

  const style = getBadgeStyle(status);

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.container}`}
      title={title ? `${title} (${style.label})` : style.label}
    >
      {showIcon && (
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      )}
      <span>{title ? `${title}: ${style.label}` : style.label}</span>
      {fileUrl && (
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 text-xs opacity-75 hover:opacity-100 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          ↗
        </a>
      )}
    </div>
  );
}
