import { NextResponse } from "next/server";

export async function GET() {
  const envVars = {
    LEMONSQUEEZY_VARIANT_ID_PRO: process.env.LEMONSQUEEZY_VARIANT_ID_PRO,
    LEMONSQUEEZY_VARIANT_ID_PRO_PLUS: process.env.LEMONSQUEEZY_VARIANT_ID_PRO_PLUS,
    LEMONSQUEEZY_WEBHOOK_SECRET: process.env.LEMONSQUEEZY_WEBHOOK_SECRET ? "***SET***" : "***NOT SET***",
    LEMONSQUEEZY_API_KEY: process.env.LEMONSQUEEZY_API_KEY ? "***SET***" : "***NOT SET***",
    LEMONSQUEEZY_STORE_ID: process.env.LEMONSQUEEZY_STORE_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  const variantMapping = {
    pro: {
      envVar: "LEMONSQUEEZY_VARIANT_ID_PRO",
      value: process.env.LEMONSQUEEZY_VARIANT_ID_PRO,
      status: process.env.LEMONSQUEEZY_VARIANT_ID_PRO ? "CONFIGURED" : "MISSING",
    },
    proPlus: {
      envVar: "LEMONSQUEEZY_VARIANT_ID_PRO_PLUS",
      value: process.env.LEMONSQUEEZY_VARIANT_ID_PRO_PLUS,
      status: process.env.LEMONSQUEEZY_VARIANT_ID_PRO_PLUS ? "CONFIGURED" : "MISSING",
    },
  };

  const issues = [];
  if (!process.env.LEMONSQUEEZY_VARIANT_ID_PRO) {
    issues.push("LEMONSQUEEZY_VARIANT_ID_PRO is not set");
  }
  if (!process.env.LEMONSQUEEZY_VARIANT_ID_PRO_PLUS) {
    issues.push("LEMONSQUEEZY_VARIANT_ID_PRO_PLUS is not set");
  }
  if (!process.env.LEMONSQUEEZY_WEBHOOK_SECRET) {
    issues.push("LEMONSQUEEZY_WEBHOOK_SECRET is not set");
  }
  if (!process.env.LEMONSQUEEZY_API_KEY) {
    issues.push("LEMONSQUEEZY_API_KEY is not set");
  }
  if (!process.env.LEMONSQUEEZY_STORE_ID) {
    issues.push("LEMONSQUEEZY_STORE_ID is not set");
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    envVars,
    variantMapping,
    issues,
    status: issues.length === 0 ? "HEALTHY" : "CONFIGURATION_ERROR",
  });
}
