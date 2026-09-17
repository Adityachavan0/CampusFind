// Supabase configuration
// Add your Supabase URL and Publishable Key here.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://ylqhgseqgasrnxmbygow.supabase.co";
const SUPABASE_KEY = "sb_publishable_V2CtWmfVVax8-F4m2OK-hA_qSpe5JwO";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
        auth: {
            storage: window.sessionStorage,
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);