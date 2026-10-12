import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: "donor" | "receiver" | "hospital" | "admin";
  emailVerified: boolean;
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
  isLoading: boolean;
}

export function homePathFor(role: AuthUser["role"]) {
  if (role === "admin") return "/admin";
  if (role === "hospital") return "/hospital-dashboard";
  return "/dashboard";
}

const STORAGE_KEY = "authUser";
const API_URL = import.meta.env.VITE_API_URL ?? "/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readStoredUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  } catch {
    return null;
  }
}

function persistUser(user: AuthUser | null) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage can be unavailable (private mode); the session cookie is the source of truth
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // The cached user lets the UI render immediately; the server session confirms it below.
  const [user, setUserState] = useState<AuthUser | null>(readStoredUser);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/session`, { credentials: "include" })
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) {
          const { user: apiUser } = await response.json();
          setUser({
            id: apiUser.id,
            username: apiUser.username,
            name: apiUser.name || apiUser.username,
            email: apiUser.email,
            role: apiUser.role,
            emailVerified: Boolean(apiUser.emailVerified),
          });
        } else if (response.status === 401) {
          setUser(null);
        }
      })
      .catch(() => {
        // Network error: keep the cached user and let individual requests surface errors
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setUser = (nextUser: AuthUser | null) => {
    setUserState(nextUser);
    persistUser(nextUser);
  };

  const logout = () => {
    fetch(`${API_URL}/logout`, { method: "POST", credentials: "include" }).catch(() => {});
    setUser(null);
    // Don't let the next person on this browser see the previous user's cached data
    queryClient.clear();
    toast({
      title: "Logged out",
    });
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
