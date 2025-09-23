import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for frontend operations
export const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client for backend operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  plan: 'free' | 'pro';
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'member';
  tenant_id: string;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  user_id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}