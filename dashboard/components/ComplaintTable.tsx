"use client";

import { useEffect, useState } from "react";
import { fetchComplaints, updateComplaintStatus } from "@/lib/api";
import { Complaint, ComplaintFilters } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { Filters } from "./Filters";

export function ComplaintTable() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ComplaintFilters>({});

  useEffect(() => {
    loadComplaints();
  }, [filters]);

  async function loadComplaints() {
    setLoading(true);
    try {
      const data = await fetchComplaints(filters);
      setComplaints(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      await updateComplaintStatus(id, newStatus, "dashboard-user");
      loadComplaints();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <Filters filters={filters} onChange={setFilters} />

      {loading ? (
        <div className="p-8 text-center text-sage font-body text-sm">Loading complaints…</div>
      ) : complaints.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-ink/10 rounded-lg">
          <p className="font-display text-lg text-ink">No complaints yet</p>
          <p className="text-sage text-sm mt-1">Filed complaints will appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border-2 border-ink/10 rounded-lg">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-panel text-left text-xs uppercase tracking-wide text-sage">
                <th className="p-3 font-medium">Code</th>
                <th className="p-3 font-medium">Category</th>
                <th className="p-3 font-medium">Description</th>
                <th className="p-3 font-medium">Severity</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Filed</th>
                <th className="p-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {complaints.map((c) => (
                <tr key={c.id} className="text-sm border-t border-ink/5 hover:bg-panel/40 transition-colors">
                  <td className="p-3">
                    <a href={`/dashboard/${c.id}`} className="font-mono text-civic hover:underline">
                      {c.complaint_code}
                    </a>
                  </td>
                  <td className="p-3 capitalize text-ink">{c.category.replace("_", " ")}</td>
                  <td className="p-3 max-w-xs truncate text-ink/80">{c.description}</td>
                  <td className="p-3 capitalize">
                    <span className={c.severity === "severe" ? "text-hazard font-medium" : "text-ink/70"}>
                      {c.severity}
                    </span>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={c.status} />
                    {c.is_overdue && <span className="ml-2 text-xs text-hazard font-medium">⚠ Overdue</span>}
                  </td>
                  <td className="p-3 text-sage">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <select
                      className="border border-ink/10 rounded px-2 py-1 text-xs bg-white"
                      value={c.status}
                      onChange={(e) => handleStatusChange(c.id, e.target.value)}
                    >
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}