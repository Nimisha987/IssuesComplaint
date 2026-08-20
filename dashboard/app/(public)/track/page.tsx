"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";

export default function TrackComplaintPage() {
  const [code, setCode] = useState("");
  const [complaint, setComplaint] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setComplaint(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/complaints/by-code/${code.trim().toUpperCase()}`
      );
      if (!res.ok) throw new Error("not found");
      const data = await res.json();
      setComplaint(data);
    } catch {
      setError("No complaint found with that code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] p-6">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl font-semibold text-ink mb-2">Track Your Complaint</h1>
        <p className="text-sage text-sm mb-6 font-body">Enter your complaint code to check its status.</p>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            className="flex-1 border-2 border-ink/10 rounded-md p-3 bg-white font-mono focus:border-civic focus:outline-none"
            placeholder="CC-XXXXX"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-ink text-paper px-5 rounded-md font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
          >
            {loading ? "..." : "Track"}
          </button>
        </form>

        {error && <p className="text-hazard text-sm">{error}</p>}

        {complaint && (
          <div className="bg-panel border-2 border-ink/10 rounded-lg p-6 space-y-3">
            <div className="flex justify-between items-center">
              <p className="font-mono text-xl font-semibold text-ink">{complaint.complaint_code}</p>
              <StatusBadge status={complaint.status} />
            </div>
            <div>
              <p className="text-xs text-sage uppercase tracking-wide">Issue</p>
              <p className="text-ink capitalize">{complaint.category.replace("_", " ")}</p>
            </div>
            <div>
              <p className="text-xs text-sage uppercase tracking-wide">Description</p>
              <p className="text-ink">{complaint.description}</p>
            </div>
            <div>
              <p className="text-xs text-sage uppercase tracking-wide">Filed on</p>
              <p className="text-ink">{new Date(complaint.created_at).toLocaleDateString()}</p>
            </div>
            {complaint.resolved_at && (
              <div>
                <p className="text-xs text-sage uppercase tracking-wide">Resolved on</p>
                <p className="text-ink">{new Date(complaint.resolved_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}