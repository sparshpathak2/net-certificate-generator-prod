import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signupApi, loginApi, logoutApi } from "@/features/auth/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export const useAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Signup Mutation
  const signupMutation = useMutation({
    mutationFn: (payload: { email: string; password: string; name: string }) =>
      signupApi(payload),
    onSuccess: () => {
      toast.success("Signup successful! Please login.");
      router.push("/login");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Signup failed";
      toast.error(message);
    },
  });

  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginApi(email, password),
    onSuccess: (data) => {
      toast.success("Login successful!");
      // Invalidate session query to refresh user data
      queryClient.invalidateQueries({ queryKey: ["session"] });
      // router.push("/dashboard");
      router.push("/");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
    },
  });

  // Logout Mutation
  const logoutMutation = useMutation({
    mutationFn: () => logoutApi(),
    onSuccess: () => {
      toast.success("Logged out successfully");
      // Clear session query
      queryClient.setQueryData(["session"], null);
      router.push("/login");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Logout failed";
      toast.error(message);
    },
  });

  return {
    signup: signupMutation.mutate,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoading: signupMutation.isPending || loginMutation.isPending || logoutMutation.isPending,
    isSigningUp: signupMutation.isPending,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    error: signupMutation.error || loginMutation.error || logoutMutation.error,
  };
};