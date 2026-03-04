import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default function OnboardingPage() {
    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col">
            <OnboardingWizard />
        </main>
    );
}

