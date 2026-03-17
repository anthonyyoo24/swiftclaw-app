import { OnboardingGuard } from "@/components/guards/OnboardingGuard";
import { SetupWizard } from "@/components/onboarding/setup-wizard/SetupWizard";

export default function OnboardingPage() {
    return (
        <OnboardingGuard>
            <main className="min-h-screen bg-background text-foreground flex flex-col">
                <SetupWizard />
            </main>
        </OnboardingGuard>
    );
}

