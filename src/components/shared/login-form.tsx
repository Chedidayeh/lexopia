"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { cn } from "@/src/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import {
  credentialsSignInAction,
  registerAction,
} from "@/src/actions/auth-actions";

interface LoginFormProps extends React.ComponentProps<"div"> {
  hideTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function getErrorTranslationKey(code?: string, message?: string): string {
  if (!code) return "errors.loginFailed";

  if (code === "UNAUTHORIZED" && message) {
    if (message.toLowerCase().includes("password")) {
      return "errors.passwordIncorrect";
    }
    if (
      message.toLowerCase().includes("email") ||
      message.toLowerCase().includes("account")
    ) {
      return "errors.unauthorized";
    }
  }

  const errorCodeMap: Record<string, string> = {
    UNAUTHORIZED: "errors.unauthorized",
    CONFLICT: "errors.emailAlreadyExists",
    INVALID_CREDENTIALS: "errors.invalidCredentials",
    USER_NOT_FOUND: "errors.userNotFound",
    EMAIL_ALREADY_EXISTS: "errors.emailAlreadyExists",
    INVALID_EMAIL: "errors.invalidEmail",
    PASSWORD_TOO_WEAK: "errors.passwordTooWeak",
    FULL_NAME_REQUIRED: "errors.fullNameRequired",
    REGISTRATION_FAILED: "errors.registrationFailed",
    LOGIN_FAILED: "errors.loginFailed",
  };

  return errorCodeMap[code] || "errors.loginFailed";
}

export function LoginForm({
  className,
  hideTrigger = false,
  open,
  onOpenChange,
}: LoginFormProps) {
  const t = useTranslations("LoginForm");
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAuthSuccess() {
    onOpenChange?.(false);
    router.refresh();
    toast.success(
      isSignUp ? t("errors.accountCreatedAndLoggedIn") : t("errors.loggedIn"),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          setError(t("errors.fullNameRequired"));
          return;
        }
        if (password.length < 8) {
          setError(t("passwordTooShort"));
          return;
        }
        if (password !== confirmPassword) {
          setError(t("passwordsNotMatch"));
          return;
        }

        const registerResult = await registerAction({ email, password, name });
        if (!registerResult.success) {
          const errorKey = getErrorTranslationKey(
            registerResult.error?.code,
            registerResult.error?.message,
          );
          setError(t(errorKey));
          return;
        }
      }

      const signInResult = await credentialsSignInAction({ email, password });
      if (!signInResult.success) {
        const errorKey = getErrorTranslationKey(
          signInResult.error?.code,
          signInResult.error?.message,
        );
        setError(t(errorKey));
        return;
      }

      await handleAuthSuccess();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Authentication failed";
      setError(message);
      console.error("[LoginForm] Auth error:", message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button size={"sm"} id="about">
            {t("buttonLogin")}
          </Button>
        </DialogTrigger>
      )}
      <DialogTitle></DialogTitle>
      <DialogContent showCloseButton={false}>
        <div className={cn("flex flex-col space-y-1", className)}>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">
                {isSignUp ? t("titleCreate") : t("titleWelcome")}
              </CardTitle>
              <CardDescription>
                {isSignUp ? t("descriptionSignUp") : t("descriptionLogin")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  {error && (
                    <div className="mb-4 p-3 bg-red-100 border text-red-700 rounded text-sm">
                      {error}
                    </div>
                  )}

                  <Field>
                    <Button
                      variant="outline"
                      type="button"
                      className="w-full"
                      disabled={isLoading}
                      onClick={() =>
                        signIn("google", { callbackUrl: "/" })
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="mr-2 h-4 w-4"
                      >
                        <path
                          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                          fill="currentColor"
                        />
                      </svg>
                      {isSignUp ? t("signUpWithGoogle") : t("loginWithGoogle")}
                    </Button>
                  </Field>

                  <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                    {t("orContinueWith")}
                  </FieldSeparator>

                  {isSignUp && (
                    <Field>
                      <FieldLabel htmlFor="name">{t("fullNameLabel")}</FieldLabel>
                      <Input
                        id="name"
                        type="text"
                        placeholder={t("fullNamePlaceholder")}
                        className="bg-background"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </Field>
                  )}

                  <Field>
                    <FieldLabel htmlFor="email">{t("emailLabel")}</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      className="bg-background"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </Field>

                  <Field>
                    <div className="flex items-center">
                      <FieldLabel htmlFor="password">
                        {t("passwordLabel")}
                      </FieldLabel>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder={t("passwordPlaceholder")}
                        className="pr-10 bg-background"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:bg-muted/10"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {!isSignUp && (
                      <a
                        href="#"
                        className="ml-auto text-sm underline-offset-4 hover:underline"
                      >
                        {t("forgotPassword")}
                      </a>
                    )}
                  </Field>

                  {isSignUp && (
                    <Field>
                      <FieldLabel htmlFor="confirmPassword">
                        {t("confirmPasswordLabel")}
                      </FieldLabel>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          placeholder={t("passwordPlaceholder")}
                          className="pr-10 bg-background"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((s) => !s)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:bg-muted/10"
                          aria-label={
                            showConfirmPassword
                              ? "Hide confirm password"
                              : "Show confirm password"
                          }
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p className="text-sm text-red-600 mt-1">
                          {t("passwordsNotMatch")}
                        </p>
                      )}
                      {password && password.length < 8 && (
                        <p className="text-sm text-yellow-600 mt-1">
                          {t("passwordTooShort")}
                        </p>
                      )}
                    </Field>
                  )}

                  <Field>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading
                        ? t("buttonLoading")
                        : isSignUp
                          ? t("buttonCreate")
                          : t("buttonLogin")}
                    </Button>
                    <FieldDescription className="text-center">
                      {isSignUp ? (
                        <>
                          {t("haveAccount")}{" "}
                          <button
                            type="button"
                            className="underline-offset-4 text-primary hover:underline"
                            onClick={() => setIsSignUp(false)}
                            disabled={isLoading}
                          >
                            {t("logIn")}
                          </button>
                        </>
                      ) : (
                        <>
                          {t("noAccount")}{" "}
                          <button
                            type="button"
                            className="underline-offset-4 text-primary hover:underline"
                            onClick={() => setIsSignUp(true)}
                            disabled={isLoading}
                          >
                            {t("signUp")}
                          </button>
                        </>
                      )}
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
          <FieldDescription className="px-6 text-center">
            {t("tosAgreement")}
          </FieldDescription>
        </div>
      </DialogContent>
    </Dialog>
  );
}
