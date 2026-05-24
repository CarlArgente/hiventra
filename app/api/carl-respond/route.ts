import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const { jobTitle, company, carlPersonality, question, answer, isLastQuestion } =
    await req.json();

  const personality: string = carlPersonality ?? "professional";

  const prompt = isLastQuestion
    ? `You are Carl, a ${personality} AI interviewer at ${company} for a ${jobTitle} role.

You just asked the FINAL interview question: "${question}"

The candidate answered: "${answer}"

Write a warm, genuine 2–3 sentence closing:
- Thank them sincerely for their time today
- React to one specific thing they mentioned in their answer
- Wish them well with the hiring process

CRITICAL: Do NOT ask any questions. This is the end of the interview.

Return ONLY the closing text. No quotes, no formatting, nothing else.`
    : `You are Carl, a ${personality} AI interviewer at ${company} for a ${jobTitle} role.

You just asked: "${question}"

The candidate answered: "${answer}"

Write a 1–2 sentence acknowledgment. Then move on.

STRICT RULES — violating any of these is wrong:
1. NEVER ask a question of any kind. No follow-ups, no clarifications, no "can you walk me through", no "could you tell me more". Zero questions. Period.
2. NEVER use hollow openers: "Great!", "Excellent!", "Amazing!", "Fantastic!", "That's great", "That's excellent".
3. React to something specific the candidate said, then close with a natural transition like "let's move on", "let's continue", "on to the next one", "let's keep going".

GOOD examples:
- "Mentioning automated testing as a safeguard shows solid engineering discipline — let's move on."
- "Your experience with cross-functional teams comes through clearly, let's continue."
- "Handling ambiguous requirements by over-communicating is a mature approach — on to the next one."

BAD examples (do not do these):
- "Can you walk me through a specific example?" ← question, forbidden
- "Could you elaborate on that?" ← question, forbidden
- "Great answer! Let's move on." ← hollow opener, forbidden

Return ONLY the acknowledgment text. No quotes, no formatting, nothing else.`;

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
        max_tokens: 150,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[carl-respond] Anthropic error:", err);
      return NextResponse.json({ error: "Failed to generate response" }, { status: 502 });
    }

    const data = await response.json();
    const raw: string = (data.content?.[0]?.text ?? "").trim();

    // Safety net: strip any sentence that ends with "?" — model sometimes ignores the no-questions rule
    const acknowledgment = raw
      .split(/(?<=[.!?])\s+/)
      .filter((sentence) => !sentence.trimEnd().endsWith("?"))
      .join(" ")
      .trim();

    return NextResponse.json({ acknowledgment: acknowledgment || raw });
  } catch (e) {
    console.error("[carl-respond] error:", e);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
