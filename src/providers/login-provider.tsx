"use client";

import React, { createContext, useContext, useState } from "react";
import { LoginForm } from "@/src/components/shared/login-form";

type LoginContextType = {
  open: () => void;
  close: () => void;
};

const LoginContext = createContext<LoginContextType | undefined>(undefined);

export function LoginProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <LoginContext.Provider value={{ open, close }}>
      {children}
      <LoginForm hideTrigger open={isOpen} onOpenChange={(v) => setIsOpen(v)} />
    </LoginContext.Provider>
  );
}

export function useLoginModal() {
  const ctx = useContext(LoginContext);
  if (!ctx) throw new Error("useLoginModal must be used within LoginProvider");
  return ctx;
}

export default LoginProvider;
