"use server";

export interface ScoreResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  summary: string;
}

export async function scoreResume(
  filename: string,
  jobTitle: string,
  requiredSkills: string[]
): Promise<{ success: true } & ScoreResult | { error: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: "ANTHROPIC_API_KEY not configured" };

  const skillsText = requiredSkills.length > 0 ? requiredSkills.join(", ") : "not specified";

  const prompt = `You are an AI recruiter assistant for Hiventra, an AI Talent Intelligence Platform.

A resume file named "${filename}" has been submitted for the position: "${jobTitle}".
Required skills for this role: ${skillsText}.

This is a prototype demo. Based only on the filename (treat it as the candidate's name/identifier), generate a realistic-looking AI resume evaluation. Make it varied and plausible — not every resume should score the same.

Respond with ONLY raw valid JSON — no markdown fences, no explanation, no extra text. Start your response with a curly brace:
{
  "score": <integer between 42 and 96>,
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "weaknesses": ["<specific gap or area for improvement>"],
  "summary": "<one concise sentence describing the candidate's fit for the role>"
}`;

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
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return { error: `API error: ${response.status}` };
    }

    const data = await response.json();
    const raw: string = data.content?.[0]?.text ?? "";
    // Strip markdown code fences if Claude wraps the JSON
    const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    const parsed: ScoreResult = JSON.parse(text);
    return {
      success: true,
      score: parsed.score,
      strengths: parsed.strengths ?? [],
      weaknesses: parsed.weaknesses ?? [],
      summary: parsed.summary ?? "",
    };
  } catch (e) {
    console.error("scoreResume error:", e);
    return { error: "Failed to score resume" };
  }
}
