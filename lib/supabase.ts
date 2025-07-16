import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Issue {
  id: string
  title: string
  category: string
  steps: string[]
  additional_info?: string
  media?: { url: string; type: "image" | "video" }[]
  created_at?: string
  updated_at?: string
}
