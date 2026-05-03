"use client";

import { useEffect } from "react";
import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function AutoSignIn() {
    const { signIn } = useAuthActions();
    const { isAuthenticated, isLoading } = useConvexAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            void signIn("anonymous");
        }
    }, [isAuthenticated, isLoading, signIn]);

    return null;
}

export function ConvexClientProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ConvexAuthProvider client={convex}>
            <AutoSignIn />
            {children}
        </ConvexAuthProvider>
    );
}
