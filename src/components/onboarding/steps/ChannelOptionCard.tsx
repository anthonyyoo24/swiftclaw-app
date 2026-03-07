import { Icon } from "@iconify/react";

interface ChannelOption {
    id: string;
    name: string;
    description: string;
    icon: string;
    colorClass: string;
    tokenLabel: string;
}

interface ChannelOptionCardProps {
    channel: ChannelOption;
    isSelected: boolean;
    onSelect: (id: string) => void;
}

/**
 * Styled radio card for selecting a communication channel in the setup wizard.
 */
export function ChannelOptionCard({ channel, isSelected, onSelect }: ChannelOptionCardProps) {
    return (
        <label className="cursor-pointer group relative">
            <input
                type="radio"
                name="channel"
                className="peer sr-only"
                checked={isSelected}
                onChange={() => onSelect(channel.id)}
            />
            <div className={`h-full border rounded-2xl p-5 bg-[#0a0a0c] transition-all ${isSelected ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 hover:bg-white/5'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${channel.colorClass}`}>
                    <Icon icon={channel.icon} className="text-2xl" />
                </div>
                <h3 className="font-medium text-sm text-white mb-1">{channel.name}</h3>
                <p className="text-xs text-neutral-500">{channel.description}</p>
            </div>
        </label>
    );
}

export type { ChannelOption };
