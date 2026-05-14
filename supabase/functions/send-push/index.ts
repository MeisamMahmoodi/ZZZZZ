import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// --- Main handler ---

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

    const { employee_id, title, body, data } = await req.json() as {
      employee_id: string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    };

    if (!employee_id || !title || !body) {
      return new Response(JSON.stringify({ error: "employee_id, title, body required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch push subscription
    const { data: sub, error: subErr } = await supabaseAdmin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("employee_id", employee_id)
      .maybeSingle();

    if (subErr || !sub) {
      return new Response(JSON.stringify({ error: "No push subscription for this employee", ok: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "BP7dGwwS5VmjyTIQsjvqKYQWJNXFdkalsN8t2JKPOt7497HEzNrFhfxHQhnEQAjmmOYThd8N-PzIZdphGhWDjNk";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "iEIeD4L_4dLDQgfG6XHCSvcvDeBWXroDlKLxP26CCs4";
    const vapidSubject = "mailto:meisam.projects@gmail.com";

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const payload = JSON.stringify({ title, body, data: data ?? {} });

    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };

    const pushRes = await webpush.sendNotification(pushSubscription, payload);

    if (pushRes.statusCode && pushRes.statusCode !== 200 && pushRes.statusCode !== 201) {
      if (pushRes.statusCode === 410 || pushRes.statusCode === 404) {
        await supabaseAdmin.from("push_subscriptions").delete().eq("employee_id", employee_id);
        return new Response(JSON.stringify({ ok: false, error: "Subscription expired, removed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Push failed: ${pushRes.statusCode}`);
    }

    // Also insert a notification record in DB for in-app bell
    await supabaseAdmin.from("notifications").insert({
      employee_id,
      type: data?.type ?? "info",
      title,
      message: body,
      read: false,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    // Handle web-push errors that contain statusCode
    const e = err as { statusCode?: number; body?: string; message?: string };
    if (e.statusCode === 410 || e.statusCode === 404) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const body = await req.clone().json().catch(() => ({})) as { employee_id?: string };
      if (body.employee_id) {
        await supabaseAdmin.from("push_subscriptions").delete().eq("employee_id", body.employee_id);
      }
      return new Response(JSON.stringify({ ok: false, error: "Subscription expired, removed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
