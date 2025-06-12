import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_ANON_KEY must be set for Supabase connection",
  );
}

// Create Supabase client for auth
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Create database connection using Supabase connection string
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_URL?.replace('https://', 'postgresql://postgres:') + ':5432/postgres';
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
