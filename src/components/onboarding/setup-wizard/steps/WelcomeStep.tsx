import { WelcomeIllustration } from "../WelcomeIllustration";
import { StepHeader } from "@/components/onboarding/shared/StepHeader";

export function WelcomeStep() {
    return (
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <StepHeader
                title="Welcome to SwiftClaw"
                description="To get your agent up and running, we'll walk you through three essential setup stages. Once your agent is deployed, we'll move into a focused personalization wizard to fine-tune your specific preferences."
                icon="solar:hand-stars-linear"
            />

            <WelcomeIllustration />
        </div>
    );
}
