"use client";

import { useState } from "react";

const CATEGORY_LABELS: Record<string, string> = {
  streetlight: "Streetlight",
  garbage: "Garbage",
  pothole: "Pothole",
  water_leakage: "Water Leakage",
  drainage: "Drainage",
};

export default function SubmitComplaintPage() {
  const [transcript, setTranscript] = useState("");
  const [landmark, setLandmark] = useState("");
  const [phone, setPhone] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [complaintCode, setComplaintCode] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [detectedCategory, setDetectedCategory] = useState<string | null>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

  async function autoFillFromTranscript(text: string) {
    if (!text.trim()) return;
    setIsParsing(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/complaints/parse-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.landmark_guess && !landmark) {
          setLandmark(data.landmark_guess);
        }
        if (data.category_guess) {
          setDetectedCategory(data.category_guess);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsParsing(false);
    }
  }

  function startVoiceInput() {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser. Try Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript((prev) => {
        const updated = prev ? prev + " " + text : text;
        autoFillFromTranscript(updated);
        return updated;
      });
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      let photoUrl: string | undefined;

      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads/photo`, {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          photoUrl = uploadData.photo_url;
        }
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/complaints/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_transcript: transcript,
          whatsapp_number: phone || "web-submission",
          landmark_text: landmark,
          photo_url: photoUrl,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");
      const data = await res.json();
      setComplaintCode(data.complaint_code);
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <main className="flex flex-col items-center justify-center min-h-[80vh] p-6">
        <div className="bg-panel border-2 border-ink/10 rounded-lg p-8 max-w-sm w-full text-center relative">
          <p className="font-body text-xs uppercase tracking-widest text-sage mb-2">Complaint Filed</p>
          <div className="ticket-stub my-4" />
          <p className="font-mono text-3xl font-medium text-ink tracking-wide">{complaintCode}</p>
          <p className="text-sage text-sm mt-3 font-body">Save this code to check status anytime</p>
          <button
            onClick={() => {
              setStatus("idle");
              setTranscript("");
              setLandmark("");
              setPhone("");
              setPhotoFile(null);
              setPhotoPreview(null);
              setDetectedCategory(null);
            }}
            className="mt-6 w-full bg-civic text-paper py-3 rounded-md font-medium hover:bg-civic/90 transition-colors"
          >
            Report another issue
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Report an issue</h1>
          <p className="text-sage text-sm mt-1 font-body">
            Speak the whole complaint — we'll try to fill in the details for you.
          </p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-ink">What's the issue?</label>
            <button
              type="button"
              onClick={startVoiceInput}
              className={`text-xs px-2 py-1 rounded ${isListening ? "bg-hazard text-paper" : "bg-panel text-ink"}`}
            >
              {isListening ? "Listening..." : "Speak"}
            </button>
          </div>
          <textarea
            className="w-full border-2 border-ink/10 rounded-md p-3 bg-white focus:border-civic focus:outline-none transition-colors"
            rows={4}
            required
            placeholder="e.g. Streetlight kharab hai 3 din se, MG Road ke paas, bahut andhera hai"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onBlur={() => autoFillFromTranscript(transcript)}
          />
          {isParsing && <p className="text-xs text-sage mt-1">Filling in details...</p>}
          {detectedCategory && !isParsing && (
            <p className="text-xs text-civic mt-1">
              Detected: {CATEGORY_LABELS[detectedCategory] || detectedCategory}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-ink block mb-1">Add a photo (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="w-full text-sm text-sage file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-panel file:text-ink"
          />
          {photoPreview && (
            <img src={photoPreview} alt="Preview" className="mt-2 rounded-md max-h-40 border-2 border-ink/10" />
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-ink block mb-1">
            Where is it? {landmark && <span className="text-civic text-xs">(auto-filled — edit if needed)</span>}
          </label>
          <input
            className="w-full border-2 border-ink/10 rounded-md p-3 bg-white focus:border-civic focus:outline-none transition-colors"
            placeholder="e.g. Near MG Road"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink block mb-1">Phone (optional)</label>
          <input
            className="w-full border-2 border-ink/10 rounded-md p-3 bg-white focus:border-civic focus:outline-none transition-colors"
            placeholder="9999999999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full bg-ink text-paper py-3 rounded-md font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "Filing complaint..." : "File complaint"}
        </button>

        {status === "error" && (
          <p className="text-hazard text-sm">Couldn't submit — check your connection and try again.</p>
        )}
      </form>
    </main>
  );
}