// supabase/functions/_shared/paystack.ts
// Minimal, typed wrapper around the two Paystack endpoints this backend needs.
// PAYSTACK_SECRET_KEY must be set as a Supabase project secret and is never exposed
// to the client — only these server-side Edge Functions ever see it.

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

interface InitializeParams {
  email: string;
  amountNaira: number; // major unit (naira); converted to kobo internally
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

interface InitializeResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export async function paystackInitializeTransaction(
  params: InitializeParams,
): Promise<InitializeResult> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amountNaira * 100), // Paystack expects kobo
      currency: "NGN",
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata ?? {},
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(`PAYSTACK_INIT_FAILED: ${json.message ?? res.statusText}`);
  }
  return json.data as InitializeResult;
}

interface VerifyResult {
  status: "success" | "failed" | "abandoned";
  reference: string;
  amount: number; // kobo
  currency: string;
  channel: string;
  gateway_response: string;
  paid_at: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Independently re-verifies a transaction directly with Paystack (server-to-server).
 * Never trust a webhook payload's `status` field alone — always call this before
 * crediting an order, per Paystack's own integration guidance.
 */
export async function paystackVerifyTransaction(reference: string): Promise<VerifyResult> {
  const res = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } },
  );

  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(`PAYSTACK_VERIFY_FAILED: ${json.message ?? res.statusText}`);
  }
  return json.data as VerifyResult;
}

/**
 * Verifies the `x-paystack-signature` header using HMAC-SHA512 over the raw request
 * body, exactly as Paystack's webhook documentation specifies. Must be called with the
 * RAW body text (before any JSON.parse), since re-serializing JSON can change byte
 * layout and invalidate the signature.
 */
export async function verifyPaystackSignature(
  rawBody: string,
  signatureHeader: string | null,
): Promise<boolean> {
  if (!signatureHeader) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(PAYSTACK_SECRET_KEY),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const computedHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // constant-time-ish comparison
  if (computedHex.length !== signatureHeader.length) return false;
  let diff = 0;
  for (let i = 0; i < computedHex.length; i++) {
    diff |= computedHex.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
  }
  return diff === 0;
}
