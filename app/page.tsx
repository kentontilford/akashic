"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const onboarded = localStorage.getItem("akashic.onboarded");
    router.push(onboarded ? "/terminal" : "/onboarding");
  }, [router]);
  return null;
}
