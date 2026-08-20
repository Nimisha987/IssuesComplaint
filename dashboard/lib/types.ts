export type ComplaintCategory =
  | "streetlight"
  | "garbage"
  | "pothole"
  | "water_leakage"
  | "drainage";

export type Severity = "minor" | "medium" | "severe";

export type ComplaintStatus =
  | "received"
  | "verified"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "duplicate";

export interface Complaint {
  id: string;
  complaint_code: string;
  category: ComplaintCategory;
  description: string;
  severity: Severity;
  status: ComplaintStatus;
  photo_verified: boolean;
  is_overdue?: boolean;
  latitude: number | null;
  longitude: number | null;
  landmark_text: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface ComplaintFilters {
  category?: ComplaintCategory | "";
  status?: ComplaintStatus | "";
  severity?: Severity | "";
  ward?: string;
}

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  category: ComplaintCategory;
  severity: Severity;
  status: ComplaintStatus;
}

export interface AnalyticsSummary {
  total_complaints: number;
  resolved: number;
  open: number;
  overdue: number;
  avg_resolution_hours: number | null;
  last_7_days: number;
  by_category: Record<string, number>;
}