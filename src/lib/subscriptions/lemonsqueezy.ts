import type { SubscriptionPlan } from "@/src/types/types";

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
            redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success`,
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