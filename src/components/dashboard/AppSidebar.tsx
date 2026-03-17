import { Icon } from "@iconify/react";

/** Single nav item definition */
interface NavItem {
    label: string;
    icon: string;
    href: string;
}

const NAV_ITEMS: NavItem[] = [
    { label: "Home", icon: "solar:home-2-linear", href: "/" },
    { label: "Scheduler", icon: "solar:calendar-mark-linear", href: "/scheduler" },
    { label: "Skills", icon: "solar:cpu-linear", href: "/skills" },
];

const BOTTOM_NAV: NavItem[] = [
    { label: "Settings", icon: "solar:settings-linear", href: "/settings" },
];

export function AppSidebar() {
    return (
        <aside className="w-55 border-r border-white/5 bg-white/1 p-4 hidden lg:flex flex-col gap-1 z-10">
            <nav className="flex-1 space-y-1">
                {NAV_ITEMS.map((item) => (
                    <a
                        key={item.label}
                        href={item.href}
                        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 font-medium text-sm transition-all aria-[current=page]:bg-white/10 aria-[current=page]:text-white aria-[current=page]:border aria-[current=page]:border-white/5 aria-[current=page]:shadow-sm"
                    >
                        <Icon icon={item.icon} className="text-[18px] group-hover:text-white transition-colors" />
                        {item.label}
                    </a>
                ))}
            </nav>

            <div className="mt-auto">
                {BOTTOM_NAV.map((item) => (
                    <a
                        key={item.label}
                        href={item.href}
                        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 font-medium text-sm transition-all"
                    >
                        <Icon icon={item.icon} className="text-[18px] group-hover:text-white transition-colors" />
                        {item.label}
                    </a>
                ))}
            </div>
        </aside>
    );
}
