"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useState } from "react";
import { Loader2 } from "lucide-react";

type AuthMode = "login" | "signup";

export function AuthForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const { login, signup, isLoggingIn, isSigningUp } = useAuth();
    const router = useRouter();

    const [mode, setMode] = useState<AuthMode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");

    const isLoading = mode === "login" ? isLoggingIn : isSigningUp;
    const buttonText = mode === "login" ? "Login" : "Sign Up";
    const loadingText = mode === "login" ? "Logging in..." : "Creating account...";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === "login") {
            if (!email || !password) {
                toast.error("Please enter both email and password");
                return;
            }

            try {
                await login({ email, password });
                // Login success - redirect happens in useAuth
            } catch (err: any) {
                const msg = err?.response?.data?.message || err.message || "Login failed!";
                toast.error(msg);
            }
        } else {
            if (!email || !password || !name) {
                toast.error("Please fill in all fields");
                return;
            }

            if (password.length < 6) {
                toast.error("Password must be at least 6 characters");
                return;
            }

            try {
                await signup({ email, password, name });
                // Signup success - redirect happens in useAuth
            } catch (err: any) {
                const msg = err?.response?.data?.message || err.message || "Signup failed!";
                toast.error(msg);
            }
        }
    };

    const toggleMode = () => {
        setMode(mode === "login" ? "signup" : "login");
        // Clear form when switching modes
        setEmail("");
        setPassword("");
        setName("");
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-2xl font-bold">
                    {mode === "login" ? "Login to your account" : "Create an account"}
                </h1>
                <p className="text-muted-foreground text-sm text-balance">
                    {mode === "login"
                        ? "Enter your email and password to access your account"
                        : "Enter your details to create your account"}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field - Only for Signup */}
                {mode === "signup" && (
                    <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                )}

                {/* Email Field */}
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="admin@certificate.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>

                {/* Password Field */}
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        {mode === "login" && (
                            <a
                                href="#"
                                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                            >
                                Forgot password?
                            </a>
                        )}
                    </div>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    {mode === "signup" && (
                        <p className="text-xs text-muted-foreground">
                            Password must be at least 6 characters
                        </p>
                    )}
                </div>

                {/* Submit Button */}
                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? loadingText : buttonText}
                </Button>
            </form>

            {/* Toggle Mode */}
            <div className="text-center text-sm">
                {mode === "login" ? (
                    <>
                        Don&apos;t have an account?{" "}
                        <button
                            type="button"
                            onClick={toggleMode}
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Sign up
                        </button>
                    </>
                ) : (
                    <>
                        Already have an account?{" "}
                        <button
                            type="button"
                            onClick={toggleMode}
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}