import { Icon } from "@iconify/react";

export function WelcomeIllustration() {
    return (
        <div className="relative w-full flex-1 mb-8 shrink-0 min-h-80">
            {/* Connecting Line */}
            <svg
                className="absolute inset-0 w-full h-full text-blue-500 drop-shadow-[0_0_12px_rgba(59,130,246,0.8)] opacity-70 animate-pulse"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{ overflow: "visible" }}
            >
                <path
                    d="M 15 25 C 40 25, 20 75, 50 75 C 80 75, 60 25, 85 25"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                    strokeDasharray="6 6"
                    className="animate-dash-flow"
                />
            </svg>

            {/* Icon 1: Circuitry (Top Left) */}
            <div className="absolute left-[15%] top-[25%] -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl bg-[#09090b] border border-blue-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)] z-10">
                <Icon icon="solar:cpu-linear" className="text-2xl text-blue-400" />
                <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-48 text-center flex flex-col items-center pointer-events-none">
                    <span className="text-white text-sm font-semibold">
                        System Configuration
                    </span>
                    <span className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                        Define the technical foundations.
                    </span>
                </div>
            </div>

            {/* Icon 2: Brain (Middle Bottom) */}
            <div className="absolute left-[50%] top-[75%] -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl bg-[#09090b] border border-blue-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)] z-10">
                <Icon icon="lucide:brain" className="text-2xl text-blue-400" />
                <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-48 text-center flex flex-col items-center pointer-events-none">
                    <span className="text-white text-sm font-semibold">
                        Agent Personalization
                    </span>
                    <span className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                        Refine the personality and voice.
                    </span>
                </div>
            </div>

            {/* Icon 3: Handshake (Top Right) */}
            <div className="absolute left-[85%] top-[25%] -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl bg-[#09090b] border border-blue-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)] z-10">
                <Icon icon="lucide:handshake" className="text-2xl text-blue-400" />
                <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 text-center flex flex-col items-center pointer-events-none w-48">
                    <span className="text-white text-sm font-semibold">
                        Define the Relationship
                    </span>
                    <span className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                        Provide context about you and your goals to establish how
                        you and your agent will work together.
                    </span>
                </div>
            </div>
        </div>
    );
}
