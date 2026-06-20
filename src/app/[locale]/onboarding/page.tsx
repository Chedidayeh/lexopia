import React from "react";
import ParentOnboarding from "./on-boarding";
import { auth } from "@/src/auth";
import { redirect } from "next/navigation";

export default async function page() {
  const session = await auth();
  if (!session) {
    redirect("/")
  }

  return (
    <div className="">
      <ParentOnboarding />
    </div>
  );
}
