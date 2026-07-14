import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Grundgebühr + Preis pro Mitarbeiter (siehe src/lib/plans.ts für die
// dazugehörige Preisformel, muss mit diesen IDs übereinstimmen).
// Grundgebühr-Price am 14.07. von 29€ auf 19€ Price-ID gewechselt (alte
// 29€-Price ist in Stripe archiviert, nicht gelöscht).
const BASE_FEE_PRICE_ID = "price_1Tt5hSRoktFw8HCnwAy5U1I0";
const PER_EMPLOYEE_PRICE_ID = "price_1TstyTRoktFw8HCnvWdYVNda";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2024-04-10",
    });

    const { company_id, employee_count } = await req.json();
    const employeeCount = Math.max(1, Number(employee_count) || 1);

    if (!company_id) {
      return new Response(JSON.stringify({ error: "Ungültige Parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        { price: BASE_FEE_PRICE_ID, quantity: 1 },
        { price: PER_EMPLOYEE_PRICE_ID, quantity: employeeCount },
      ],
      success_url: "https://meizo.de/dashboard?payment=success",
      cancel_url: "https://meizo.de/dashboard?payment=cancelled",
      metadata: { company_id, employee_count: String(employeeCount) },
      // Metadata zusätzlich auf das Abo selbst spiegeln (nicht nur auf die
      // Checkout Session) — hilfreich als Fallback beim Nachschlagen in
      // Stripe direkt, auch wenn stripe-webhook primär über die auf
      // companies gespeicherte stripe_subscription_id zuordnet.
      subscription_data: { metadata: { company_id } },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
