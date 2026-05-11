import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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
    if (!user) return json({ error: "Nicht autorisiert" }, 401);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "admin") {
      return json({ error: "Nur Admins dürfen diese Aktion ausführen" }, 403);
    }

    const body = await req.json();
    const action = body.action as string;

    // ── list-users ─────────────────────────────────────────────
    if (action === "list-users") {
      const page = body.page ?? 1;
      const perPage = body.perPage ?? 1000;
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;

      const profilesRes = await supabaseAdmin.from("profiles").select("id, role, created_at");
      const profilesById = new Map<string, { role: string; created_at: string }>();
      (profilesRes.data ?? []).forEach((p: { id: string; role: string; created_at: string }) => {
        profilesById.set(p.id, { role: p.role, created_at: p.created_at });
      });

      const users = (data.users ?? []).map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at,
        banned_until: (u as unknown as { banned_until?: string }).banned_until ?? null,
        role: profilesById.get(u.id)?.role ?? null,
        user_metadata: u.user_metadata ?? {},
      }));

      return json({ users });
    }

    // ── reset-password ─────────────────────────────────────────
    if (action === "reset-password") {
      const { userId, password } = body;
      if (!userId || !password || password.length < 6) {
        return json({ error: "userId und Passwort (min. 6 Zeichen) erforderlich" }, 400);
      }
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
      if (error) throw error;
      return json({ success: true });
    }

    // ── delete-user ────────────────────────────────────────────
    if (action === "delete-user") {
      const { userId } = body;
      if (!userId) return json({ error: "userId erforderlich" }, 400);
      if (userId === user.id) return json({ error: "Eigenes Konto kann nicht gelöscht werden" }, 400);

      // Null out references
      await supabaseAdmin.from("companies").update({ owner_id: null }).eq("owner_id", userId);
      await supabaseAdmin.from("employees").update({ user_id: null }).eq("user_id", userId);
      await supabaseAdmin.from("profiles").delete().eq("id", userId);

      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;
      return json({ success: true });
    }

    // ── create-user ────────────────────────────────────────────
    if (action === "create-user") {
      const { email, password, role } = body;
      if (!email || !password || !role) return json({ error: "email, password, role erforderlich" }, 400);
      if (!["owner", "employee", "admin"].includes(role)) return json({ error: "Ungültige Rolle" }, 400);

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) {
        if (error.message?.includes("already been registered")) {
          return json({ error: "E-Mail bereits registriert" }, 409);
        }
        throw error;
      }

      await supabaseAdmin.from("profiles").upsert({ id: data.user.id, role });
      return json({ success: true, user_id: data.user.id });
    }

    // ── hard-delete-company ────────────────────────────────────
    if (action === "hard-delete-company") {
      const { companyId } = body;
      if (!companyId) return json({ error: "companyId erforderlich" }, 400);

      // Get owner_id + employee user_ids before deleting
      const { data: company } = await supabaseAdmin.from("companies").select("owner_id").eq("id", companyId).maybeSingle();
      const { data: emps } = await supabaseAdmin.from("employees").select("user_id").eq("company_id", companyId);

      // Delete company (cascades employees, properties, assignments etc.)
      const { error: delErr } = await supabaseAdmin.from("companies").delete().eq("id", companyId);
      if (delErr) throw delErr;

      // Delete all related auth users
      const userIdsToDelete = new Set<string>();
      if (company?.owner_id) userIdsToDelete.add(company.owner_id);
      (emps ?? []).forEach((e: { user_id: string | null }) => { if (e.user_id) userIdsToDelete.add(e.user_id); });
      for (const uid of userIdsToDelete) {
        await supabaseAdmin.from("profiles").delete().eq("id", uid);
        await supabaseAdmin.auth.admin.deleteUser(uid).catch(() => {});
      }

      return json({ success: true });
    }

    return json({ error: "Unbekannte Aktion" }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 500);
  }
});
