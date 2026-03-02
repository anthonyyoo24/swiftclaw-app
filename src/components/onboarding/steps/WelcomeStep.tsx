import { Zap, ArrowRight } from "lucide-react";

interface StepProps {
    onNext: () => void;
    onBack: () => void;
    onComplete: () => void;
}

export function WelcomeStep({ onNext }: StepProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
            <div className="flex flex-col items-center max-w-lg mx-auto space-y-8 my-auto">
                <div className="w-20 h-20 rounded-2xl bg-gray-900 flex items-center justify-center text-white shadow-md">
                    <Zap className="w-10 h-10" strokeWidth={1.5} />
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
                        Welcome to SwiftClaw
                    </h1>
                    <p className="text-lg text-gray-500 leading-relaxed">
                        Your Digital Twin, Crafted in Minutes. Let's set up your premium AI workspace and connect it to your communication channels.
                    </p>
                </div>

                <div className="pt-4">
                    <button
                        onClick={onNext}
                        className="bg-gray-900 text-white px-8 py-3.5 rounded-xl text-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-900/10 transition-all flex items-center gap-2 shadow-sm"
                    >
                        Get Started
                        <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                </div>
            </div>
        </div>
    );
}
