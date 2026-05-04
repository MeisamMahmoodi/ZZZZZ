import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// --- Minimal VAPID / Web Push implementation using Web Crypto API ---

function b64urlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(s.length + ((4 - (s.length % 4)) % 4), "=");
  const bin = atob(b64);
  return new Uint8Array(bin.split("").map((c) => c.charCodeAt(0)));
}

function b64urlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function signJwt(header: object, payload: object, privateKeyBytes: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const headerB64 = b64urlEncode(enc.encode(JSON.stringify(header)));
  const payloadB64 = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    // Wrap raw 32-byte private key in PKCS8 DER structure for P-256
    (() => {
      const pkcs8Header = new Uint8Array([
        0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48,
        0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03,
        0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01, 0x01, 0x04, 0x20,
      ]);
      const der = new Uint8Array(pkcs8Header.length + privateKeyBytes.length);
      der.set(pkcs8Header);
      der.set(privateKeyBytes, pkcs8Header.length);
      return der.buffer;
    })(),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    enc.encode(signingInput)
  );

  return `${signingInput}.${b64urlEncode(sig)}`;
}

async function buildVapidAuthHeader(
  endpoint: string,
  vapidPublicKeyB64: string,
  vapidPrivateKeyB64: string,
  subject: string
): Promise<string> {
  const privateKeyBytes = b64urlDecode(vapidPrivateKeyB64);
  const origin = new URL(endpoint).origin;
  const expiry = Math.floor(Date.now() / 1000) + 12 * 3600;

  const jwt = await signJwt(
    { typ: "JWT", alg: "ES256" },
    { aud: origin, exp: expiry, sub: subject },
    privateKeyBytes
  );

  return `vapid t=${jwt},k=${vapidPublicKeyB64}`;
}

async function encryptPayload(
  payload: string,
  p256dhB64: string,
  authB64: string
): Promise<{ body: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  const enc = new TextEncoder();
  const plaintext = enc.encode(payload);

  // Client's public key
  const clientPublicKey = await crypto.subtle.importKey(
    "raw",
    b64urlDecode(p256dhB64),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Generate ephemeral server key pair
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const serverPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", serverKeyPair.publicKey)
  );

  // ECDH shared secret
  const sharedBits = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: clientPublicKey }, serverKeyPair.privateKey, 256)
  );

  const authSecret = b64urlDecode(authB64);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF auth (RFC 8291)
  const authInfo = enc.encode("WebPush: info\x00");
  const authContext = new Uint8Array(authInfo.length + 65 + 65);
  authContext.set(authInfo);
  authContext.set(b64urlDecode(p256dhB64), authInfo.length);
  authContext.set(serverPublicKeyRaw, authInfo.length + 65);

  const prk = await crypto.subtle.importKey("raw", sharedBits, { name: "HKDF" }, false, ["deriveBits"]);
  const ikmBits = new Uint8Array(await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: authSecret, info: authContext },
    prk,
    256
  ));

  // HKDF for content encryption key and nonce
  const keyInfo = enc.encode("Content-Encoding: aes128gcm\x00");
  const nonceInfo = enc.encode("Content-Encoding: nonce\x00");

  const ikm = await crypto.subtle.importKey("raw", ikmBits, { name: "HKDF" }, false, ["deriveBits"]);
  const [keyBits, nonceBits] = await Promise.all([
    crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: keyInfo }, ikm, 128),
    crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: nonceInfo }, ikm, 96),
  ]);

  const contentKey = await crypto.subtle.importKey("raw", keyBits, { name: "AES-GCM" }, false, ["encrypt"]);

  // Pad plaintext: 2-byte big-endian padding length + padding + content
  const paddedLen = plaintext.length + 1;
  const padded = new Uint8Array(paddedLen);
  padded[0] = 0;
  padded.set(plaintext, 1);

  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonceBits },
    contentKey,
    padded
  ));

  // aes128gcm content-coding header: salt(16) + record_size(4) + key_id_len(1) + server_public_key(65)
  const recordSize = ciphertext.length + 2;
  const header = new Uint8Array(16 + 4 + 1 + 65);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, recordSize, false);
  header[20] = 65;
  header.set(serverPublicKeyRaw, 21);

  const body = new Uint8Array(header.length + ciphertext.length);
  body.set(header);
  body.set(ciphertext, header.length);

  return { body, salt, serverPublicKey: serverPublicKeyRaw };
}

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

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "3FeAXtUKgtzqqeyBRrQpA9RfBDhRyG_YQZ0RznTo_CEP8KqtroiKlETKOrZORBn0rykC7AunRwplAmL73mzHCg";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "D_Cqra6IipREyjq2TkQZ9K8pAuwLp0cKZQJi-95sxwo";
    const vapidSubject = "mailto:admin@blitz-reinigung.de";

    const payload = JSON.stringify({ title, body, data: data ?? {} });

    const [vapidHeader, { body: encBody }] = await Promise.all([
      buildVapidAuthHeader(sub.endpoint, vapidPublicKey, vapidPrivateKey, vapidSubject),
      encryptPayload(payload, sub.p256dh, sub.auth),
    ]);

    const pushRes = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        "Authorization": vapidHeader,
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "TTL": "86400",
      },
      body: encBody,
    });

    if (!pushRes.ok && pushRes.status !== 201) {
      const errText = await pushRes.text();
      // If subscription gone (410/404), clean it up
      if (pushRes.status === 410 || pushRes.status === 404) {
        await supabaseAdmin.from("push_subscriptions").delete().eq("employee_id", employee_id);
        return new Response(JSON.stringify({ ok: false, error: "Subscription expired, removed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Push failed: ${pushRes.status} ${errText}`);
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
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
