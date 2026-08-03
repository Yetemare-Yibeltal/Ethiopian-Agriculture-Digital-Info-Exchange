// backend/src/config/supabase.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate that required environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ Missing Supabase environment variables. Please check your .env file.",
  );
  console.error("   SUPABASE_URL and SUPABASE_ANON_KEY are required.");
  process.exit(1);
}

// Create the Supabase client with the anon key (for regular operations)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a service role client (for admin operations that bypass RLS)
// This should be used sparingly and only for trusted operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// Export the URLs for other services
export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;

console.log("✅ Supabase client initialized successfully");
