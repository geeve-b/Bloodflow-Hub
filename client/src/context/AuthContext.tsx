import React, { createContext, useContext, useState, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

// Types
export type UserRole = "guest" | "donor" | "receiver" | "manager";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hospitalName?: string; // For managers
  bloodGroup?: string; // For donors
  status?: "pending" | "approved" | "rejected"; // For donors
}

interface AuthContextType {
  user: User | null;
  login: (role: UserRole, email: string) => void;
  logout: () => void;
  register: (data: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  const login = (role: UserRole, email: string) => {
    // Mock login logic
    let mockUser: User = {
      id: "1",
      name: role === "manager" ? "Dr. Sarah Smith" : "John Doe",
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
  };

  const logout = () => {
    setUser(null);
    toast({
      title: "Logged out",
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
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
