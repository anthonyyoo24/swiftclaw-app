"use client";

import React, { useRef, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { AppSidebar } from "./AppSidebar";
import { ImperativePanelHandle } from "react-resizable-panels";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const sidebarRef = useRef<ImperativePanelHandle>(null);

    const toggleCollapse = () => {
        const panel = sidebarRef.current;
        if (panel) {
            if (isCollapsed) {
                panel.expand();
            } else {
                panel.collapse();
            }
        }
    };

    return (
        <ResizablePanelGroup direction="horizontal">
            <ResizablePanel
                ref={sidebarRef}
                defaultSize={20}
                minSize={15}
                maxSize={30}
                collapsible={true}
                collapsedSize={4}
                onCollapse={() => setIsCollapsed(true)}
                onExpand={() => setIsCollapsed(false)}
                className="transition-all duration-300 ease-in-out"
            >
                <AppSidebar isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={80}>
                <div className="flex flex-1 overflow-hidden h-full">
                    {children}
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
