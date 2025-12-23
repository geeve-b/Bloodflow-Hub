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
  user: User | null;
  login: (role: UserRole, email: string, name?: string) => void;
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const { toast } = useToast();

  const login = (role: UserRole, email: string, name?: string) => {
    // Use provided name or fallback to role-based names
    const displayName = name || (role === "manager" ? "Dr. Sarah Smith" : "John Doe");
    
    let mockUser: User = {
      id: "1",
      name: displayName,
      email,
      role,
    };

    if (role === "manager") {
      mockUser.hospitalName = "City General Hospital";
    } else if (role === "donor") {
      mockUser.bloodGroup = "O+";
      mockUser.status = "approved";
    }

    setUser(mockUser);
    toast({
      title: "Welcome back!",
      description: `Logged in as ${role}`,
    });
  };

  const register = (data: any) => {
    // Mock register logic
    setUser({
      id: "2",
      name: data.fullName,
      email: data.email,
      role: "donor",
      bloodGroup: data.bloodGroup,
      status: "pending", // New donors are pending
    });
    toast({
      title: "Registration Successful",
      description: "Your donor application is under review.",
    });
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
