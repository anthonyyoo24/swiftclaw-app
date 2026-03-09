"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

export interface DropdownOption {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

interface CustomDropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    size?: "default" | "lg";
}

export function CustomDropdown({ options, value, onChange, label, placeholder = "Select an option", size = "default" }: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const selectedOption = options.find((opt) => opt.id === value);
    const displayLabel = selectedOption?.label ?? placeholder;

    const closeDropdown = useCallback((blurButton = false) => {
        setIsOpen(false);
        if (blurButton) buttonRef.current?.blur();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setShouldRender(false), 200);
    }, []);

    const toggleDropdown = useCallback(() => {
        if (isOpen) {
            closeDropdown(true);
        } else {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setShouldRender(true);
            setIsOpen(true);
        }
    }, [isOpen, closeDropdown]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                closeDropdown();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [closeDropdown]);

    const handleSelect = (optionId: string) => {
        onChange(optionId);
        closeDropdown();
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {label && (
                <label className="block text-sm font-medium text-neutral-300 mb-3">
                    {label} <span className="text-blue-500">*</span>
                </label>
            )}

            <button
                ref={buttonRef}
                type="button"
                onClick={toggleDropdown}
                className={cn(
                    "w-full relative flex items-center justify-between border rounded-xl transition-all cursor-pointer focus:outline-none group",
                    size === "default" && "pl-4 pr-10 py-3 text-sm shadow-sm focus:ring-1 focus:border-blue-500/50 focus:ring-blue-500/50",
                    size === "lg" && "px-4 h-14 text-lg focus:border-white/40",
                    isOpen && size === "default" && "bg-white/5 border-blue-500/50 text-white ring-1 ring-blue-500/50",
                    !isOpen && size === "default" && "bg-[#0a0a0c] border-white/10 text-white hover:bg-white/5",
                    size === "lg" && "bg-white/5 border-white/10 text-white",
                    isOpen && size === "lg" && "border-white/40"
                )}
            >
                <div className="flex items-center gap-3">
                    {selectedOption?.icon && (
                        <div className="shrink-0 transition-all">
                            {selectedOption.icon}
                        </div>
                    )}
                    <span
                        className={cn(
                            "font-medium",
                            !selectedOption && size === "default" && "text-neutral-500",
                            !selectedOption && size === "lg" && "text-neutral-600 font-normal"
                        )}
                    >
                        {displayLabel}
                    </span>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center px-4">
                    <Icon
                        icon="solar:alt-arrow-down-linear"
                        className={cn(
                            "transition-all duration-200",
                            size === "default" ? "text-lg text-neutral-500" : "text-xl text-neutral-400 group-hover:text-neutral-300",
                            !isOpen && size === "default" && "group-hover:text-neutral-300",
                            isOpen && "rotate-180 text-white"
                        )}
                    />
                </div>
            </button>

            {/* Dropdown Menu */}
            {shouldRender && (
                <div className={`absolute z-50 w-full mt-2 bg-[#0a0a0c] border border-white/10 rounded-xl shadow-2xl overflow-hidden origin-top ${isOpen
                    ? "animate-in fade-in zoom-in-95 duration-200"
                    : "animate-out fade-out zoom-out-95 duration-200 fill-mode-forwards"
                    }`}>
                    <div className="p-1.5 space-y-0.5 max-h-64 overflow-y-auto">
                        {options.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => handleSelect(option.id)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 rounded-lg font-medium transition-colors group cursor-pointer",
                                    size === "lg" ? "py-3 text-base" : "py-2.5 text-sm",
                                    option.id === value
                                        ? "bg-blue-500/10 text-blue-400"
                                        : "text-neutral-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    {option.icon && (
                                        <div className={`shrink-0 transition-all duration-200 ${option.id === value ? "scale-110" : ""}`}>
                                            {option.icon}
                                        </div>
                                    )}
                                    <span>{option.label}</span>
                                </div>
                                {option.id === value && (
                                    <Icon icon="solar:check-read-linear" className="text-lg text-blue-400" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
