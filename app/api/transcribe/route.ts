import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 503 });
  }

  const formData = await req.formData();
  const audio = formData.get("audio") as File | null;
  if (!audio || audio.size === 0) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 });
  }

  const whisperForm = new FormData();
  // Whisper accepts webm, mp4, wav, m4a, etc.
  const ext = audio.type.includes("mp4") ? "mp4" : audio.type.includes("wav") ? "wav" : "webm";
  whisperForm.append("file", audio, `recording.${ext}`);
  whisperForm.append("model", "whisper-1");
  whisperForm.append("language", "en");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}` },
      body: whisperForm,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.text();
      console.error("[transcribe] Whisper error:", response.status, err);
      return NextResponse.json({ error: "Transcription failed" }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json({ transcript: (data.text as string) ?? "" });
  } catch (e) {
    clearTimeout(timeout);
    console.error("[transcribe] error:", e);
    return NextResponse.json({ error: "Transcription timed out" }, { status: 504 });
  }
}
