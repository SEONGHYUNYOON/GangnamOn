
import { createClient } from '@supabase/supabase-js'

// ⚠️ Environment variables should be used in production.
// Create a .env.local file with:
// VITE_SUPABASE_URL=your_project_url
// VITE_SUPABASE_ANON_KEY=your_anon_key

const supabaseUrl = 'https://qsrtenyxyhiqtsxvhakv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzcnRlbnl4eWhpcXRzeHZoYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2OTgwNDcsImV4cCI6MjA4NTI3NDA0N30.3HzqR4jEEtofDOZUFhc3r82CBjm1FSP_c5ydooQu-V0'

// if (!supabaseUrl || !supabaseAnonKey) {
//      console.warn('Supabase env vars missing!')
// }

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
