import { Complaint, ComplaintFilters, MapPin, AnalyticsSummary } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchComplaints(filters?: ComplaintFilters): Promise<Complaint[]> {
  const cleanParams: Record<string, string> = {};
  if (filters?.category) cleanParams.category = filters.category;
  if (filters?.status) cleanParams.status = filters.status;
  if (filters?.severity) cleanParams.severity = filters.severity;
  if (filters?.ward) cleanParams.ward = filters.ward;

  const params = new URLSearchParams(cleanParams);
  const res = await fetch(`${API_URL}/complaints/?${params}`);
  if (!res.ok) throw new Error("Failed to fetch complaints");
  return res.json();
}

export async function updateComplaintStatus(
  id: string,
  newStatus: string,
  changedBy: string,
  note?: string
): Promise<Complaint> {
  const res = await fetch(`${API_URL}/complaints/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_status: newStatus, changed_by: changedBy, note }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}

export async function fetchMapPins(): Promise<MapPin[]> {
  const res = await fetch(`${API_URL}/complaints/map/pins`);
  if (!res.ok) throw new Error("Failed to fetch map pins");
  return res.json();
}

export async function fetchComplaintById(id: string): Promise<Complaint> {
  const res = await fetch(`${API_URL}/complaints/${id}`);
  if (!res.ok) throw new Error("Complaint not found");
  return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsSummary> {
  const res = await fetch(`${API_URL}/analytics/summary`);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}