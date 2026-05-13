import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const checks = {
    supabaseUrlConfigured: Boolean(supabaseUrl),
    supabaseAnonKeyConfigured: Boolean(supabaseAnonKey),
    openAiConfigured: Boolean(process.env.OPENAI_API_KEY),
    openAiModelConfigured: Boolean(process.env.OPENAI_MODEL),
    adminPasswordConfigured: Boolean(process.env.ADMIN_PASSWORD),
    moderatorPasswordConfigured: Boolean(process.env.MODERATOR_PASSWORD),
    eventAccessCodeConfigured: Boolean(process.env.EVENT_ACCESS_CODE),
    databaseReachable: false,
    demoEventFound: false,
  }

  let databaseError: string | null = null

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      const { data, error } = await supabase
        .from("events")
        .select("slug")
        .eq("slug", "affarsresans-ekosystem")
        .maybeSingle()

      if (error) throw error

      checks.databaseReachable = true
      checks.demoEventFound = Boolean(data)
    } catch (error) {
      databaseError =
        error instanceof Error ? error.message : "Kunde inte nå databasen."
    }
  }

  return NextResponse.json({
    checks,
    databaseError,
    ok: Object.values(checks).every(Boolean),
  })
}