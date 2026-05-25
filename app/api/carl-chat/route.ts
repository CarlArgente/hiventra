import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCarlChatContext } from "@/app/actions/carl-chat";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const {
    messages,
    contextType = "general",
    contextJobId,
    contextCandidateId,
  }: {
    messages: ChatMessage[];
    contextType: "general" | "job" | "candidate";
    contextJobId?: string;
    contextCandidateId?: string;
  } = await req.json();

  if (!messages?.length) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  const context = await getCarlChatContext(contextType, contextJobId, contextCandidateId);

  const systemPrompt = `You are Carl, Hiventra's AI Talent Intelligence assistant. You help HR teams and hiring managers make better, faster, data-driven hiring decisions.

You have access to the following real-time data from the Hiventra platform:

${context || "No specific context data available — answer generally about hiring best practices."}

## Your Role
- Answer questions about jobs, candidates, pipeline health, scores, and recommendations
- Provide data-driven insights and hiring advice based on the actual platform data above
- Help the HR team understand candidate quality and make decisions
- Suggest actions (invite to interview, move stage, reject, etc.) based on scores and context
- Be concise, professional, and direct — HR teams are busy

## Tone & Format
- Respond in clear, professional language
- Use bullet points for lists of candidates or insights
- When referencing candidates, include their name, score, and recommendation
- Never fabricate data not present in the context above
- If asked about something outside the provided context, say so honestly`;

  try {
    const response = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[carl-chat] Anthropic error:", err);
      return NextResponse.json({ error: "Failed to get response from Carl" }, { status: 502 });
    }

    const data = await response.json();
    const reply: string = (data.content?.[0]?.text ?? "").trim();

    return NextResponse.json({ reply });
  } catch (e) {
    console.error("[carl-chat] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
