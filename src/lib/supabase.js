
import { createClient } from '@supabase/supabase-js'

// ⚠️ Environment variables should be used in production.
// Create a .env.local file with:
// VITE_SUPABASE_URL=your_project_url
// VITE_SUPABASE_ANON_KEY=your_anon_key

const supabaseUrl = 'https://inscunckhcmsqanmaixl.supabase.co'
const supabaseAnonKey = 'sb_publishable_7-VRd8r4IYlJWyY1Lhmuxw_cccxlHyR'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
