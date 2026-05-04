import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const ADMIN_EMAIL = "admin@meizo.app";
    const ADMIN_PASSWORD = "Meizo@Admin2026";

    // Check if already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u: { email: string }) => u.email === ADMIN_EMAIL);

    let adminId: string;

    if (existing) {
      await supabaseAdmin.auth.admin.updateUserById(existing.id, { password: ADMIN_PASSWORD });
      adminId = existing.id;
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });
      if (error) throw error;
      adminId = data.user.id;
    }

    // Upsert admin profile
    await supabaseAdmin.from("profiles").upsert({ id: adminId, role: "admin" });

    return new Response(
      JSON.stringify({
        message: "Admin user ready",
        credentials: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
