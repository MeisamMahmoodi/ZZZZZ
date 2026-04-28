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

    // Create owner user
    const { data: ownerData, error: ownerError } = await supabaseAdmin.auth.admin.createUser({
      email: "owner@putzo.de",
      password: "demo1234",
      email_confirm: true,
    });

    if (ownerError) {
      // If user already exists, try to get them
      if (ownerError.message?.includes("already been registered")) {
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingOwner = existingUsers?.users?.find((u: { email: string }) => u.email === "owner@putzo.de");
        if (existingOwner) {
          // Update password for existing user
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            existingOwner.id,
            { password: "demo1234" }
          );
          if (updateError) throw updateError;

          // Create profile
          await supabaseAdmin.from("profiles").upsert({
            id: existingOwner.id,
            role: "owner",
          });

          // Update company owner_id
          await supabaseAdmin.from("companies").update({
            owner_id: existingOwner.id,
          }).eq("owner_email", "owner@putzo.de");

          // Update employee user_id for Lisa
          const { data: existingLisa } = await supabaseAdmin.auth.admin.listUsers();
          const lisaUser = existingLisa?.users?.find((u: { email: string }) => u.email === "lisa@putzo.de");

          return new Response(
            JSON.stringify({
              message: "Owner user already existed, password updated",
              owner_id: existingOwner.id,
              lisa_id: lisaUser?.id ?? null,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      throw ownerError;
    }

    const ownerId = ownerData.user.id;

    // Create employee user
    const { data: employeeData, error: employeeError } = await supabaseAdmin.auth.admin.createUser({
      email: "lisa@putzo.de",
      password: "demo1234",
      email_confirm: true,
    });

    if (employeeError) {
      if (employeeError.message?.includes("already been registered")) {
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingLisa = existingUsers?.users?.find((u: { email: string }) => u.email === "lisa@putzo.de");
        if (existingLisa) {
          await supabaseAdmin.auth.admin.updateUserById(existingLisa.id, { password: "demo1234" });
          await supabaseAdmin.from("profiles").upsert({ id: existingLisa.id, role: "employee" });
          await supabaseAdmin.from("employees").update({ user_id: existingLisa.id }).eq("first_name", "Lisa").eq("last_name", "Müller");

          // Create profiles and link data
          await supabaseAdmin.from("profiles").upsert({ id: ownerId, role: "owner" });
          await supabaseAdmin.from("companies").update({ owner_id: ownerId }).eq("owner_email", "owner@putzo.de");
          await supabaseAdmin.from("employees").update({ user_id: existingLisa.id }).eq("first_name", "Lisa").eq("last_name", "Müller");

          return new Response(
            JSON.stringify({
              message: "Users created/updated",
              owner_id: ownerId,
              lisa_id: existingLisa.id,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      throw employeeError;
    }

    const lisaId = employeeData.user.id;

    // Create profiles
    await supabaseAdmin.from("profiles").upsert([
      { id: ownerId, role: "owner" },
      { id: lisaId, role: "employee" },
    ]);

    // Update company owner_id
    await supabaseAdmin.from("companies").update({ owner_id: ownerId }).eq("owner_email", "owner@putzo.de");

    // Update Lisa's employee record with user_id
    await supabaseAdmin.from("employees").update({ user_id: lisaId }).eq("first_name", "Lisa").eq("last_name", "Müller");

    return new Response(
      JSON.stringify({
        message: "Demo users created successfully",
        owner_id: ownerId,
        lisa_id: lisaId,
        credentials: {
          owner: { email: "owner@putzo.de", password: "demo1234" },
          employee: { email: "lisa@putzo.de", password: "demo1234" },
        },
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
