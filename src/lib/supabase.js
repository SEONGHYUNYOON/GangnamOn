
import { createClient } from '@supabase/supabase-js'

// ⚠️ Environment variables should be used in production.
// Create a .env.local file with:
// VITE_SUPABASE_URL=your_project_url
// VITE_SUPABASE_ANON_KEY=your_anon_key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
     console.warn('Supabase env vars missing!')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
