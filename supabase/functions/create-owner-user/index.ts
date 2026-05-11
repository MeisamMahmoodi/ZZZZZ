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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );

    // Verify caller is admin
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Nicht autorisiert" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Nur Admins können Unternehmen anlegen" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { owner_name, company_name, email, password, contract, contract_start, paid_until } = await req.json();

    if (!owner_name || !company_name || !email || !password) {
      return new Response(JSON.stringify({ error: "Alle Pflichtfelder ausfüllen" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validContracts = ["Starter", "Business", "Premium"];
    const finalContract = validContracts.includes(contract) ? contract : "Starter";

    // Create auth user
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { must_change_password: true },
    });

    if (createError) {
      if (createError.message?.includes("already been registered")) {
        return new Response(JSON.stringify({ error: "Diese E-Mail ist bereits registriert" }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw createError;
    }

    const ownerId = userData.user.id;

    // Create owner profile
    await supabaseAdmin.from("profiles").upsert({ id: ownerId, role: "owner" });

    // Create company
    const { error: companyError } = await supabaseAdmin.from("companies").insert({
      name: company_name,
      owner_name,
      owner_email: email,
      owner_id: ownerId,
      contract: finalContract,
      contract_start: contract_start ?? new Date().toISOString(),
      paid_until: paid_until ?? null,
    });

    if (companyError) {
      // Roll back auth user on failure
      await supabaseAdmin.auth.admin.deleteUser(ownerId);
      throw companyError;
    }

    return new Response(
      JSON.stringify({ message: "Unternehmen erfolgreich erstellt", user_id: ownerId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
