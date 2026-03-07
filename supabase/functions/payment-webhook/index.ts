import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, verif-hash",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const gateway = url.searchParams.get("gateway") ?? "flutterwave";

  try {
    // ── Flutterwave Webhook ──────────────────────────────────────────
    if (gateway === "flutterwave") {
      const hash = req.headers.get("verif-hash");
      const secretHash = Deno.env.get("FLUTTERWAVE_WEBHOOK_HASH");
      if (secretHash && hash !== secretHash) {
        return new Response("Unauthorized", { status: 401 });
      }

      const payload = await req.json();
      if (payload.event === "charge.completed" && payload.data.status === "successful") {
        const txRef = payload.data.tx_ref;
        const amount = payload.data.amount;
        const userId = payload.data.meta?.user_id;

        await supabase.from("payment_transactions")
          .update({ status: "successful", gateway_ref: String(payload.data.id) })
          .eq("user_id", userId)
          .contains("metadata", { tx_ref: txRef });

        await creditWallet(supabase, userId, amount, txRef, "flutterwave", payload.data.meta);
      }
    }

    // ── PayStack Webhook ─────────────────────────────────────────────
    if (gateway === "paystack") {
      const signature = req.headers.get("x-paystack-signature");
      const psSecret = Deno.env.get("PAYSTACK_SECRET_KEY");

      if (psSecret && signature) {
        const body = await req.text();
        const key = await crypto.subtle.importKey(
          "raw", new TextEncoder().encode(psSecret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]
        );
        const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
        const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
        if (hex !== signature) return new Response("Unauthorized", { status: 401 });

        const payload = JSON.parse(body);
        if (payload.event === "charge.success") {
          const ref = payload.data.reference;
          const amount = payload.data.amount / 100;
          const userId = payload.data.metadata?.user_id;

          await supabase.from("payment_transactions")
            .update({ status: "successful", gateway_ref: ref })
            .eq("user_id", userId)
            .contains("metadata", { tx_ref: ref });

          await creditWallet(supabase, userId, amount, ref, "paystack", payload.data.metadata);
        }
      }
    }

    // ── PayFast ITN (Instant Transaction Notification) ───────────────
    if (gateway === "payfast") {
      const formData = await req.formData();
      const pfData = Object.fromEntries(formData.entries());

      if (pfData.payment_status === "COMPLETE") {
        const txRef = pfData.m_payment_id as string;
        const amount = parseFloat(pfData.amount_gross as string);
        const userId = pfData.custom_str1 as string;
        const meta = { type: pfData.custom_str2, plan: pfData.custom_str3 };

        await supabase.from("payment_transactions")
          .update({ status: "successful", gateway_ref: pfData.pf_payment_id as string })
          .eq("user_id", userId)
          .contains("metadata", { tx_ref: txRef });

        await creditWallet(supabase, userId, amount, txRef, "payfast", meta);
      }
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("payment-webhook error:", err);
    return new Response("Error", { status: 500 });
  }
});

async function creditWallet(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  amount: number,
  txRef: string,
  gateway: string,
  meta: Record<string, unknown>
) {
  // Handle subscription plan upgrades
  if (meta?.plan && meta.plan !== "starter") {
    await supabase.from("subscriptions")
      .update({ plan: meta.plan, is_active: true })
      .eq("user_id", userId);
  }

  // For deposits/task payments — credit wallet
  if (meta?.type === "deposit" || meta?.type === "task_escrow") {
    const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", userId).single();
    if (wallet) {
      const newBalance = (wallet.balance ?? 0) + amount;
      await supabase.from("wallets").update({ balance: newBalance }).eq("user_id", userId);
    }
  }

  console.log(`✅ Payment confirmed — user=${userId} amount=${amount} gateway=${gateway} ref=${txRef}`);
}
