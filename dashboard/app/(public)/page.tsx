import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] gap-4 p-6 text-center">
      <p className="stamp text-civic mb-2">Civic Complaints</p>
      <h1 className="font-display text-4xl font-semibold text-ink">Report a Civic Issue</h1>
      <p className="text-sage max-w-md font-body">
        Streetlight, garbage, pothole, water leak, or drainage — file a complaint and track it through resolution.
      </p>
      <div className="flex gap-4 mt-6 flex-wrap justify-center">
        <Link href="/submit" className="bg-ink text-paper px-6 py-3 rounded-md font-medium hover:bg-ink/90 transition-colors">
          Report an issue
        </Link>
        <Link href="/track" className="border-2 border-ink/10 text-ink px-6 py-3 rounded-md font-medium hover:border-civic transition-colors">
          Track a complaint
        </Link>
      </div>
    </main>
  );
}