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

const API_URL = import.meta.env.VITE_API_URL ?? "/api";
const PENDING_VERIFICATION_KEY = "lifeflow:pendingVerification";
const ADMIN_EMAIL = "bloodflowhub@gmail.com";

export default function LoginPage() {
  const { setUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"user" | "hospital">("user");
  const [formResetKey, setFormResetKey] = useState(0);

  const resetFormState = () => {
    setIdentifier("");
    setPassword("");
    setShowPassword(false);
    setLoading(false);
    setFormResetKey((prev) => prev + 1);
  };

  const handleTabChange = (value: "user" | "hospital") => {
    setActiveTab(value);
    resetFormState();
  };

  const handleLogin = async (selectedRole: "donor" | "hospital") => {
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
        const errorBody = await response.json().catch(() => null);
        if (response.status === 403) {
          const targetId =
            errorBody?.userId ||
            (typeof errorBody?.user?._id === "string"
              ? errorBody.user._id
              : errorBody?.user?._id?.toString?.());
          const targetEmail =
            errorBody?.email || errorBody?.user?.email || trimmedIdentifier;
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

        const message =
          typeof errorBody?.error === "string"
            ? errorBody.error
            : "Login failed";
        throw new Error(message);
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

      const apiUser = data.user;
      if (!apiUser) {
        throw new Error("User data missing from response");
      }

      console.log("[DEBUG] API returned user:", apiUser);

      const {
        _id,
        id,
        username: apiUsername,
        name,
        email,
        role,
        emailVerified,
      } = apiUser;

      console.log("[DEBUG] Extracted role from API:", role);

      const normalizedEmail = (email || trimmedIdentifier).toLowerCase();
      const isPrimaryAdmin = normalizedEmail === ADMIN_EMAIL;
      const resolvedRole: AuthUser["role"] = isPrimaryAdmin
        ? "admin"
        : role && ["donor", "receiver", "hospital", "admin"].includes(role)
        ? role
        : "donor";

      // Validate role matches selected tab
      if (selectedRole === "donor" && resolvedRole === "hospital") {
        toast({
          title: "Invalid Login",
          description: "Hospital staff cannot login through the Donor portal. Please use the Hospital Staff tab.",
          variant: "destructive",
        });
        return;
      }

      if (selectedRole === "hospital" && resolvedRole === "donor") {
        toast({
          title: "Invalid Login",
          description: "Donors cannot login through the Hospital Staff portal. Please use the User/Donor tab.",
          variant: "destructive",
        });
        return;
      }

      setUser({
        id: _id || id || "",
        username: apiUsername || email || trimmedIdentifier,
        name: name || apiUsername || email || trimmedIdentifier,
        email: email || trimmedIdentifier,
        role: resolvedRole,
        emailVerified: Boolean(emailVerified),
      });

      toast({
        title: "Success",
        description: "Logged in successfully!",
      });

      if (resolvedRole === "admin") {
        setLocation("/admin");
      } else if (resolvedRole === "hospital") {
        setLocation("/hospital-dashboard");
      } else {
        setLocation("/dashboard");
      }
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
          <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as "user" | "hospital")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="user">User / Donor</TabsTrigger>
              <TabsTrigger value="hospital">Hospital Staff</TabsTrigger>
            </TabsList>
            
            <TabsContent value="user">
              <form
                key={`user-form-${formResetKey}`}
                onSubmit={(e) => { e.preventDefault(); handleLogin("donor"); }}
                className="space-y-4"
              >
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password-user">Password</Label>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-xs text-muted-foreground"
                      onClick={() => setLocation("/forgot-password")}
                      type="button"
                    >
                      Forgot password?
                    </Button>
                  </div>
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
                <Button
                  type="submit"
                  className="w-full rounded-xl bg-[#ff5fa2] text-black hover:bg-[#e84b8f] dark:hover:bg-[#d84482] dark:text-black transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ff5fa2] disabled:opacity-70 disabled:pointer-events-none"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In as Donor"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="hospital">
              <form
                key={`hospital-form-${formResetKey}`}
                onSubmit={(e) => { e.preventDefault(); handleLogin("hospital"); }}
                className="space-y-4"
              >
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password-hosp">Password</Label>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-xs text-muted-foreground"
                      onClick={() => setLocation("/forgot-password")}
                      type="button"
                    >
                      Forgot password?
                    </Button>
                  </div>
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
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#ff5fa2] text-black hover:bg-[#e84b8f] dark:hover:bg-[#d84482] dark:text-black transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ff5fa2] disabled:opacity-70 disabled:pointer-events-none"
                >
                  {loading ? "Signing in..." : "Sign In as Staff"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 text-sm text-muted-foreground">
          <div className="text-center w-full border-t pt-3">
            Don't have an account? <a href="/register" className="text-primary hover:underline font-semibold">Register here</a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
