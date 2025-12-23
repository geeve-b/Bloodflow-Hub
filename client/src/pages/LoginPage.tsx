import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { Droplet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_URL = "http://localhost:3001/api";

export default function LoginPage() {
  const { setUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 403) {
          const targetId =
            error.userId ||
            (typeof error.user?._id === "string"
              ? error.user._id
              : error.user?._id?.toString?.());
          const targetEmail = error.email || error.user?.email || username;
          toast({
            title: "Email Not Verified",
            description: "Please verify your email before logging in.",
            variant: "destructive",
          });
          if (targetId) {
            setLocation(
              `/verify-email?userId=${encodeURIComponent(
                targetId,
              )}&email=${encodeURIComponent(targetEmail || "")}`,
            );
          }
          return;
        }
        throw new Error(error.error || "Login failed");
      }

      const data = await response.json();
      const apiUser = data.user;
      const resolvedId =
        typeof apiUser?._id === "string"
          ? apiUser._id
          : apiUser?._id?.toString?.() ?? "";
      if (!apiUser?.emailVerified) {
        toast({
          title: "Email Not Verified",
          description: "Please verify your email before logging in.",
          variant: "destructive",
        });
        setLocation(
          `/verify-email?userId=${encodeURIComponent(
            resolvedId,
          )}&email=${encodeURIComponent(apiUser.email || username)}`,
        );
        return;
      }

      setUser({
        id: resolvedId,
        username: apiUser.username,
        email: apiUser.email,
        role: apiUser.role,
        emailVerified: apiUser.emailVerified,
        name: apiUser.username,
      });
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-muted/30">
      <Card className="w-full max-w-md shadow-xl border-border/60">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
            <Droplet className="h-8 w-8 text-primary fill-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to manage inventory or donations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="user" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="user">User / Donor</TabsTrigger>
              <TabsTrigger value="hospital">Hospital Staff</TabsTrigger>
            </TabsList>
            
            <TabsContent value="user">
              <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username-user">Username</Label>
                  <Input 
                    id="username-user" 
                    type="text" 
                    placeholder="john_donor" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-user">Password</Label>
                  <Input 
                    id="password-user" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In as Donor"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="hospital">
              <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username-hosp">Username</Label>
                  <Input 
                    id="username-hosp" 
                    type="text" 
                    placeholder="staff_001" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-hosp">Password</Label>
                  <Input 
                    id="password-hosp" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
                <Button type="submit" className="w-full" variant="secondary" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In as Staff"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          Don't have an account? <a href="/register" className="text-primary hover:underline ml-1">Register here</a>
        </CardFooter>
      </Card>
    </div>
  );
}
