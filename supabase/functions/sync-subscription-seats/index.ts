import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Wird von Employees.tsx nach jedem Hinzufügen/Löschen eines Mitarbeiters
// aufgerufen, damit die "pro Mitarbeiter"-Position der Stripe-Subscription
// immer der echten, aktuellen Mitarbeiterzahl entspricht. Ohne das würde
// eine Firma z.B. weiter für 10 Mitarbeiter zahlen, obwohl sie auf 15
// gewachsen ist (oder umgekehrt zu viel, wenn welche gelöscht wurden).
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

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Nicht autorisiert" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { company_id } = await req.json();
    if (!company_id) {
      return new Response(JSON.stringify({ error: "company_id fehlt" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Nur der Owner der eigenen Firma darf ihre Subscription-Menge ändern —
    // sonst könnte jede beliebige company_id fremde Abos manipulieren.
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("id, owner_id, stripe_subscription_id, stripe_subscription_item_id")
      .eq("id", company_id)
      .maybeSingle();

    if (companyError || !company || company.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: "Nicht autorisiert für diese Firma" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Noch kein bezahltes Abo (z.B. noch in der Testphase) — nichts zu
    // synchronisieren, kein Fehler.
    if (!company.stripe_subscription_id || !company.stripe_subscription_item_id) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { count, error: countError } = await supabaseAdmin
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company_id);

    if (countError) throw countError;

    const employeeCount = Math.max(1, count ?? 1);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2024-04-10",
    });

    await stripe.subscriptions.update(company.stripe_subscription_id, {
      items: [{ id: company.stripe_subscription_item_id, quantity: employeeCount }],
      proration_behavior: "create_prorations",
    });

    return new Response(JSON.stringify({ success: true, employee_count: employeeCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
