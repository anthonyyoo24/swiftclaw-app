import { WelcomeIllustration } from "../WelcomeIllustration";
import { StepHeader } from "@/components/onboarding/shared/StepHeader";

export function WelcomeStep() {
    return (
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <StepHeader
                title="Welcome to SwiftClaw"
                description="We'll start by learning about you, provide an agent recommendation, and finally complete the system configuration to deploy it."
                icon="solar:hand-stars-linear"
            />

            <WelcomeIllustration />
        </div>
    );
}
