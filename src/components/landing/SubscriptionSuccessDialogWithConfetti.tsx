"use client";

import { SubscriptionSuccessToast } from "./SubscriptionSuccessDialog";
import { ConfettiWrapper, useConfetti } from "./ConfettiWrapper";

export function SubscriptionSuccessDialogWithConfetti() {
  return (
    <ConfettiWrapper>
      <SubscriptionSuccessToastWithConfetti />
    </ConfettiWrapper>
  );
}

function SubscriptionSuccessToastWithConfetti() {
  const { fireConfetti } = useConfetti();

  return <SubscriptionSuccessToast onOpen={fireConfetti} />;
}
