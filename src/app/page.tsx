"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Simple MVP check for onboarding state
    const onboardingComplete = localStorage.getItem("onboardingComplete");

    if (!onboardingComplete) {
      router.push("/onboarding");
    } else {
      router.push("/dashboard");
    }
  }, [router]);

  // Optionally show a full-screen loader while the redirect happens
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 bg-muted rounded-full mb-4"></div>
        <div className="h-4 w-24 bg-muted rounded"></div>
      </div>
    </div>
  );
}
