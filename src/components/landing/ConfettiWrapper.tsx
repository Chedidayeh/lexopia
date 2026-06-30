"use client";

import { useRef, createContext, useContext } from "react";
import { Confetti, ConfettiRef } from "../ui/confetti";

const ConfettiContext = createContext<{
  fireConfetti: () => void;
} | null>(null);

export function useConfetti() {
  const context = useContext(ConfettiContext);
  if (!context) {
    throw new Error("useConfetti must be used within ConfettiWrapper");
  }
  return context;
}

interface ConfettiWrapperProps {
  children: React.ReactNode;
}

export function ConfettiWrapper({ children }: ConfettiWrapperProps) {
  const confettiRef = useRef<ConfettiRef>(null);

  const fireConfetti = () => {
    confettiRef.current?.fire({});
  };

  return (
    <ConfettiContext.Provider value={{ fireConfetti }}>
      <Confetti
        ref={confettiRef}
        className="fixed top-0 left-0 z-50 size-full pointer-events-none"
      />
      {children}
    </ConfettiContext.Provider>
  );
}
