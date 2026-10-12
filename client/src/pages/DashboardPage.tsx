import { useAuth } from "@/context/AuthContext";
import { BloodInventoryTable } from "@/components/dashboard/BloodInventoryTable";
import { RequestBloodForm } from "@/components/dashboard/RequestBloodForm";
import { UrgencyBadge } from "@/components/dashboard/UrgencyBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, ClipboardList, Droplets, Mail, Heart, Phone, Trophy } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBloodInventory } from "@/hooks/useBloodInventory";
import { aggregateUsableInventory } from "@/lib/inventory";
import { useBloodRequests } from "@/hooks/useBloodRequests";

const statusColorByValue: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-200 dark:border-yellow-900",
  fulfilled: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900",
  approved: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900",
  rejected: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: rawInventory = [], isLoading: inventoryLoading } = useBloodInventory();
  // The API only returns this user's own requests
  const { data: requests = [], isLoading: requestsLoading } = useBloodRequests();

  if (!user) return null;

  // One entry per hospital and blood type, unexpired units only
  const inventory = aggregateUsableInventory(rawInventory);
  const totalUnits = inventory.reduce((acc, curr) => acc + (curr.quantity ?? 0), 0);
  const lowStockCount = inventory.filter((entry) => entry.quantity < 5).length;
  const openRequests = requests.filter((r) => r.status === "pending" || r.status === "approved");

  return (
    <div className="w-full py-8 px-4 md:px-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}</p>
        </div>
        {user.role === "donor" && (
          <Link href="/donor-dashboard">
            <Button variant="outline">
              <Trophy className="mr-2 h-4 w-4" />
              Donations &amp; achievements
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Blood Units</CardTitle>
            <Droplets className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryLoading ? "…" : totalUnits}</div>
            <p className="text-xs text-muted-foreground">Across the hospital network</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryLoading ? "…" : lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Hospital blood groups under 5 units</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Open Requests</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requestsLoading ? "…" : openRequests.length}</div>
            <p className="text-xs text-muted-foreground">Pending or approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fulfilled</CardTitle>
            <ClipboardList className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requestsLoading ? "…" : requests.filter((r) => r.status === "fulfilled").length}
            </div>
            <p className="text-xs text-muted-foreground">Requests completed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="search" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="search">Search Blood</TabsTrigger>
          <TabsTrigger value="request">Request Blood</TabsTrigger>
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Availability</CardTitle>
              <CardDescription>Real-time blood stock across our network.</CardDescription>
            </CardHeader>
            <CardContent>
              <BloodInventoryTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="request" className="space-y-4">
          <RequestBloodForm />
        </TabsContent>

        <TabsContent value="my-requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Requests</CardTitle>
              <CardDescription>Track the status of blood requests you have submitted.</CardDescription>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <p className="text-sm text-muted-foreground">Loading requests…</p>
              ) : requests.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  You haven't submitted any blood requests yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div
                      key={req._id}
                      className={cn(
                        "flex flex-col gap-2 p-4 border rounded-lg bg-card sm:flex-row sm:items-center sm:justify-between",
                        req.urgency === "critical" && req.status === "pending" &&
                          "border-red-200 bg-red-50/80 dark:border-red-900 dark:bg-red-950/30"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-semibold">{req.patientName}</h4>
                          <Badge
                            variant="outline"
                            className={cn("capitalize", statusColorByValue[req.status])}
                          >
                            {req.status}
                          </Badge>
                          <UrgencyBadge urgency={req.urgency} size="sm" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {req.quantity} unit(s) of {req.bloodType} at {req.hospitalName}
                          {req.approvedByHospitalName && req.status !== "pending"
                            ? ` · handled by ${req.approvedByHospitalName}`
                            : ""}
                        </p>
                        {req.status === "rejected" && req.rejectionReason && (
                          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                            Reason: {req.rejectionReason}
                          </p>
                        )}
                      </div>
                      {req.createdAt && (
                        <p className="text-xs text-muted-foreground shrink-0">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="border-t pt-8">
        <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Email Us</CardTitle>
              <Mail className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <a
                href="mailto:bloodflowhub@gmail.com"
                className="text-primary hover:underline font-medium break-all"
              >
                bloodflowhub@gmail.com
              </a>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Our Mission</CardTitle>
              <Heart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Connecting donors with those in need, one drop at a time.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Phone className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We typically respond within 24-48 hours.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
