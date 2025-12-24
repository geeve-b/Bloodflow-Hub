import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  ShieldCheck,
  Database,
  Activity,
  Mail,
  LogIn,
} from "lucide-react";

const ADMIN_EMAIL = "bloodflowhub@gmail.com";

const adminWidgets = [
  {
    title: "Active Staff Accounts",
    description: "Manage onboarding and permissions for hospital staff",
    value: "28",
    icon: Users,
  },
  {
    title: "Pending Verifications",
    description: "Review new registrations awaiting approval",
    value: "6",
    icon: ShieldCheck,
  },
  {
    title: "Database Collections",
    description: "Monitor synced inventory and request data",
    value: "12",
    icon: Database,
  },
  {
    title: "System Health",
    description: "Background jobs and automation uptime",
    value: "99.2%",
    icon: Activity,
  },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isAdmin = useMemo(
    () => user?.role === "admin" && user.email.toLowerCase() === ADMIN_EMAIL,
    [user]
  );

  if (!user) {
    return (
      <div className="container max-w-screen-lg py-12 px-4 md:px-8">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-xl">Sign in required</CardTitle>
            <CardDescription>
              Log in with the administrator account to access the control panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/login")}>Go to login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container max-w-screen-lg py-12 px-4 md:px-8">
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Access denied</CardTitle>
            <CardDescription>
              This area is restricted to the primary LifeFlow Hub administrator.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              If you believe you should have access, contact the operations team.
            </p>
            <Button variant="outline" onClick={() => setLocation("/dashboard")}>Return to dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-screen-2xl py-10 px-4 md:px-8 space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Administrator Control Center</h1>
            <p className="text-muted-foreground">
              Monitor system activity, staff onboarding, and platform health for LifeFlow Hub.
            </p>
          </div>
        </div>
        <Separator className="max-w-xl" />
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminWidgets.map(({ title, description, value, icon: Icon }) => (
          <Card key={title} className="border-border/70">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-xl">Quick actions</CardTitle>
            <CardDescription>Shortcuts for common administrator workflows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" variant="secondary">
              Review pending hospital staff approvals
            </Button>
            <Button className="w-full" variant="outline">
              Open operations playbook
            </Button>
            <Button className="w-full" variant="ghost">
              View live system logs
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Recent security events</CardTitle>
            <CardDescription>Track policy changes and privileged account activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {["Updated staff permissions", "Synced inventory collections", "Reviewed donor audit log"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-md border border-border/80 px-3 py-2">
                <LogIn className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{item}</p>
                  <p className="text-xs text-muted-foreground">Just now · Automated</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
