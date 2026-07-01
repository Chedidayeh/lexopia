import type { SubscriptionPlan } from "@/src/types/types";

type LemonSqueezySubscriptionAttributes = {
  status?: string;
  renews_at?: string | null;
  ends_at?: string | null;
  variant_id?: string | number | null;
  urls?: {
    customer_portal_update_subscription?: string | null;
  };
};

type LemonSqueezySubscriptionResponse = {
  success: boolean;
  status?: string;
  renewsAt?: string | null;
  endsAt?: string | null;
  variantId?: string | null;
  redirectUrl?: string;
  error?: string;
};

type UpdateSubscriptionOptions = {
  invoiceImmediately?: boolean;
  disableProrations?: boolean;
};

export async function createCheckout(email: string, plan: SubscriptionPlan, userId: string) {
  // Map plan to variant ID
  const variantMap: Record<SubscriptionPlan, string | undefined> = {
    FREE: undefined,
    PRO: process.env.LEMONSQUEEZY_VARIANT_ID_PRO,
    PRO_PLUS: process.env.LEMONSQUEEZY_VARIANT_ID_PRO_PLUS,
  };
  
  const variantId = variantMap[plan];
  
  if (!variantId) {
    throw new Error("Invalid plan for checkout");
  }
  
  const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: { 
            email,
            custom: { userId }
          },
          product_options: {
            redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/?payment=success&plan=${plan}`,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: process.env.LEMONSQUEEZY_STORE_ID } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    }),
  });

  const json = await res.json();
  return json.data?.attributes?.url as string;
}

export async function cancelSubscription(subscriptionId: string): Promise<{ success: boolean; endsAt?: string; error?: string }> {
  const res = await fetch(
    `https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
    }
  );

  if (!res.ok) {
    console.error("[cancelSubscription] API error:", res.status, res.statusText);
    return { success: false, error: `API error: ${res.status} ${res.statusText}` };
  }

  const json = await res.json();
  console.log("[cancelSubscription] Response:", JSON.stringify(json, null, 2));

  const endsAt = json.data?.attributes?.ends_at;
  return { success: true, endsAt };
}

export async function updateSubscription(
  subscriptionId: string,
  plan: SubscriptionPlan,
  options: UpdateSubscriptionOptions = {},
): Promise<LemonSqueezySubscriptionResponse> {
  const variantMap: Record<SubscriptionPlan, string | undefined> = {
    FREE: undefined,
    PRO: process.env.LEMONSQUEEZY_VARIANT_ID_PRO,
    PRO_PLUS: process.env.LEMONSQUEEZY_VARIANT_ID_PRO_PLUS,
  };

  const variantId = variantMap[plan];

  if (!variantId) {
    return { success: false, error: "Invalid plan for subscription update" };
  }

  const res = await fetch(
    `https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "subscriptions",
          id: subscriptionId,
          attributes: {
            variant_id: Number(variantId),
            ...(options.invoiceImmediately ? { invoice_immediately: true } : {}),
            ...(options.disableProrations ? { disable_prorations: true } : {}),
          },
        },
      }),
    },
  );

  const json = await res.json();

  if (!res.ok) {
    const message = json?.errors?.[0]?.detail || json?.error || `API error: ${res.status} ${res.statusText}`;
    console.error("[updateSubscription] API error:", res.status, res.statusText, json);
    return { success: false, error: message };
  }

  const attributes = json.data?.attributes as LemonSqueezySubscriptionAttributes | undefined;
  const redirectUrl = attributes?.urls?.customer_portal_update_subscription ?? undefined;

  if (redirectUrl) {
    return {
      success: true,
      redirectUrl,
      status: attributes?.status,
      renewsAt: attributes?.renews_at ?? null,
      endsAt: attributes?.ends_at ?? null,
      variantId: attributes?.variant_id != null ? String(attributes.variant_id) : variantId,
    };
  }

  return {
    success: true,
    status: attributes?.status,
    renewsAt: attributes?.renews_at ?? null,
    endsAt: attributes?.ends_at ?? null,
    variantId: attributes?.variant_id != null ? String(attributes.variant_id) : variantId,
  };
}