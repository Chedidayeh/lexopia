import Header from "./_components/Header";
import UpgradeButtonBar from "./_components/UpgradeButtonBar";
import { redirect } from "next/navigation";
import { RoleType } from "@/src/types/types";
import { auth } from "@/src/auth";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (session?.user.role === RoleType.PARENT && session?.user.newUser) {
    redirect("/onboarding");
  }

  return (
    <div>
      <Header />
      <UpgradeButtonBar />

      {children}
      {/* <audio
        ref={audioRef}
        preload="auto"
        playsInline
        loop
        src="/soundtracks/audio.mp3"
      /> */}
    </div>
  );
}
