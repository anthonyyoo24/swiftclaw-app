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
            <div className="h-full border border-white/10 rounded-2xl p-5 bg-[#0a0a0c] hover:bg-white/5 peer-checked:border-blue-500/50 peer-checked:bg-blue-500/5 transition-all">
                <div className="absolute top-4 right-4 w-4 h-4 rounded-full border border-white/20 peer-checked:border-blue-500 peer-checked:bg-blue-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
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
