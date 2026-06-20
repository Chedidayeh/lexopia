import type { User } from "next-auth";
import { verifyPassword } from "@/src/lib/password";
import { findUserByEmail, toAuthUser } from "@/src/lib/auth/user";
import { normalizeEmail } from "@/src/lib/auth/validators";

export async function authenticateCredentials(
  email: string,
  password: string,
): Promise<User | null> {
  const user = await findUserByEmail(normalizeEmail(email));

  if (!user?.password) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return null;
  }

  return toAuthUser(user);
}
