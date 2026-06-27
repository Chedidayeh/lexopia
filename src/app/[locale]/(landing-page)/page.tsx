

import { auth } from "@/src/auth";
import Hero from "@/src/components/landing/hero";
import { Pricing } from "@/src/components/landing/Pricing";


export default async function Home() {
  const session = await auth()

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/landing-page/bg.jpg')" }}
      />
      <div className="fixed inset-0 -z-10 pointer-events-none bg-linear-to-b from-black/70 via-black/60 to-black/80" />

      <div className="relative z-10 h-150 flex flex-col items-center justify-center">
        <Hero session={session} />
      </div>

      <section id="pricing" className="relative z-10 w-full">
        <Pricing />
      </section>
    </div>
  );
}
