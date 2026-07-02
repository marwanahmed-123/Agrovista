import api from "./api";
import { AuthResponse, User } from "../types";

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/admin-login", {
      email,
      password,
    });
    const { accessToken, refreshToken, user, mustChangePassword } = response.data;

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("loginTime", Date.now().toString());
    localStorage.setItem("mustChangePassword", String(!!mustChangePassword));

    return response.data;
  },

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    locationId: string;
  }): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
      "/auth/register",
      data,
    );
    return response.data;
  },

  logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("loginTime");
    localStorage.removeItem("mustChangePassword");
  },

  mustChangePassword(): boolean {
    return localStorage.getItem("mustChangePassword") === "true";
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    const token = localStorage.getItem("accessToken");
    if (!token) return false;

    const loginTime = localStorage.getItem("loginTime");
    if (loginTime) {
      const elapsed = Date.now() - parseInt(loginTime, 10);
      if (elapsed >= TOKEN_EXPIRY_MS) {
        this.logout();
        return false;
      }
    }

    return true;
  },

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  },

  isSuperAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === "SUPER_ADMIN";
  },
};
