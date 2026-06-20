import { useEffect, useRef } from "react";
import * as PusherPushNotifications from "@pusher/push-notifications-web";
import { Session } from "next-auth";

export const usePusherBeams = (session : Session | null) => {
  const beamsClientRef = useRef<PusherPushNotifications.Client | null>(null);
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    const parentId = session.user.id;

    const init = async () => {
      try {
        if (subscribedRef.current) return;

        if (!beamsClientRef.current) {
          beamsClientRef.current = new PusherPushNotifications.Client({
            instanceId: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID!,
          });
        }

        const beamsClient = beamsClientRef.current;
        console.log("Starting Pusher Beams client..." ,  beamsClient);

        await beamsClient.start();

        const alreadySubscribed =
          localStorage.getItem(`beams_${parentId}`) === "true";

        if (!alreadySubscribed) {
          await beamsClient.addDeviceInterest(parentId);
          localStorage.setItem(`beams_${parentId}`, "true");
        }

        subscribedRef.current = true;
      } catch (error) {
        console.error("Pusher Beams init failed:", error);
      }
    };

    init();
  }, [session]);
};