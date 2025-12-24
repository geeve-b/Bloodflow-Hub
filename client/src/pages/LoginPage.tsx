import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { AuthUser } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { Droplet, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_URL = "http://localhost:3001/api";
const PENDING_VERIFICATION_KEY = "lifeflow:pendingVerification";

export default function LoginPage() {
  const { setUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      toast({
        title: "Error",
        description: "Please enter your username or email and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const trimmedIdentifier = identifier.trim();
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: trimmedIdentifier,
          username: trimmedIdentifier,
          password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 403) {
          const targetId =
            error.userId ||
            (typeof error.user?._id === "string"
              ? error.user._id
              : error.user?._id?.toString?.());
          const targetEmail = error.email || error.user?.email || identifier;
          toast({
            title: "Email Not Verified",
            description: "Please verify your email before logging in.",
            variant: "destructive",
          });
          if (typeof window !== "undefined") {
            sessionStorage.setItem(
              PENDING_VERIFICATION_KEY,
              JSON.stringify({
                userId: targetId ?? "",
                email: targetEmail || "",
              }),
            );
          }
          setLocation(
            `/verify-email?userId=${encodeURIComponent(
              targetId ?? "",
            )}&email=${encodeURIComponent(targetEmail || "")}`,
          );
          return;
        }
        throw new Error(error.error || "Login failed");
      }
      const data: {
        user?: {
          _id?: string;
          id?: string;
          username?: string;
          name?: string;
          email?: string;
          role?: AuthUser["role"];
          emailVerified?: boolean;
        };
      } = await response.json();

      if (data.user) {
        const {
          _id,
          id,
          username,
          name,
          email,
          role,
          emailVerified,
        } = data.user;
        const resolvedRole: AuthUser["role"] =
          role && ["donor", "receiver", "hospital", "admin"].includes(role)
            ? role
            : "donor";
        setUser({
          id: _id || id || "",
          username: username || email || trimmedIdentifier,
          name: name || username || email || trimmedIdentifier,
          email: email || trimmedIdentifier,
          role: resolvedRole,
          emailVerified: Boolean(emailVerified),
        });
      }

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
                  <Label htmlFor="identifier-user">Username or Email</Label>
                  <Input 
                    id="identifier-user" 
                    type="text" 
                    placeholder="john_donor or john@example.com" 
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-user">Password</Label>
                  <div className="relative">
                    <Input 
                      id="password-user" 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In as Donor"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="hospital">
              <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier-hosp">Username or Email</Label>
                  <Input 
                    id="identifier-hosp" 
                    type="text" 
                    placeholder="staff_001 or staff@example.com" 
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-hosp">Password</Label>
                  <div className="relative">
                    <Input 
                      id="password-hosp" 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
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
