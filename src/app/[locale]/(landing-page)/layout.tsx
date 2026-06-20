import Footer from "@/src/components/landing/Footer";
import Header from "./_components/Header";
import { auth } from "@/src/auth";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header session={session} />
      <main className="flex-1">{children}</main>
      {/* <Footer /> */}
    </div>
  );
}
