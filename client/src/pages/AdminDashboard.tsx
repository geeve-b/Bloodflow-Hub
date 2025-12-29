import { useMemo, useState, useEffect } from "react";
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
  CheckCircle,
  Clock,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import UserManagement from "@/components/dashboard/UserManagement";

const ADMIN_EMAIL = "bloodflowhub@gmail.com";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalHospitals: 0,
    totalReceivers: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const isAdmin = useMemo(
    () => user?.role === "admin" && user.email.toLowerCase() === ADMIN_EMAIL,
    [user]
  );

  // Fetch statistics
  useEffect(() => {
    if (!isAdmin) return;

    const fetchStats = async () => {
      try {
        const response = await fetch("/api/users");
        if (!response.ok) throw new Error("Failed to fetch users");
        const users = await response.json();

        const totalUsers = users.length;
        const totalDonors = users.filter((u: any) => u.role === "donor").length;
        const totalHospitals = users.filter((u: any) => u.role === "hospital").length;
        const totalReceivers = users.filter((u: any) => u.role === "receiver").length;
        const verifiedUsers = users.filter((u: any) => u.emailVerified).length;
        const unverifiedUsers = totalUsers - verifiedUsers;

        setStats({
          totalUsers,
          totalDonors,
          totalHospitals,
          totalReceivers,
          verifiedUsers,
          unverifiedUsers,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin]);

  if (!user) {
    return (
      <div className="w-full py-12 px-4 md:px-8">
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
      <div className="w-full py-12 px-4 md:px-8">
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

  const adminWidgets = [
    {
      title: "Total Users",
      description: "All registered users in the system",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-blue-500/10 text-blue-700",
    },
    {
      title: "Verified Users",
      description: "Email verified accounts",
      value: stats.verifiedUsers,
      icon: CheckCircle,
      color: "bg-green-500/10 text-green-700",
    },
    {
      title: "Unverified Users",
      description: "Pending email verification",
      value: stats.unverifiedUsers,
      icon: Clock,
      color: "bg-yellow-500/10 text-yellow-700",
    },
    {
      title: "Active Donors",
      description: "Registered blood donors",
      value: stats.totalDonors,
      icon: UserCheck,
      color: "bg-red-500/10 text-red-700",
    },
    {
      title: "Hospitals",
      description: "Hospital staff accounts",
      value: stats.totalHospitals,
      icon: Database,
      color: "bg-purple-500/10 text-purple-700",
    },
    {
      title: "Blood Receivers",
      description: "Patients seeking blood",
      value: stats.totalReceivers,
      icon: TrendingUp,
      color: "bg-orange-500/10 text-orange-700",
    },
  ];

  return (
    <div className="w-full py-10 px-4 md:px-8 space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Administrator Control Center</h1>
            <p className="text-muted-foreground">
              Monitor system activity, user statistics, and manage all registered users in BloodFlow Hub.
            </p>
          </div>
        </div>
        <Separator className="max-w-xl" />
      </header>

      {/* Statistics Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Dashboard Statistics</h2>
        {statsLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading statistics...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {adminWidgets.map(({ title, description, value, icon: Icon, color }) => (
              <Card key={title} className="border-border/70 hover:shadow-md transition-shadow">
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">{title}</CardTitle>
                    <div className={`p-2 rounded-lg ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <CardDescription className="text-xs">{description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* User Management Section */}
      <section>
        <UserManagement />
      </section>

      {/* Quick Stats */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-lg">Verification Status</CardTitle>
            <CardDescription>Email verification breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Verified</p>
                <p className="text-sm font-semibold">{stats.verifiedUsers}</p>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{
                    width:
                      stats.totalUsers > 0
                        ? `${(stats.verifiedUsers / stats.totalUsers) * 100}%`
                        : "0%",
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Pending</p>
                <p className="text-sm font-semibold">{stats.unverifiedUsers}</p>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all"
                  style={{
                    width:
                      stats.totalUsers > 0
                        ? `${(stats.unverifiedUsers / stats.totalUsers) * 100}%`
                        : "0%",
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-lg">User Distribution</CardTitle>
            <CardDescription>Breakdown by user role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-2 rounded bg-red-50 dark:bg-red-950">
              <p className="text-sm font-medium">Donors</p>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">{stats.totalDonors}</p>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-purple-50 dark:bg-purple-950">
              <p className="text-sm font-medium">Hospitals</p>
              <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                {stats.totalHospitals}
              </p>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-orange-50 dark:bg-orange-950">
              <p className="text-sm font-medium">Blood Receivers</p>
              <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                {stats.totalReceivers}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
