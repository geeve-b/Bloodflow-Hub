import React, { createContext, useContext, useState, ReactNode } from "react";
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const { toast } = useToast();

  const setUser = (nextUser: AuthUser | null) => {
    setUserState(nextUser);
  };

  const logout = () => {
    setUserState(null);
    toast({
      title: "Logged out",
    });
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
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
