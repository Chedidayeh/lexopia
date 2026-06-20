import authConfig from "./auth.config";
import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!_next|api|trpc|.*\\..*).*)"],
};
