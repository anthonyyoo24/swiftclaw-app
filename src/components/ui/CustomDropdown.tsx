"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Check } from "lucide-react";

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
}

export function CustomDropdown({ options, value, onChange, label }: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const selectedOption = options.find((opt) => opt.id === value);

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
                <label className="block text-sm font-medium text-gray-900 mb-2.5">
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={toggleDropdown}
                className={`w-full flex items-center justify-between bg-white border rounded-lg px-4 py-2.5 text-base text-gray-900 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-900/5 transition-all cursor-pointer ${isOpen ? "border-gray-400 ring-4 ring-gray-900/5" : "border-gray-200"
                    }`}
            >
                <div className="flex items-center gap-3">
                    {selectedOption?.icon && (
                        <div className="shrink-0 transition-all">
                            {selectedOption.icon}
                        </div>
                    )}
                    <span className="font-medium">{selectedOption?.label}</span>
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    strokeWidth={1.5}
                />
            </button>

            {/* Dropdown Menu */}
            {shouldRender && (
                <div className={`absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden origin-top ${isOpen
                    ? "animate-in fade-in zoom-in-95 duration-200"
                    : "animate-out fade-out zoom-out-95 duration-200 fill-mode-forwards"
                    }`}>
                    <div className="p-1.5 space-y-0.5">
                        {options.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => handleSelect(option.id)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${option.id === value
                                    ? "bg-gray-50 text-gray-900"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
                                    <Check className="w-4 h-4 text-gray-900" strokeWidth={2} />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
