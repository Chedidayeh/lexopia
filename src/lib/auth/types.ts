export type AuthErrorCode =
  | "INVALID_EMAIL"
  | "PASSWORD_TOO_WEAK"
  | "FULL_NAME_REQUIRED"
  | "EMAIL_ALREADY_EXISTS"
  | "INVALID_CREDENTIALS"
  | "USER_NOT_FOUND"
  | "UNAUTHORIZED"
  | "REGISTRATION_FAILED"
  | "LOGIN_FAILED";

export type AuthActionError = {
  code: AuthErrorCode;
  message: string;
};

export type AuthActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: AuthActionError };

export type RegisterInput = {
  email: string;
  password: string;
  name: string;
};

export type CredentialsSignInInput = {
  email: string;
  password: string;
};
