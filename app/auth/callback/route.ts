import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      const provider = user?.app_metadata?.provider;

      if (provider === "google" && user?.email) {
        // Sign out the Google session — OTP is required as second factor
        await supabase.auth.signOut();
        const email = encodeURIComponent(user.email);
        return NextResponse.redirect(`${origin}/signin/otp?email=${email}`);
      }

      // Email OTP magic link or other provider — go straight to dashboard
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/signin?error=auth_failed`);
}
