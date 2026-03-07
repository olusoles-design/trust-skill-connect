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

    const { amount, method, bankName, accountNumber, accountHolder, mobileNumber } = await req.json();

    if (!amount || !method) throw new Error("Missing required fields: amount, method");
    if (amount < 50) throw new Error("Minimum withdrawal amount is R50");

    const validMethods = ["bank_eft", "capitec_pay", "mobile_money", "voucher"];
    if (!validMethods.includes(method)) throw new Error("Invalid withdrawal method");

    // Check wallet balance
    const { data: wallet, error: walletErr } = await supabase.from("wallets")
      .select("balance").eq("user_id", user.id).single();
    if (walletErr || !wallet) throw new Error("Wallet not found");
    if (wallet.balance < amount) throw new Error("Insufficient wallet balance");

    // Deduct from wallet immediately (hold)
    await supabase.from("wallets")
      .update({ balance: wallet.balance - amount })
      .eq("user_id", user.id);

    // Create withdrawal request
    const { data: withdrawal, error: wErr } = await supabase.from("withdrawal_requests").insert({
      user_id: user.id,
      amount,
      method,
      bank_name: bankName,
      account_number: accountNumber,
      account_holder: accountHolder,
      mobile_number: mobileNumber,
      status: "pending",
    }).select().single();
    if (wErr) throw wErr;

    // Log transaction
    await supabase.from("payment_transactions").insert({
      user_id: user.id,
      gateway: method === "bank_eft" || method === "capitec_pay" ? "paystack" : "flutterwave",
      type: "withdrawal",
      amount,
      status: "pending",
      metadata: { withdrawal_id: withdrawal.id, method },
    });

    return new Response(JSON.stringify({ success: true, withdrawal }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("wallet-withdraw error:", err);
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
