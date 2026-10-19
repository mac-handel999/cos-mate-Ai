import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});

const TABLE = process.env.SUPABASE_KEEPALIVE_TABLE || "universities";

async function ping() {
    const { count, error } = await supabase
        .from(TABLE)
        .select("*", { count: "exact", head: true });

    if (error) {
        console.error("Ping failed:", error.message);
        process.exit(1);
    }
    console.log(`Supabase ping OK — ${TABLE} rows: ${count}`);
}

ping();
