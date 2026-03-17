"use client";

import React, { useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { AppSidebar } from "./AppSidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);


    return (
        <ResizablePanelGroup direction="horizontal">
            <ResizablePanel
                defaultSize={20}
                minSize={15}
                maxSize={30}
                collapsible={true}
                collapsedSize={4}
                onCollapse={() => setIsCollapsed(true)}
                onExpand={() => setIsCollapsed(false)}
            >
                <AppSidebar isCollapsed={isCollapsed} />
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
