import { SetupWizard } from "@/components/onboarding/SetupWizard";

export default function OnboardingPage() {
    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col">
            <SetupWizard />
        </main>
    );
}

