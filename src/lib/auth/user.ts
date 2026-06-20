import type { User } from "@prisma/client";
import type { User as NextAuthUser } from "next-auth";
import { prisma } from "@/src/lib/prisma";
import { RoleType } from "@/src/types/types";

export function toAuthUser(user: User): NextAuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? user.email,
    role: user.role as RoleType,
    newUser: user.newUser,
    parentId: user.id,
  };
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function upsertGoogleUser(input: {
  email: string;
  name?: string | null;
  image?: string | null;
  providerAccountId: string;
}) {
  const email = input.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: input.name ?? undefined,
      image: input.image ?? undefined,
      emailVerified: new Date(),
    },
    create: {
      email,
      name: input.name,
      image: input.image,
      emailVerified: new Date(),
      role: "PARENT",
      newUser: true,
    },
  });

  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId: input.providerAccountId,
      },
    },
    update: {
      userId: user.id,
    },
    create: {
      userId: user.id,
      type: "oauth",
      provider: "google",
      providerAccountId: input.providerAccountId,
    },
  });

  return { user, isNewUser: !existing };
}
