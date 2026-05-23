import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '⚠️ Credenciais do Supabase não encontradas!\n' +
    'Copie o arquivo .env.example para .env e preencha com suas credenciais.\n' +
    'Veja: https://supabase.com → Seu Projeto → Settings → API'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
