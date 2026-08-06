"use client";

import React, { useEffect, useState, createContext, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface SessionContextType {
    user: any | null;
    loading: boolean;
    refreshSession: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextType>({
    user: null,
    loading: true,
    refreshSession: async () => {},
});

const PUBLIC_ROUTES = ["/login", "/signup", "/claim", "/verify"];

const isPublicRoute = (pathname: string) => {
    return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
};

export function SessionProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                console.log("Checking session for:", pathname);
                const response = await apiClient.post("/auth/verify-session");
                console.log("Session response:", response.data);
                
                if (response.data.valid && response.data.user) {
                    setUser(response.data.user);
                    console.log("User authenticated:", response.data.user.email);
                    
                    if (pathname === "/") {
                        // router.replace("/dashboard");
                        router.replace("/");
                    }
                } else {
                    setUser(null);
                    console.log("No valid session");
                    
                    if (!isPublicRoute(pathname) && pathname !== "/") {
                        console.log("Redirecting to login from:", pathname);
                        router.replace("/login");
                    }
                }
            } catch (err: any) {
                console.error("Session verification error:", err.message);
                setUser(null);
                
                if (!isPublicRoute(pathname) && pathname !== "/") {
                    console.log("Redirecting to login due to error from:", pathname);
                    router.replace("/login");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSession();
    }, [pathname, router]);

    if (loading) {
        return (
            <div className="flex w-full justify-center mt-[10%]">
                <Loader2 className="animate-spin" size={24} />
            </div>
        );
    }

    return (
        <SessionContext.Provider value={{ user, loading, refreshSession: async () => {} }}>
            {children}
        </SessionContext.Provider>
    );
}