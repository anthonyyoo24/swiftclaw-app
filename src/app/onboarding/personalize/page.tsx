import { PersonalizationWizard } from "@/components/onboarding/PersonalizationWizard";

export default function PersonalizePage() {
    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col">
            <PersonalizationWizard />
        </main>
    );
}
