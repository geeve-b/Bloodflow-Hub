import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { Droplet, Building2, User } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (role: "donor" | "manager") => {
    // In a real app, validation and API call here
    if (!email) return;
    
    // Simulate role selection based on tab, but for demo let's assume
    // the user knows which tab they are on.
    login(role, email);
    setLocation("/dashboard");
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
              <form onSubmit={(e) => { e.preventDefault(); handleLogin("donor"); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-user">Email</Label>
                  <Input 
                    id="email-user" 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                <Button type="submit" className="w-full">Sign In as User</Button>
              </form>
            </TabsContent>
            
            <TabsContent value="hospital">
              <form onSubmit={(e) => { e.preventDefault(); handleLogin("manager"); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-hosp">Hospital ID / Email</Label>
                  <Input 
                    id="email-hosp" 
                    type="email" 
                    placeholder="admin@hospital.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                <Button type="submit" className="w-full" variant="secondary">Sign In as Staff</Button>
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
