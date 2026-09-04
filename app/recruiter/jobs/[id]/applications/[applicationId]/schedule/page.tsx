"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../../../../lib/context/AuthContext";
import { RoleGuard } from "../../../../../../../lib/components/RoleGuard";
import { interviewService } from "../../../../../../../lib/services/interviewService";

function ScheduleInterviewContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const jobId = params.id as string;
  const applicationId = params.applicationId as string;

  const [roundName, setRoundName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState("");
  
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !roundName || !scheduledAt) return;
    
    setSaving(true);
    try {
      await interviewService.scheduleInterview({
        applicationId,
        jobId,
        studentId: "", // Ideal implementation would fetch application to get studentId. For now, it's just a demo prop.
        recruiterId: user.uid,
        roundName,
        scheduledAt: new Date(scheduledAt).getTime(),
        meetingLink,
        location,
        status: "scheduled"
      });
      
      router.push(`/recruiter/jobs/${jobId}`);
    } catch (error) {
      console.error("Failed to schedule interview:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 p-4">
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-8 max-w-lg w-full">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Schedule Interview</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Round Name (e.g. Technical Round 1)</label>
            <input 
              type="text"
              required
              value={roundName}
              onChange={e => setRoundName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700">Date & Time</label>
            <input 
              type="datetime-local"
              required
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Meeting Link (Optional)</label>
            <input 
              type="url"
              value={meetingLink}
              onChange={e => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Location (Optional)</label>
            <input 
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Office Address / Remote"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Link
              href={`/recruiter/jobs/${jobId}`}
              className="flex-1 text-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? "Scheduling..." : "Schedule Interview"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ScheduleInterviewPage() {
  return (
    <RoleGuard allowedRoles={["company"]}>
      <ScheduleInterviewContent />
    </RoleGuard>
  );
}
