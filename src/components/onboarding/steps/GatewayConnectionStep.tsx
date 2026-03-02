"use client";

import { useState } from "react";
import { Loader2, CheckCircle, Wifi, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";

interface StepProps {
    onNext: () => void;
    onBack: () => void;
    onComplete: () => void;
}

type ConnectionStatus = "idle" | "connecting" | "success" | "error";

export function GatewayConnectionStep({ onComplete, onBack }: StepProps) {
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
                    onComplete(); // Redirect to dashboard on success
                }, 1500);
            }
        }, 2000);
    };

    return (
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Content Header */}
            <div className="mb-10">
                <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center mb-6">
                    <Wifi className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-3">Connect to Gateway</h1>
                <p className="text-base text-gray-500 leading-relaxed">
                    SwiftClaw connects locally to the OpenClaw engine. Ensure your gateway is running on port 18789.
                </p>
            </div>

            {/* Connection Status Area */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                <div className="relative">
                    {/* Pulsing background effect when connecting */}
                    {status === "connecting" && (
                        <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping duration-1000 scale-150"></div>
                    )}

                    <div className={`relative w-32 h-32 rounded-full flex items-center justify-center shadow-sm border-4 transition-colors duration-500 ${status === "idle" ? "bg-gray-50 border-gray-100" :
                        status === "connecting" ? "bg-blue-50 border-blue-100" :
                            status === "success" ? "bg-green-50 border-green-100" :
                                "bg-red-50 border-red-100"
                        }`}>
                        {status === "idle" && <Wifi className="w-12 h-12 text-gray-400" strokeWidth={1.5} />}
                        {status === "connecting" && <Loader2 className="w-12 h-12 text-blue-500 animate-spin" strokeWidth={1.5} />}
                        {status === "success" && <CheckCircle className="w-16 h-16 text-green-500 animate-in zoom-in duration-300" strokeWidth={1.5} />}
                        {status === "error" && <AlertCircle className="w-12 h-12 text-red-500 animate-in shake duration-300" strokeWidth={1.5} />}
                    </div>
                </div>

                <div className="text-center space-y-2 h-16">
                    {status === "idle" && <p className="text-lg font-medium text-gray-900">Ready to connect</p>}
                    {status === "connecting" && <p className="text-lg font-medium text-blue-600 animate-pulse">Establishing secure connection...</p>}
                    {status === "success" && <p className="text-lg font-medium text-green-600">Connected successfully!</p>}
                    {status === "error" && <p className="text-lg font-medium text-red-600">Connection failed</p>}

                    {status === "error" && (
                        <p className="text-sm text-red-500 max-w-sm">
                            Could not reach <code className="bg-red-50 px-1 py-0.5 rounded text-red-700">ws://localhost:18789</code>. Is OpenClaw running?
                        </p>
                    )}
                </div>
            </div>

            {/* Bottom Action */}
            <div className="mt-auto pt-10 flex justify-between items-center">
                <button
                    onClick={onBack}
                    disabled={status === "connecting" || status === "success"}
                    className="disabled:opacity-50 text-gray-600 hover:text-gray-900 px-5 py-2.5 rounded-lg text-base font-medium transition-colors flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                    Back
                </button>

                <div className="flex gap-4">
                    <button
                        onClick={handleConnect}
                        disabled={status === "connecting" || status === "success"}
                        className={`px-6 py-2.5 rounded-lg text-base font-medium focus:outline-none focus:ring-4 transition-all flex items-center gap-2 shadow-sm ${status === "success"
                            ? "bg-green-600 text-white hover:bg-green-700 focus:ring-green-600/10"
                            : status === "error"
                                ? "bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-900/10"
                                : "bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-900/10"
                            }`}
                    >
                        {status === "idle" && "Connect Now"}
                        {status === "connecting" && "Connecting..."}
                        {status === "success" && "Connected"}
                        {status === "error" && "Retry Connection"}

                        {(status === "idle" || status === "error") && <ArrowRight className="w-4 h-4" strokeWidth={1.5} />}
                        {status === "success" && <CheckCircle className="w-4 h-4" strokeWidth={1.5} />}
                        {status === "connecting" && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
