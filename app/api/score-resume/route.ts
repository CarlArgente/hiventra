import { NextRequest, NextResponse } from "next/server";

const PDF_TYPE = "application/pdf";
const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const JSON_SCHEMA = `{
  "score": <integer 0-100 reflecting actual resume quality and fit>,
  "strengths": ["<specific strength from the resume>", "<specific strength>", "<specific strength>"],
  "weaknesses": ["<specific gap or missing qualification>", "<another gap if any>"],
  "summary": "<one concise sentence describing the candidate fit based on actual resume content>"
}`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const jobTitle = (formData.get("jobTitle") as string) || "";
  const skillsRaw = (formData.get("requiredSkills") as string) || "[]";
  const requiredSkills: string[] = JSON.parse(skillsRaw);

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const skillsText = requiredSkills.length > 0 ? requiredSkills.join(", ") : "not specified";
  const roleContext = `Position: "${jobTitle}". Required skills: ${skillsText}.`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    let messageContent: object[];

    if (file.type === PDF_TYPE) {
      // Claude native PDF document support — reads actual content
      messageContent = [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64,
          },
        },
        {
          type: "text",
          text: `You are an expert AI recruiter. Read the resume above carefully and evaluate the candidate.

${roleContext}

Score the candidate based on their actual experience, skills, education, and fit for this role.
Be honest and varied in scoring — different candidates should get different scores based on their real qualifications.

Respond with ONLY raw JSON, starting with a curly brace, no markdown:
${JSON_SCHEMA}`,
        },
      ];
    } else if (file.type === DOCX_TYPE) {
      // DOCX: extract readable text from XML heuristically
      // word/document.xml is inside the ZIP — extract w:t tag content via regex
      const rawText = Buffer.from(arrayBuffer).toString("latin1");
      // Pull text between <w:t> tags (Word document XML text runs)
      const matches = rawText.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) ?? [];
      const extractedText = matches
        .map((m) => m.replace(/<[^>]+>/g, ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .slice(0, 6000);

      messageContent = [
        {
          type: "text",
          text: `You are an expert AI recruiter. Evaluate this candidate's resume for the following role.

${roleContext}

Resume content (extracted from DOCX):
${extractedText || "[Could not extract text from DOCX]"}

Score the candidate based on their actual qualifications and fit for the role.
Be honest and varied in scoring — different candidates should get different scores.

Respond with ONLY raw JSON, starting with a curly brace, no markdown:
${JSON_SCHEMA}`,
        },
      ];
    } else {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "anthropic-beta": "pdfs-2024-09-25",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        messages: [{ role: "user", content: messageContent }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return NextResponse.json({ error: `Anthropic error: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    const raw: string = data.content?.[0]?.text ?? "";
    const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    const parsed = JSON.parse(text);
    return NextResponse.json({
      score: parsed.score,
      strengths: parsed.strengths ?? [],
      weaknesses: parsed.weaknesses ?? [],
      summary: parsed.summary ?? "",
    });
  } catch (e) {
    console.error("score-resume route error:", e);
    return NextResponse.json({ error: "Failed to score resume" }, { status: 500 });
  }
}
