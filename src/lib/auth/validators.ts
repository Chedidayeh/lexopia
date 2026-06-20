const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(normalizeEmail(email));
}

export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

export function validateName(name: string): boolean {
  return name.trim().length >= 2;
}
