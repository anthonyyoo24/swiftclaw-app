import { Button } from "@/components/ui/button";

interface StepProps {
    onNext: () => void;
    onBack: () => void;
    onSkip: () => void;
}

export function WelcomeStep({ onNext }: StepProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
                {/* Placeholder for Logo */}
                <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-12 h-12 text-primary"
                    >
                        <path d="M12 2v20" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                </div>
                <h1 className="text-4xl font-bold tracking-tight">Welcome to SwiftClaw</h1>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                    Your Digital Twin, Crafted in Minutes. Let's set up your premium AI workspace.
                </p>
            </div>

            <div className="pt-8">
                <Button size="lg" onClick={onNext} className="h-12 px-8 text-md shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
                    Get Started
                </Button>
            </div>
        </div>
    );
}
