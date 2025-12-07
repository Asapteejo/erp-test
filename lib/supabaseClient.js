// src/lib/supabaseClient.js — FINAL FOREVER VERSION
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase config! Check .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// AUTO SIGN-IN DEV USER — ONLY ONCE, NO RACE CONDITIONS
if (import.meta.env.DEV) {
  const setupDevAuth = () => {
    if (!window.__DEV_USER__) return false

    supabase.auth.setSession({
      access_token: 'dev-jwt-12345',
      token_type: 'bearer',
      user: {
        id: window.__DEV_USER__.id,
        aud: 'authenticated',
        role: 'authenticated',
        email: window.__DEV_USER__.email,
        user_metadata: window.__DEV_USER__.publicMetadata,
      },
    })

    console.log('%cDEV MODE: Supabase signed in as ' + window.__DEV_USER__.email, 'color: #8b5cf6; font-weight: bold')
    return true
  }

  // Try immediately
  if (!setupDevAuth()) {
    // Then poll until DevUserPanel sets it
    const interval = setInterval(() => {
      if (setupDevAuth()) clearInterval(interval)
    }, 100)
  }
}

console.log('%cSupabase ready • ' + (import.meta.env.DEV ? 'DEV MODE' : 'PROD MODE'), 'color: #10b981; font-weight: bold')