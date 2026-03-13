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
import AdminAnalytics from "@/components/dashboard/AdminAnalytics";
import { BloodExpiryAlerts } from "@/components/dashboard/BloodExpiryAlerts";
import { ActiveRequestsTable } from "@/components/dashboard/ActiveRequestsTable";

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
      color: "border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/70 dark:bg-sky-950/50 dark:text-sky-300",
    },
    {
      title: "Verified Users",
      description: "Email verified accounts",
      value: stats.verifiedUsers,
      icon: CheckCircle,
      color: "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/50 dark:text-emerald-300",
    },
    {
      title: "Unverified Users",
      description: "Pending email verification",
      value: stats.unverifiedUsers,
      icon: Clock,
      color: "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/70 dark:bg-amber-950/50 dark:text-amber-300",
    },
    {
      title: "Active Donors",
      description: "Registered blood donors",
      value: stats.totalDonors,
      icon: UserCheck,
      color: "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/70 dark:bg-rose-950/50 dark:text-rose-300",
    },
    {
      title: "Hospitals",
      description: "Hospital login accounts",
      value: stats.totalHospitals,
      icon: Database,
      color: "border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800/70 dark:bg-indigo-950/50 dark:text-indigo-300",
    },
    {
      title: "Blood Receivers",
      description: "Patients seeking blood",
      value: stats.totalReceivers,
      icon: TrendingUp,
      color: "border border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800/70 dark:bg-orange-950/50 dark:text-orange-300",
    },
  ];

  return (
    <div className="w-full bg-linear-to-b from-slate-50 via-background to-slate-100/80 py-10 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/80">
      <div className="mx-auto w-full max-w-[1600px] space-y-8 px-4 md:px-8">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 shadow-sm">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Administrator Control Center</h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Monitor system activity, user statistics, and manage all registered users in BloodFlow Hub.
            </p>
          </div>
        </div>
        <Separator className="max-w-xl bg-border/70" />
      </header>

      {/* Statistics Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Dashboard Statistics</h2>
        {statsLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading statistics...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {adminWidgets.map(({ title, description, value, icon: Icon, color }) => (
              <Card key={title} className="border-border/70 bg-card/90 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-card/95">
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

      {/* Analytics Section */}
      <section>
        <AdminAnalytics />
      </section>

      {/* Active Requests Section */}
      <section>
        <ActiveRequestsTable />
      </section>

      {/* Blood Expiry Alerts Section */}
      <section>
        <BloodExpiryAlerts />
      </section>

      {/* User Management Section */}
      <section>
        <UserManagement />
      </section>

      {/* Quick Stats */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/90 shadow-sm dark:bg-card/95">
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

        <Card className="border-border/70 bg-card/90 shadow-sm dark:bg-card/95">
          <CardHeader>
            <CardTitle className="text-lg">User Distribution</CardTitle>
            <CardDescription>Breakdown by user role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { label: "Donors", value: stats.totalDonors, color: "bg-gradient-to-r from-red-500 to-red-600" },
              { label: "Hospitals", value: stats.totalHospitals, color: "bg-gradient-to-r from-blue-500 to-blue-600" },
              { label: "Blood Receivers", value: stats.totalReceivers, color: "bg-gradient-to-r from-amber-500 to-amber-600" },
            ].map((item) => {
              const maxValue = Math.max(stats.totalDonors, stats.totalHospitals, stats.totalReceivers, 1);
              const percentage = (item.value / maxValue) * 100;
              return (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <span className="text-sm font-bold text-primary">{item.value}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className={`${item.color} h-3 rounded-full transition-all duration-500 ease-out shadow-md`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>
      </div>
    </div>
  );
}
