import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Current time in UTC
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const nowTimeStr = now.toTimeString().slice(0, 5); // "HH:MM"

    // Find assignments that:
    // 1. Are for today
    // 2. Have status = 'assigned' (not yet checked in)
    // 3. Have a start time that has passed by at least 5 minutes
    // 4. Have NOT already had a reminder sent (not in checkin_reminders)
    const { data: assignments, error: assignErr } = await supabaseAdmin
      .from("assignments")
      .select(`
        id,
        employee_id,
        property_id,
        time_from,
        time_to,
        property:properties(name, time_from, time_to)
      `)
      .eq("date", todayStr)
      .eq("status", "assigned");

    if (assignErr) {
      throw new Error(`Failed to fetch assignments: ${assignErr.message}`);
    }

    if (!assignments || assignments.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Already-reminded assignment IDs
    const { data: reminders } = await supabaseAdmin
      .from("checkin_reminders")
      .select("assignment_id");
    const alreadyReminded = new Set((reminders ?? []).map((r: { assignment_id: string }) => r.assignment_id));

    // Calculate effective start time for each assignment
    const nowMinutes = parseInt(nowTimeStr.split(":")[0]) * 60 + parseInt(nowTimeStr.split(":")[1]);

    let sent = 0;
    const reminderInserts: { assignment_id: string }[] = [];

    for (const a of assignments as Array<{
      id: string;
      employee_id: string;
      time_from: string | null;
      property: { name: string; time_from: string; time_to: string } | null;
    }>) {
      if (alreadyReminded.has(a.id)) continue;

      const effectiveTimeFrom = a.time_from ?? a.property?.time_from;
      if (!effectiveTimeFrom) continue;

      const [h, m] = effectiveTimeFrom.split(":").map(Number);
      const startMinutes = h * 60 + m;

      // Assignment started 5 or more minutes ago and employee hasn't checked in
      if (nowMinutes < startMinutes + 5) continue;

      // Send push notification to the employee
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-push`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            employee_id: a.employee_id,
            title: "Einsatz hat begonnen",
            body: `Dein Einsatz bei ${a.property?.name ?? "einem Objekt"} hat begonnen. Bitte jetzt einchecken.`,
            data: { type: "checkin_reminder" },
          }),
        });
        sent++;
      } catch {
        // Continue with other employees even if one push fails
      }

      reminderInserts.push({ assignment_id: a.id });
    }

    // Record which assignments were reminded to avoid duplicates
    if (reminderInserts.length > 0) {
      await supabaseAdmin.from("checkin_reminders").insert(reminderInserts);
    }

    return new Response(JSON.stringify({ ok: true, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
