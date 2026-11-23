
const SUPABASE_URL = "https://pybpwlyoltgansdcgilu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_6MaUfOFL1IgEOxQ8KWBs_A_kVkKlZwT";

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);
