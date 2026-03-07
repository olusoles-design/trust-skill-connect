import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) throw new Error("Unauthorized");

    const { gateway, amount, currency = "ZAR", type, plan, metadata = {} } = await req.json();

    if (!gateway || !amount || !type) throw new Error("Missing required fields: gateway, amount, type");

    const validGateways = ["flutterwave", "paystack", "payfast"];
    if (!validGateways.includes(gateway)) throw new Error("Invalid gateway");

    const txId = crypto.randomUUID();
    const returnUrl = `${req.headers.get("origin") ?? "https://trust-skill-connect.lovable.app"}/dashboard/payments?tx=${txId}&gateway=${gateway}`;

    // Insert pending transaction
    const { error: txErr } = await supabase.from("payment_transactions").insert({
      user_id: user.id,
      gateway,
      type,
      amount,
      currency,
      status: "pending",
      metadata: { ...metadata, plan, tx_ref: txId },
    });
    if (txErr) throw txErr;

    let checkoutUrl = "";
    let gatewayRef = txId;

    // ── Flutterwave ──────────────────────────────────────────────────
    if (gateway === "flutterwave") {
      const FLW_KEY = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
      if (!FLW_KEY) throw new Error("Flutterwave secret key not configured");

      const res = await fetch("https://api.flutterwave.com/v3/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${FLW_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          tx_ref: txId,
          amount,
          currency,
          redirect_url: returnUrl,
          customer: { email: user.email, name: user.email },
          customizations: { title: "SkillsConnect Payment", logo: "" },
          meta: { type, plan, user_id: user.id },
        }),
      });
      const flwData = await res.json();
      if (flwData.status !== "success") throw new Error(`Flutterwave error: ${flwData.message}`);
      checkoutUrl = flwData.data.link;
    }

    // ── PayStack ─────────────────────────────────────────────────────
    if (gateway === "paystack") {
      const PS_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
      if (!PS_KEY) throw new Error("PayStack secret key not configured");

      const res = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: { Authorization: `Bearer ${PS_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          amount: Math.round(amount * 100), // Paystack uses kobo/cents
          currency,
          reference: txId,
          callback_url: returnUrl,
          metadata: { type, plan, user_id: user.id, custom_fields: [] },
        }),
      });
      const psData = await res.json();
      if (!psData.status) throw new Error(`PayStack error: ${psData.message}`);
      checkoutUrl = psData.data.authorization_url;
      gatewayRef = psData.data.reference;
    }

    // ── PayFast ──────────────────────────────────────────────────────
    if (gateway === "payfast") {
      const PF_MERCHANT_ID = Deno.env.get("PAYFAST_MERCHANT_ID");
      const PF_MERCHANT_KEY = Deno.env.get("PAYFAST_MERCHANT_KEY");
      const PF_PASSPHRASE = Deno.env.get("PAYFAST_PASSPHRASE");

      if (!PF_MERCHANT_ID || !PF_MERCHANT_KEY) throw new Error("PayFast credentials not configured");

      // Build PayFast form params (hosted payment page)
      const pfParams: Record<string, string> = {
        merchant_id: PF_MERCHANT_ID,
        merchant_key: PF_MERCHANT_KEY,
        return_url: returnUrl,
        cancel_url: `${req.headers.get("origin") ?? "https://trust-skill-connect.lovable.app"}/dashboard/payments?cancelled=1`,
        notify_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook`,
        email_address: user.email ?? "",
        amount: amount.toFixed(2),
        item_name: `SkillsConnect - ${type}`,
        m_payment_id: txId,
        custom_str1: user.id,
        custom_str2: type,
        custom_str3: plan ?? "",
      };

      if (PF_PASSPHRASE) {
        const paramStr = Object.entries(pfParams)
          .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, "+")}`)
          .join("&") + `&passphrase=${encodeURIComponent(PF_PASSPHRASE).replace(/%20/g, "+")}`;

        const msgBuffer = new TextEncoder().encode(paramStr);
        const hashBuffer = await crypto.subtle.digest("MD5", msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        pfParams.signature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
      }

      const query = new URLSearchParams(pfParams).toString();
      checkoutUrl = `https://www.payfast.co.za/eng/process?${query}`;
    }

    // Update tx with gateway ref
    await supabase.from("payment_transactions")
      .update({ gateway_ref: gatewayRef })
      .match({ user_id: user.id, metadata: { tx_ref: txId } });

    return new Response(JSON.stringify({ success: true, checkoutUrl, txId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("payment-initiate error:", err);
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
