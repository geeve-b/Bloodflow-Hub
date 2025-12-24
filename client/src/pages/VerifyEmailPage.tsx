import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const API_URL = "http://localhost:3001/api";
const RESEND_COOLDOWN_SECONDS = 30;
const PENDING_VERIFICATION_KEY = "lifeflow:pendingVerification";

function resolveId(rawId: unknown): string {
  if (!rawId) {
    return "";
  }
  if (typeof rawId === "string") {
    return rawId;
  }
  if (typeof rawId === "object" && rawId && "toString" in rawId) {
    try {
      return (rawId as { toString: () => string }).toString();
    } catch (_error) {
      return "";
    }
  }
  return "";
}

export default function VerifyEmailPage() {
  const [location, setLocation] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [target, setTarget] = useState<{ userId: string; email: string }>(
    () => ({ userId: "", email: "" })
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const queryUserId = params.get("userId") ?? "";
    const queryEmail = params.get("email") ?? "";

    if (queryUserId || queryEmail) {
      const nextTarget = { userId: queryUserId, email: queryEmail };
      setTarget(nextTarget);
      sessionStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify(nextTarget));
      return;
    }

    const stored = sessionStorage.getItem(PENDING_VERIFICATION_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { userId?: string; email?: string };
        setTarget({
          userId: parsed.userId ?? "",
          email: parsed.email ?? "",
        });
      } catch (error) {
        console.error("Failed to parse pending verification info", error);
        sessionStorage.removeItem(PENDING_VERIFICATION_KEY);
      }
    }
  }, [location]);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleCodeChange = (value: string) => {
    const sanitized = value.replace(/\D/g, "").slice(0, 6);
    setCode(sanitized);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!target.userId && !target.email) {
      toast({
        title: "Missing Information",
        description: "We could not determine your account. Please register again.",
        variant: "destructive",
      });
      return;
    }
    if (code.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Enter the 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: target.userId || undefined,
          email: target.email || undefined,
          code,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Verification failed");
      }

      const apiUser = payload.user;
      const resolvedId = resolveId(apiUser?._id);
      if (!apiUser) {
        throw new Error("User data missing from response");
      }

      setUser({
        id: resolvedId,
        username: apiUser.username,
        email: apiUser.email,
        role: apiUser.role,
        emailVerified: apiUser.emailVerified,
        name: apiUser.username,
      });

      if (typeof window !== "undefined") {
        sessionStorage.removeItem(PENDING_VERIFICATION_KEY);
      }

      toast({
        title: "Email Verified",
        description: "Welcome to LifeFlow!",
      });

      // Redirect to appropriate dashboard based on role
      if (apiUser.role === "hospital") {
        setLocation("/hospital-dashboard");
      } else {
        setLocation("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Invalid code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!target.userId && !target.email) {
      toast({
        title: "Missing Information",
        description: "We could not determine your account. Please register again.",
        variant: "destructive",
      });
      return;
    }

    setResendLoading(true);
    try {
      const response = await fetch(`${API_URL}/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: target.userId || undefined,
          email: target.email || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to resend code");
      }

      toast({
        title: "Code Sent",
        description: "Check your inbox for the new verification code.",
      });
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      toast({
        title: "Resend Failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-muted/30">
      <Card className="w-full max-w-md shadow-lg border-border/60">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
          <CardDescription>
            Enter the 6-digit code we sent to <Badge variant="secondary">{target.email || "your email"}</Badge>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="verification-code" className="text-sm font-medium text-muted-foreground">
                Verification Code
              </label>
              <Input
                id="verification-code"
                inputMode="numeric"
                value={code}
                onChange={(event) => handleCodeChange(event.target.value)}
                placeholder="123456"
                autoComplete="one-time-code"
                required
              />
              <p className="text-xs text-muted-foreground">
                Codes expire after 10 minutes.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying..." : "Verify Email"}
            </Button>
            <div className="text-sm text-muted-foreground text-center">
              Didn&apos;t get a code?
              <Button
                type="button"
                variant="link"
                className="ml-1"
                onClick={handleResend}
                disabled={resendLoading || resendCooldown > 0}
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : resendLoading
                  ? "Sending..."
                  : "Resend code"}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
