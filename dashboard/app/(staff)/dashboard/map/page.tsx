import dynamicImport from "next/dynamic";

export const dynamic = "force-dynamic";

const ComplaintMap = dynamicImport(
  () => import("@/components/ComplaintMap").then((mod) => mod.ComplaintMap),
  { ssr: false }
);

export default function MapPage() {
  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="font-display text-3xl font-semibold text-ink mb-4">Complaint Map</h1>
      <ComplaintMap />
    </main>
  );
}