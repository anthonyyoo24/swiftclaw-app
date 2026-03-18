"use client";

import React, { useState, useRef, useCallback } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ImperativePanelHandle } from "react-resizable-panels";
import { AppSidebar } from "./AppSidebar";
import { Icon } from "@iconify/react";

const COLLAPSED_WIDTH = 64;   // px
const DEFAULT_WIDTH = 180;    // px
const MAX_WIDTH = 280;        // px

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
    const panelRef = useRef<ImperativePanelHandle>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);

    const toggleSidebar = () => {
        const panel = panelRef.current;
        if (panel) {
            if (isCollapsed) {
                panel.expand();
            } else {
                panel.collapse();
            }
        }
    };

    /** Called by react-resizable-panels on every drag move with percentages.
     *  We convert the sidebar panel's percentage to pixels and store it.
     *  Only fires when the user is actively dragging to ignore window resize events. */
    const handleLayout = useCallback((sizes: number[]) => {
        if (!isDraggingRef.current || isCollapsed) return;
        const totalWidth = containerRef.current?.getBoundingClientRect().width;
        if (!totalWidth) return;
        const newPx = Math.round((sizes[0] / 100) * totalWidth);
        const clamped = Math.min(MAX_WIDTH, Math.max(DEFAULT_WIDTH, newPx));
        setSidebarWidth(clamped);
    }, [isCollapsed]);

    return (
        <div ref={containerRef} className="flex flex-1 h-full overflow-hidden">
            <ResizablePanelGroup
                direction="horizontal"
                onLayout={handleLayout}
            >
                <ResizablePanel
                    ref={panelRef}
                    defaultSize={20}
                    minSize={15}
                    maxSize={30}
                    collapsible={true}
                    collapsedSize={4}
                    onCollapse={() => setIsCollapsed(true)}
                    onExpand={() => setIsCollapsed(false)}
                    style={{
                        minWidth: isCollapsed ? COLLAPSED_WIDTH : sidebarWidth,
                        maxWidth: isCollapsed ? COLLAPSED_WIDTH : sidebarWidth,
                        flexShrink: 0,
                        flexGrow: 0,
                    }}
                >
                    <AppSidebar isCollapsed={isCollapsed} />
                </ResizablePanel>

                <ResizableHandle
                    className="relative w-px bg-white/5 hover:bg-white/10 transition-colors"
                    onDragging={(dragging) => { isDraggingRef.current = dragging; }}
                >
                    <button
                        onClick={toggleSidebar}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-8 bg-neutral-900 border border-white/10 rounded-full flex items-center justify-center text-neutral-400 hover:text-white transition-all hover:scale-110 z-50 group"
                    >
                        <Icon
                            icon="solar:alt-arrow-left-linear"
                            className={`size-3.5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
                        />
                    </button>
                </ResizableHandle>

                <ResizablePanel defaultSize={80}>
                    <div className="flex flex-1 overflow-hidden h-full">
                        {children}
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
