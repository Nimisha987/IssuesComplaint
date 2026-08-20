"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Complaint } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ComplaintDetailPage() {
  const params = useParams();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`${API_URL}/complaints/${params.complaintId}`);
      if (res.ok) setComplaint(await res.json());
      setLoading(false);
    }
    load();
  }, [params.complaintId]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!complaint) return <div className="p-6">Complaint not found.</div>;

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold font-mono">{complaint.complaint_code}</h1>
        <StatusBadge status={complaint.status} />
      </div>

      <div className="bg-white rounded-lg border-2 border-ink/10 p-4 space-y-3">
        <div>
          <p className="text-sm text-sage">Category</p>
          <p className="capitalize text-ink">{complaint.category.replace("_", " ")}</p>
        </div>
        <div>
          <p className="text-sm text-sage">Description</p>
          <p className="text-ink">{complaint.description}</p>
        </div>
        <div>
          <p className="text-sm text-sage">Severity</p>
          <p className="capitalize text-ink">{complaint.severity}</p>
        </div>
        {complaint.landmark_text && (
          <div>
            <p className="text-sm text-sage">Location</p>
            <p className="text-ink">{complaint.landmark_text}</p>
          </div>
        )}
        <div>
          <p className="text-sm text-sage">Photo verified</p>
          <p className="text-ink">{complaint.photo_verified ? "Yes" : "No"}</p>
        </div>
        <div>
          <p className="text-sm text-sage">Created</p>
          <p className="text-ink">{new Date(complaint.created_at).toLocaleString()}</p>
        </div>
        {complaint.resolved_at && (
          <div>
            <p className="text-sm text-sage">Resolved</p>
            <p className="text-ink">{new Date(complaint.resolved_at).toLocaleString()}</p>
          </div>
        )}
      </div>
    </main>
  );
}