"use client";

import { ComplaintFilters } from "@/lib/types";

interface FiltersProps {
  filters: ComplaintFilters & { search?: string };
  onChange: (filters: ComplaintFilters & { search?: string }) => void;
}

const CATEGORIES = ["streetlight", "garbage", "pothole", "water_leakage", "drainage"];
const STATUSES = ["received", "verified", "assigned", "in_progress", "resolved", "duplicate"];
const SEVERITIES = ["minor", "medium", "severe"];

export function Filters({ filters, onChange }: FiltersProps) {
  function update(key: string, value: string) {
    onChange({ ...filters, [key]: value });
  }

  function clearAll() {
    onChange({});
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4 items-center">
      <input
        className="border border-ink/10 rounded px-3 py-1 text-sm bg-white min-w-[200px]"
        placeholder="Search description, location, code..."
        value={filters.search || ""}
        onChange={(e) => update("search", e.target.value)}
      />

      <select
        className="border border-ink/10 rounded px-2 py-1 text-sm bg-white"
        value={filters.category || ""}
        onChange={(e) => update("category", e.target.value)}
      >
        <option value="">All Categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{c.replace("_", " ")}</option>
        ))}
      </select>

      <select
        className="border border-ink/10 rounded px-2 py-1 text-sm bg-white"
        value={filters.status || ""}
        onChange={(e) => update("status", e.target.value)}
      >
        <option value="">All Statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s.replace("_", " ")}</option>
        ))}
      </select>

      <select
        className="border border-ink/10 rounded px-2 py-1 text-sm bg-white"
        value={filters.severity || ""}
        onChange={(e) => update("severity", e.target.value)}
      >
        <option value="">All Severities</option>
        {SEVERITIES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {(filters.category || filters.status || filters.severity || filters.search) && (
        <button onClick={clearAll} className="text-sm text-civic hover:underline">
          Clear filters
        </button>
      )}
    </div>
  );
}