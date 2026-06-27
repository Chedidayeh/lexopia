import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import authConfig from "./auth.config";
import { authenticateCredentials } from "./lib/auth/credentials";
import { toAuthUser, upsertGoogleUser } from "./lib/auth/user";
import { RoleType, SubscriptionPlan } from "./types/types";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    role: RoleType;
    newUser: boolean;
    subscriptionPlan: SubscriptionPlan;
    childId?: string;
    parentId?: string;
    token?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: RoleType;
      newUser?: boolean;
      subscriptionPlan?: SubscriptionPlan;
      childId?: string;
      parentId?: string;
      token?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    email?: string;
    name?: string;
    role?: RoleType;
    newUser?: boolean;
    subscriptionPlan?: SubscriptionPlan;
    childId?: string;
    parentId?: string;
    accessToken?: string;
  }
}

export const { auth, handlers, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        return authenticateCredentials(email, password);
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: parseInt(process.env.JWT_EXPIRATION ?? "604800", 10),
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user.email) {
        const { user: dbUser } = await upsertGoogleUser({
          email: user.email,
          name: user.name ?? profile?.name,
          image: user.image,
          providerAccountId: account.providerAccountId,
        });

        Object.assign(user, toAuthUser(dbUser));
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.user) {
        if (session.user.newUser !== undefined) {
          token.newUser = session.user.newUser;
        }
        if (session.user.subscriptionPlan !== undefined) {
          token.subscriptionPlan = session.user.subscriptionPlan;
        }
        if (session.user.childId !== undefined) {
          token.childId = session.user.childId;
        }
      }

      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.childId = user.childId;
        token.parentId = user.parentId ?? user.id;
        token.accessToken = user.token;
        token.newUser = user.newUser;
        token.subscriptionPlan = user.subscriptionPlan;
      }

      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.email = token.email as string;
      session.user.name = token.name as string;
      session.user.role = token.role as RoleType;
      session.user.childId = token.childId as string | undefined;
      session.user.parentId = token.parentId as string | undefined;
      session.user.token = token.accessToken as string | undefined;
      session.user.newUser = token.newUser as boolean;
      session.user.subscriptionPlan = token.subscriptionPlan as SubscriptionPlan;
      return session;
    },
  },
});
