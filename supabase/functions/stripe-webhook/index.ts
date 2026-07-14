import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, stripe-signature",
};

// Muss mit create-checkout-session/index.ts und src/lib/plans.ts übereinstimmen.
const PER_EMPLOYEE_PRICE_ID = "price_1TstyTRoktFw8HCnvWdYVNda";

function plus31Days(): string {
  const d = new Date();
  d.setDate(d.getDate() + 31);
  return d.toISOString();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
    apiVersion: "2024-04-10",
  });

  const signature = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: `Webhook-Signatur ungültig: ${message}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    switch (event.type) {
      // Erste Zahlung nach dem Checkout — schaltet die Firma frei und merkt
      // sich Customer-/Subscription-ID, damit spätere Events (Verlängerung,
      // Kündigung) wieder zur richtigen Firma zurückfinden, obwohl sie
      // selbst keine company_id in ihrer Metadata tragen.
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const company_id = session.metadata?.company_id;
        if (company_id) {
          const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
          const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;

          // Die Subscription-Item-ID der Pro-Mitarbeiter-Position merken —
          // ohne die kann die Mitarbeiterzahl-Sync-Funktion später nicht
          // gezielt nur diese eine Position aktualisieren (Stripe braucht
          // dafür die Item-ID, nicht nur die Subscription-ID).
          let subscriptionItemId: string | null = null;
          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const perEmployeeItem = subscription.items.data.find(
              (item) => item.price.id === PER_EMPLOYEE_PRICE_ID
            );
            subscriptionItemId = perEmployeeItem?.id ?? null;
          }

          await supabaseAdmin.from("companies").update({
            paid_until: plus31Days(),
            trial_ends_at: null,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_subscription_item_id: subscriptionItemId,
          }).eq("id", company_id);
        }
        break;
      }

      // Erfolgreiche Folgezahlung (automatische Verlängerung des Abos).
      // Ohne diesen Fall lief paid_until nach 31 Tagen ab, obwohl der Kunde
      // weiterbezahlt hat — er wäre trotz aktiver Zahlung ausgesperrt worden.
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
        if (subscriptionId) {
          await supabaseAdmin.from("companies").update({
            paid_until: plus31Days(),
          }).eq("stripe_subscription_id", subscriptionId);
        }
        break;
      }

      // Abo wurde beendet (Kündigung oder nach Stripes eigenen
      // Dunning-Versuchen endgültig fehlgeschlagene Zahlung). Zugriff wird
      // ab jetzt gesperrt, statt unbegrenzt weiterzulaufen.
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await supabaseAdmin.from("companies").update({
          paid_until: new Date().toISOString(),
        }).eq("stripe_subscription_id", subscription.id);
        break;
      }
    }
  } catch (err) {
    // Stripe wiederholt den Webhook automatisch bei einer Fehlerantwort —
    // wir loggen nur und antworten trotzdem 200, damit Stripe nicht endlos
    // retried (z.B. falls die Firma inzwischen gelöscht wurde).
    console.error("stripe-webhook processing error", err);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
