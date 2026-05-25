"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── Types ────────────────────────────────────────────────────────────────────

export interface OrgSettings {
  id: string;
  company_name: string;
  logo_url: string | null;
  brand_color: string;
  timezone: string;
  updated_at: string;
}

export interface CarlDefaults {
  id: string;
  personality: string;
  mode: string;
  duration: number;
  max_questions: number;
  updated_at: string;
}

export interface ScoringThresholds {
  id: string;
  strongly_recommend_min: number;
  recommend_min: number;
  review_further_min: number;
  updated_at: string;
}

export interface NotifPref {
  event_name: string;
  role: string;
  enabled: boolean;
}

export interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  last_login_at: string | null;
  created_at: string;
}

export interface SettingsData {
  org: OrgSettings | null;
  carlDefaults: CarlDefaults | null;
  thresholds: ScoringThresholds | null;
  notifPrefs: NotifPref[];
  users: UserRow[];
}

// ── Fetch all settings ───────────────────────────────────────────────────────

export async function getSettingsData(): Promise<SettingsData> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const [
    { data: orgRows },
    { data: carlRows },
    { data: threshRows },
    { data: notifRows },
    { data: userRows },
  ] = await Promise.all([
    supabase.from("org_settings").select("*").limit(1).single(),
    supabase.from("carl_defaults").select("*").limit(1).single(),
    supabase.from("scoring_thresholds").select("*").limit(1).single(),
    supabase.from("notification_preferences").select("event_name, role, enabled"),
    supabase.from("profiles").select("id, email, full_name, role, status, last_login_at, created_at").order("created_at"),
  ]);

  return {
    org: orgRows as OrgSettings | null,
    carlDefaults: carlRows as CarlDefaults | null,
    thresholds: threshRows as ScoringThresholds | null,
    notifPrefs: (notifRows ?? []) as NotifPref[],
    users: (userRows ?? []) as UserRow[],
  };
}

// ── Org settings ─────────────────────────────────────────────────────────────

export async function saveOrgSettings(data: {
  company_name: string;
  logo_url?: string | null;
  brand_color: string;
  timezone: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase.from("org_settings").select("id").limit(1).single();

  const payload = { ...data, updated_at: new Date().toISOString(), updated_by: user.id };

  const { error } = existing
    ? await supabase.from("org_settings").update(payload).eq("id", existing.id)
    : await supabase.from("org_settings").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return {};
}

// ── Carl defaults ─────────────────────────────────────────────────────────────

export async function saveCarlDefaults(data: {
  personality: string;
  mode: string;
  duration: number;
  max_questions: number;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data: existing } = await supabase.from("carl_defaults").select("id").limit(1).single();

  const payload = { ...data, updated_at: new Date().toISOString() };

  const { error } = existing
    ? await supabase.from("carl_defaults").update(payload).eq("id", existing.id)
    : await supabase.from("carl_defaults").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return {};
}

// ── Scoring thresholds ────────────────────────────────────────────────────────

export async function saveScoringThresholds(data: {
  strongly_recommend_min: number;
  recommend_min: number;
  review_further_min: number;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data: existing } = await supabase.from("scoring_thresholds").select("id").limit(1).single();

  const payload = { ...data, updated_at: new Date().toISOString() };

  const { error } = existing
    ? await supabase.from("scoring_thresholds").update(payload).eq("id", existing.id)
    : await supabase.from("scoring_thresholds").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return {};
}

// ── Notification preferences ──────────────────────────────────────────────────

export async function saveNotifPrefs(
  prefs: Array<{ event_name: string; role: string; enabled: boolean }>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(prefs, { onConflict: "event_name,role" });

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return {};
}

// ── User management ───────────────────────────────────────────────────────────

export async function inviteUser(
  email: string,
  role: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  // Check if user already exists in profiles
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) return { error: "User with this email already exists." };

  // Use Supabase admin invite (creates auth user + triggers profile creation via trigger)
  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { role },
  });

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return {};
}

export async function updateUserRole(
  userId: string,
  role: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return {};
}

export async function setUserStatus(
  userId: string,
  status: "active" | "deactivated"
): Promise<{ error?: string }> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { error } = await supabase
    .from("profiles")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return {};
}
