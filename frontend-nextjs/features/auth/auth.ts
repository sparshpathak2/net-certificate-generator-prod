import { apiClient } from "@/lib/api-client";

// Signup API
export const signupApi = async (data: {
  email: string;
  password: string;
  name: string;
}) => {
  const res = await apiClient.post("/auth/signup", data);
  return res.data;
};

// Login API
export const loginApi = async (email: string, password: string) => {
  const res = await apiClient.post("/auth/login", { email, password });
  return res.data;
};

// Logout API
export const logoutApi = async () => {
  const res = await apiClient.post("/auth/logout");
  return res.data;
};

// Verify session API
export const verifySessionApi = async () => {
  const res = await apiClient.get("/auth/verify");
  return res.data;
};