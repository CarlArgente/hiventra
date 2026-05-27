import { NextRequest, NextResponse } from "next/server";
import { generateInterviewAnalysis } from "@/app/actions/report";

export async function POST(request: NextRequest) {
  const { candidateId } = await request.json();
  if (!candidateId) return NextResponse.json({ error: "candidateId required" }, { status: 400 });
  const result = await generateInterviewAnalysis(candidateId);
  return NextResponse.json(result);
}
