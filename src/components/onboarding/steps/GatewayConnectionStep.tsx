"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Wifi, AlertCircle } from "lucide-react";

interface StepProps {
    onNext: () => void;
    onBack: () => void;
    onSkip: () => void;
}

type ConnectionStatus = "idle" | "connecting" | "success" | "error";

export function GatewayConnectionStep({ onSkip, onBack }: StepProps) {
    const [status, setStatus] = useState<ConnectionStatus>("idle");

    const handleConnect = () => {
        setStatus("connecting");
        // Simulate connection to Gateway
        setTimeout(() => {
            // In a real app, this would be an actual WS connection attempt
            const success = Math.random() > 0.3; // 70% chance of success for testing
            setStatus(success ? "success" : "error");

            if (success) {
                setTimeout(() => {
                    onSkip(); // Redirect to dashboard on success
                }, 1500);
            }
        }, 2000);
    };

    return (
        <div className="w-full flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="space-y-4">
                {/* Connection Status Icon */}
                <div className="w-24 h-24 mx-auto rounded-full bg-secondary flex items-center justify-center relative">
                    {status === "idle" && <Wifi className="w-10 h-10 text-muted-foreground" />}
                    {status === "connecting" && <Loader2 className="w-10 h-10 text-primary animate-spin" />}
                    {status === "success" && <CheckCircle className="w-12 h-12 text-green-500 animate-in zoom-in duration-300" />}
                    {status === "error" && <AlertCircle className="w-12 h-12 text-destructive animate-in shake duration-300" />}
                </div>

                <h2 className="text-3xl font-bold tracking-tight">Connect to Gateway</h2>
                <p className="text-muted-foreground max-w-sm mx-auto">
                    SwiftClaw connects locally to the OpenClaw engine. Ensure your gateway is running on port 18789.
                </p>
            </div>

            {status === "error" && (
                <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-lg flex items-start text-left">
                    <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                    <p>
                        Failed to connect to `ws://localhost:18789`. Make sure the OpenClaw gateway is running and try again.
                    </p>
                </div>
            )}

            <div className="flex flex-col w-full max-w-xs gap-4 pt-4">
                <Button
                    size="lg"
                    onClick={handleConnect}
                    disabled={status === "connecting" || status === "success"}
                    className={`h-12 w-full transition-all ${status === "success" ? "bg-green-500 hover:bg-green-600 text-white" : ""}`}
                >
                    {status === "idle" && "Connect Now"}
                    {status === "connecting" && (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                        </>
                    )}
                    {status === "success" && "Connected!"}
                    {status === "error" && "Retry Connection"}
                </Button>

                <div className="flex items-center gap-4 justify-between w-full">
                    <Button variant="ghost" className="w-full" onClick={onBack} disabled={status === "connecting" || status === "success"}>
                        Back
                    </Button>
                    <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground" onClick={onSkip}>
                        Skip
                    </Button>
                </div>
            </div>
        </div>
    );
}
