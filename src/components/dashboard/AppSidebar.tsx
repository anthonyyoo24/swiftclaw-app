"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Single nav item definition */
interface NavItem {
    label: string;
    icon: string;
    href: string;
}

const NAV_ITEMS: NavItem[] = [
    { label: "Home", icon: "solar:home-2-linear", href: "/" },
    { label: "Tasks", icon: "solar:checklist-linear", href: "/tasks" },
    // { label: "Scheduler", icon: "solar:calendar-mark-linear", href: "/scheduler" },
    { label: "Skills", icon: "solar:magic-stick-3-linear", href: "/skills" },
];

const BOTTOM_NAV: NavItem[] = [
    { label: "Settings", icon: "solar:settings-linear", href: "/settings" },
];

interface AppSidebarProps {
    isCollapsed?: boolean;
}

export function AppSidebar({ isCollapsed }: AppSidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="w-full h-full bg-white/1 p-4 hidden lg:flex flex-col gap-1 z-10 transition-all duration-300">
            <nav className="flex-1 space-y-1">
                {NAV_ITEMS.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        onClick={(e) => {
                            if (pathname === item.href) {
                                e.preventDefault();
                            }
                        }}
                        aria-current={pathname === item.href ? "page" : undefined}
                        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 font-medium text-sm transition-colors duration-200 aria-[current=page]:duration-0 aria-[current=page]:bg-white/10 aria-[current=page]:text-white aria-[current=page]:shadow-sm ${isCollapsed ? 'justify-center px-0!' : ''}`}
                    >
                        <Icon icon={item.icon} className="text-[18px] shrink-0 group-hover:text-white transition-colors" />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                ))}
            </nav>

            <div className="mt-auto">
                {BOTTOM_NAV.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        onClick={(e) => {
                            if (pathname === item.href) {
                                e.preventDefault();
                            }
                        }}
                        aria-current={pathname === item.href ? "page" : undefined}
                        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 font-medium text-sm transition-colors duration-200 aria-[current=page]:duration-0 aria-[current=page]:bg-white/10 aria-[current=page]:text-white aria-[current=page]:shadow-sm ${isCollapsed ? 'justify-center px-0!' : ''}`}
                    >
                        <Icon icon={item.icon} className="text-[18px] shrink-0 group-hover:text-white transition-colors" />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                ))}
            </div>
        </aside>
    );
}
