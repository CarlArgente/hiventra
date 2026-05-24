import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const { jobTitle, company, carlPersonality, carlTopics, maxQuestions } =
    await req.json();

  const topics: string[] = Array.isArray(carlTopics) && carlTopics.length > 0
    ? carlTopics
    : [];
  const personality: string = carlPersonality ?? "professional";
  const count: number = Math.min(Math.max(Number(maxQuestions) || 10, 3), 15);

  const topicsLine = topics.length > 0
    ? `Key areas to assess: ${topics.join(", ")}.`
    : "Cover general behavioral, situational, and role-fit questions.";

  const prompt = `You are Carl, an AI interviewer at ${company}. Generate exactly ${count} interview questions for a ${jobTitle} candidate.

${topicsLine}
Interview tone: ${personality}.

Rules:
- Question 1: warm opener — invite them to talk about their background and interest in this role
- Include behavioral questions ("Tell me about a time you...")
- Include role-specific questions based on the areas above
- Question ${count}: always end with asking if they have any questions for the team
- Each question is concise, natural, and conversational — not stiff or corporate
- No numbering, no preamble

Return ONLY a JSON array of exactly ${count} strings. No markdown, no explanation.
Example format: ["Question one?", "Question two?"]`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[carl-questions] Anthropic error:", err);
      return NextResponse.json({ error: "Failed to generate questions" }, { status: 502 });
    }

    const data = await response.json();
    const raw: string = data.content?.[0]?.text ?? "";
    const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const questions: string[] = JSON.parse(text);

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Invalid response format");
    }

    return NextResponse.json({ questions: questions.slice(0, count) });
  } catch (e) {
    console.error("[carl-questions] error:", e);
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
  }
}
