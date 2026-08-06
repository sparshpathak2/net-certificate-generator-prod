// features/auth/hooks/useSession.ts
import { useQuery } from "@tanstack/react-query";
import { verifySessionApi } from "@/features/auth/auth";

export const useSession = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["session"],
    queryFn: verifySessionApi,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: data?.valid ? data.user : null,
    isAuthenticated: !!data?.valid,
    isLoading,
    error,
    refetch,
  };
};