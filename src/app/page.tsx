"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simple MVP check for onboarding state
    const onboardingComplete = localStorage.getItem("onboardingComplete");

    if (!onboardingComplete) {
      router.push("/onboarding");
    } else {
      setIsReady(true);
    }
  }, [router]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-muted rounded-full mb-4"></div>
          <div className="h-4 w-24 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <main className="flex flex-col items-center justify-center space-y-8 p-8 max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">Main Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Welcome back to SwiftClaw. Your digital twin is ready.
        </p>
        <button
          onClick={() => {
            localStorage.removeItem("onboardingComplete");
            router.push("/onboarding");
          }}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          Reset Onboarding
        </button>
      </main>
    </div>
  );
}
