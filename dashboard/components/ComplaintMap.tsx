"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { fetchMapPins } from "@/lib/api";
import { MapPin } from "@/lib/types";

const SEVERITY_COLORS: Record<string, string> = {
  severe: "#C4622D",
  medium: "#8A6D1F",
  minor: "#2D5F3E",
};

const DEFAULT_CENTER: [number, number] = [8.5241, 76.9366];

export function ComplaintMap() {
  const [pins, setPins] = useState<MapPin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPins();
  }, []);

  async function loadPins() {
    try {
      const data = await fetchMapPins();
      setPins(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-sage font-body text-sm">Loading map…</div>;

  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden border-2 border-ink/10">
      <MapContainer center={DEFAULT_CENTER} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {pins.map((pin) => (
          <CircleMarker
            key={pin.id}
            center={[pin.lat, pin.lng]}
            radius={8}
            pathOptions={{
              color: SEVERITY_COLORS[pin.severity] || "#6B7563",
              fillColor: SEVERITY_COLORS[pin.severity] || "#6B7563",
              fillOpacity: 0.7,
            }}
          >
            <Popup>
              <div className="font-body text-sm">
                <p className="font-semibold capitalize">{pin.category.replace("_", " ")}</p>
                <p className="text-sage capitalize">Severity: {pin.severity}</p>
                <p className="text-sage capitalize">Status: {pin.status}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}