import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DEMO_USERS = [
  { email: "chef@meizo.demo",   password: "demo1234", role: "owner",    employeeEmail: null },
  { email: "maria@meizo.demo",  password: "demo1234", role: "employee", employeeEmail: "maria@meizo.demo" },
  { email: "stefan@meizo.demo", password: "demo1234", role: "employee", employeeEmail: "stefan@meizo.demo" },
  { email: "jana@meizo.demo",   password: "demo1234", role: "employee", employeeEmail: "jana@meizo.demo" },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const results: Record<string, string> = {};

    for (const u of DEMO_USERS) {
      // Create via admin API – this correctly populates identities
      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
      });

      let userId: string;

      if (error) {
        if (error.message?.includes("already been registered")) {
          const { data: list } = await admin.auth.admin.listUsers();
          const existing = list?.users?.find((x) => x.email === u.email);
          if (!existing) throw new Error(`User ${u.email} not found after duplicate error`);
          await admin.auth.admin.updateUserById(existing.id, { password: u.password });
          userId = existing.id;
        } else {
          throw error;
        }
      } else {
        userId = data.user.id;
      }

      // Upsert profile
      await admin.from("profiles").upsert({ id: userId, role: u.role });

      // Link owner to company
      if (u.role === "owner") {
        await admin.from("companies")
          .update({ owner_id: userId })
          .eq("owner_email", u.email);
      }

      // Link employee record
      if (u.employeeEmail) {
        await admin.from("employees")
          .update({ user_id: userId })
          .eq("email", u.employeeEmail);
      }

      results[u.email] = userId;
    }

    return new Response(
      JSON.stringify({ ok: true, users: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
