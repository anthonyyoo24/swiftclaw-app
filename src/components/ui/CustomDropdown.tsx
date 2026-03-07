"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";

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
}

export function CustomDropdown({ options, value, onChange, label, placeholder = "Select an option" }: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const selectedOption = options.find((opt) => opt.id === value);
    const displayLabel = selectedOption?.label ?? placeholder;

    const closeDropdown = useCallback(() => {
        setIsOpen(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setShouldRender(false), 200);
    }, []);

    const toggleDropdown = useCallback(() => {
        if (isOpen) {
            closeDropdown();
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
                type="button"
                onClick={toggleDropdown}
                className={`w-full relative flex items-center justify-between border rounded-xl pl-4 pr-10 py-3 text-sm transition-all cursor-pointer shadow-sm focus:outline-none focus:ring-1 focus:border-blue-500/50 focus:ring-blue-500/50 group ${isOpen
                    ? "bg-white/5 border-blue-500/50 text-white ring-1 ring-blue-500/50"
                    : "bg-[#0a0a0c] border-white/10 text-white hover:bg-white/5"
                    }`}
            >
                <div className="flex items-center gap-3">
                    {selectedOption?.icon && (
                        <div className="shrink-0 transition-all">
                            {selectedOption.icon}
                        </div>
                    )}
                    <span className={`font-medium ${!selectedOption ? "text-neutral-500" : ""}`}>
                        {displayLabel}
                    </span>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center px-4">
                    <Icon
                        icon="solar:alt-arrow-down-linear"
                        className={`text-lg text-neutral-500 group-hover:text-neutral-300 transition-all duration-200 ${isOpen ? "rotate-180 text-white" : ""}`}
                    />
                </div>
            </button>

            {/* Dropdown Menu */}
            {shouldRender && (
                <div className={`absolute z-50 w-full mt-2 bg-[#0a0a0c] border border-white/10 rounded-xl shadow-2xl overflow-hidden origin-top ${isOpen
                    ? "animate-in fade-in zoom-in-95 duration-200"
                    : "animate-out fade-out zoom-out-95 duration-200 fill-mode-forwards"
                    }`}>
                    <div className="p-1.5 space-y-0.5">
                        {options.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => handleSelect(option.id)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group cursor-pointer ${option.id === value
                                    ? "bg-blue-500/10 text-blue-400"
                                    : "text-neutral-400 hover:bg-white/5 hover:text-white"
                                    }`}
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
