import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "chsid";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const secret = process.env.CANDIDATE_SESSION_SECRET;
  if (!secret) throw new Error("CANDIDATE_SESSION_SECRET env var is missing");
  return secret;
}

function sign(candidateId: string): string {
  const sig = createHmac("sha256", getSecret()).update(candidateId).digest("hex");
  return `${candidateId}.${sig}`;
}

function verify(value: string): string | null {
  const dot = value.lastIndexOf(".");
  if (dot === -1) return null;
  const candidateId = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = createHmac("sha256", getSecret()).update(candidateId).digest("hex");
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return null;
  } catch {
    return null;
  }
  return candidateId;
}

export async function setCandidateSession(candidateId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, sign(candidateId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getCandidateSession(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(COOKIE_NAME)?.value;
  if (!value) return null;
  return verify(value);
}

export async function clearCandidateSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}
