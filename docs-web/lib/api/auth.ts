import { apiFetch } from "./client";
import type { SessionUser } from "./types";

export const login = (email: string, password: string) =>
  apiFetch<SessionUser>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const logout = () => apiFetch<null>("/auth/logout", { method: "POST" });

export const getMe = () => apiFetch<SessionUser>("/auth/me");
