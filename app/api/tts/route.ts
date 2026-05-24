import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === "your_key_here") {
    return NextResponse.json({ error: "ElevenLabs not configured" }, { status: 503 });
  }

  const { text } = await req.json();
  if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb";

  const ttsController = new AbortController();
  const ttsTimeout = setTimeout(() => ttsController.abort(), 10000);

  let response: Response;
  try {
    response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        signal: ttsController.signal,
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );
  } catch {
    clearTimeout(ttsTimeout);
    return NextResponse.json({ error: "TTS request timed out" }, { status: 504 });
  }
  clearTimeout(ttsTimeout);

  if (!response.ok) {
    const err = await response.text();
    console.error("[ElevenLabs error]", response.status, err);
    return NextResponse.json({ error: "TTS failed" }, { status: 502 });
  }

  const audio = await response.arrayBuffer();
  return new NextResponse(audio, {
    headers: { "Content-Type": "audio/mpeg" },
  });
}
