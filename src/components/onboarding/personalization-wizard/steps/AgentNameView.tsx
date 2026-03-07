import { Input } from "@/components/ui/input";

interface AgentNameViewProps {
    name: string;
    onChange: (name: string) => void;
}

export function AgentNameView({ name, onChange }: AgentNameViewProps) {
    return (
        <div className="w-full max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-3">
                <h1 className="text-3xl font-bold tracking-tight text-white">What should the agent call itself?</h1>
                <p className="text-lg text-neutral-400">e.g., &quot;Clawd&quot;, &quot;Jarvis&quot;, or a custom name.</p>
            </div>

            <div className="space-y-4">
                <Input
                    autoFocus
                    value={name}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Agent Name..."
                    className="h-16 text-2xl px-6 bg-white/5 border-white/10 hover:border-white/20 focus:border-blue-500/50 focus:ring-blue-500/20 text-center shadow-inner rounded-2xl"
                />
            </div>
        </div>
    );
}
