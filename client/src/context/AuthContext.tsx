import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Restore user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("authUser");
    if (storedUser) {
      try {
        setUserState(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("authUser");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (role: AuthUser["role"], email: string, name?: string) => {
    // Use provided name or fallback to role-based names
    const displayName = name || (role === "hospital" ? "Dr. Sarah Smith" : "John Doe");
    
    let mockUser: AuthUser = {
      id: "1",
      username: displayName,
      name: displayName,
      email,
      role,
      emailVerified: false,
    };

    setUserState(mockUser);
    localStorage.setItem("authUser", JSON.stringify(mockUser));
    toast({
      title: "Welcome back!",
      description: `Logged in as ${role}`,
    });
  };

  const register = (data: any) => {
    // Mock register logic
    const newUser = {
      id: "2",
      username: data.fullName,
      name: data.fullName,
      email: data.email,
      role: "donor" as const,
      emailVerified: false,
    };
    setUserState(newUser);
    localStorage.setItem("authUser", JSON.stringify(newUser));
    toast({
      title: "Registration Successful",
      description: "Your donor application is under review.",
    });
  };

  const setUser = (nextUser: AuthUser | null) => {
    setUserState(nextUser);
    if (nextUser) {
      localStorage.setItem("authUser", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("authUser");
    }
  };

  const logout = () => {
    setUserState(null);
    localStorage.removeItem("authUser");
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
