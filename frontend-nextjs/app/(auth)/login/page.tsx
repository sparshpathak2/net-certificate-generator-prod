"use client"

import { GalleryVerticalEnd } from "lucide-react"

import { AuthForm } from "@/components/AuthForm"
import { useContext, useEffect } from "react"
import { SessionContext } from "@/components/SessionProvider"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const { user, loading } = useContext(SessionContext)
    const router = useRouter()

    useEffect(() => {
        if (!loading && user) {
            // router.replace("/dashboard") // redirect logged-in users
            router.replace("/") // redirect logged-in users
        }
    }, [user, loading, router])

    if (loading) {
        return null // or a spinner if you want
    }
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-start">
                    {/* <a href="#" className="flex items-center gap-2 font-medium">
                        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                            <GalleryVerticalEnd className="size-4" />
                        </div>
                        Acme Inc.
                    </a> */}
                    <img
                        src="/Navodaya-Logo.png"
                        alt="Navodaya Education Trust"
                        className="h-24 rounded-lg block md:hidden mt-16"
                    />
                </div>
                <div className="flex flex-col flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <AuthForm />
                    </div>
                </div>
            </div>
            <div className="bg-muted relative hidden lg:block">
                <img
                    src="/net-bg.jpg"
                    alt="Image"
                    className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                />
            </div>
        </div>
    )
}
