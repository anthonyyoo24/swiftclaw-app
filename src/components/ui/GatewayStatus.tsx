"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

/**
 * Status of the OpenClaw Gateway.
 * online: Gateway is running and reachable.
 * offline: Gateway is not responding.
 * connecting: An attempt to reach the gateway is in progress.
 * error: A terminal or authentication error occurred.
 */
export type GatewayStatusType = "online" | "offline" | "connecting" | "error";

interface GatewayStatusProps {
    status: GatewayStatusType;
    className?: string;
}

const statusConfig: Record<GatewayStatusType, {
    label: string;
    color: string;
    icon: string;
    dotColor: string;
}> = {
    online: {
        label: "Online",
        color: "text-emerald-400 bg-emerald-400/5 hover:bg-emerald-400/10 border-emerald-400/20",
        icon: "solar:check-circle-bold",
        dotColor: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]",
    },
    offline: {
        label: "Offline",
        color: "text-neutral-500 bg-neutral-500/5 hover:bg-neutral-500/10 border-neutral-500/10",
        icon: "solar:close-circle-bold",
        dotColor: "bg-neutral-500",
    },
    connecting: {
        label: "Connecting",
        color: "text-amber-400 bg-amber-400/5 hover:bg-amber-400/10 border-amber-400/20",
        icon: "solar:refresh-bold",
        dotColor: "bg-amber-400 animate-pulse",
    },
    error: {
        label: "Error",
        color: "text-rose-400 bg-rose-400/5 hover:bg-rose-400/10 border-rose-400/20",
        icon: "solar:danger-bold",
        dotColor: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.4)]",
    },
};

/**
 * Small pill-shaped status indicator for the OpenClaw Gateway.
 * Shows status icon, label, and a status dot.
 */
export function GatewayStatus({ status, className }: GatewayStatusProps) {
    const config = statusConfig[status];

    return (
        <div className={cn(
            "group flex items-center gap-2 px-3 py-1.5 rounded-full border bg-neutral-900/40 backdrop-blur-md transition-all duration-300 no-drag cursor-default",
            config.color,
            className
        )}>
            {/* Status Dot */}
            {/* <div className={cn("size-1.5 rounded-full", config.dotColor)} /> */}

            <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold tracking-widest uppercase opacity-80 leading-none">
                    Gateway
                </span>
                <span className="text-[10px] font-bold tracking-widest uppercase leading-none border-l border-white/10 pl-1.5">
                    {config.label}
                </span>
            </div>

            <Icon
                icon={config.icon}
                className={cn(
                    "size-3 opacity-90 transition-transform duration-500",
                    status === "connecting" ? "animate-spin" : "group-hover:scale-110"
                )}
            />
        </div>
    );
}
