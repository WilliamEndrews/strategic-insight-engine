import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type TraderProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  country: string | null;
  timezone: string | null;
  language: string | null;
  trading_style: string | null;
  experience_level: string | null;
  risk_profile: string | null;
  preferred_timeframes: string[];
  preferred_assets: string[];
  platforms_used: string[];
  stop_loss_habit: boolean | null;
  drawdown_experience: boolean | null;
  has_trading_plan: boolean | null;
  lgpd_consent: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};
