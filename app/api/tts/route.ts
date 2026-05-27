import { NextRequest, NextResponse } from "next/server";

async function fetchElevenLabs(apiKey: string, voiceId: string, text: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        signal: controller.signal,
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
    clearTimeout(timeout);
    return response;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === "your_key_here") {
    return NextResponse.json({ error: "ElevenLabs not configured" }, { status: 503 });
  }

  const { text } = await req.json();
  if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb";

  let response: Response;
  try {
    response = await fetchElevenLabs(apiKey, voiceId, text);

    // Retry once on 401/429 — ElevenLabs can transiently reject concurrent requests
    if (!response.ok && (response.status === 401 || response.status === 429)) {
      await new Promise((r) => setTimeout(r, 600));
      response = await fetchElevenLabs(apiKey, voiceId, text);
    }
  } catch {
    return NextResponse.json({ error: "TTS request timed out" }, { status: 504 });
  }

  if (!response.ok) {
    const err = await response.text();
    console.error("[ElevenLabs error]", response.status, err);
    return NextResponse.json({ error: "TTS failed", elevenlabs_status: response.status }, { status: 502 });
  }

  const audio = await response.arrayBuffer();
  return new NextResponse(audio, {
    headers: { "Content-Type": "audio/mpeg" },
  });
}
