import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { BloodInventoryTable } from "@/components/dashboard/BloodInventoryTable";
import { RequestBloodForm } from "@/components/dashboard/RequestBloodForm";
import { DonorApprovalList } from "@/components/dashboard/DonorApprovalList";
import { UrgencyBadge } from "@/components/dashboard/UrgencyBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, AlertTriangle, Droplets, Mail, Heart, Phone } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBloodInventory } from "@/hooks/useBloodInventory";

export default function DashboardPage() {
  const { user } = useAuth();
  const { requests } = useData();
  const {
    data: liveInventory = [],
    isLoading: liveInventoryLoading,
  } = useBloodInventory();
  const { inventory, requests, refreshInventory } = useData();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  // Refresh inventory on page load and when window event fires
  useEffect(() => {
    refreshInventory();
    
    const handleInventoryUpdate = () => {
      refreshInventory();
    };

    window.addEventListener('bloodInventoryUpdated', handleInventoryUpdate);
    return () => window.removeEventListener('bloodInventoryUpdated', handleInventoryUpdate);
  }, [refreshInventory]);

  if (!user) return null;

  const totalUnits = liveInventory.reduce((acc, curr) => acc + (curr.quantity ?? 0), 0);
  const lowStockCount = liveInventory.filter((entry) => entry.status === "limited" || entry.quantity < 5).length;
  const criticalRequests = requests.filter(r => r.urgency === "critical").length;
  const isHospitalStaff = user.role === "hospital" || user.role === "admin";
  const statusColorByValue: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-800 border-yellow-200",
    fulfilled: "bg-emerald-50 text-emerald-700 border-emerald-200",
    approved: "bg-blue-50 text-blue-700 border-blue-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="w-full py-8 px-4 md:px-8 space-y-8">
      {/* Header Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}</p>
        </div>
      </div>

      {/* Overview Cards (Role agnostic overview) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Blood Units</CardTitle>
            <Droplets className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveInventoryLoading ? "…" : totalUnits}
            </div>
            <p className="text-xs text-muted-foreground">Across all groups</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveInventoryLoading ? "…" : lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground">Blood groups critical</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
            <p className="text-xs text-muted-foreground">Pending fulfillment</p>
          </CardContent>
        </Card>
        {isHospitalStaff && (
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Donors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Role Based Content */}
      <Tabs defaultValue={isHospitalStaff ? "inventory" : "search"} className="space-y-4">
        <TabsList>
          {isHospitalStaff ? (
            <>
              <TabsTrigger value="inventory">Inventory Management</TabsTrigger>
              <TabsTrigger value="donors">Donor Approvals</TabsTrigger>
              <TabsTrigger value="requests">Active Requests</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="search">Search Blood</TabsTrigger>
              <TabsTrigger value="request">Request Blood</TabsTrigger>
              {user.role === 'donor' && <TabsTrigger value="history">My Donations</TabsTrigger>}
            </>
          )}
        </TabsList>

        {/* Manager Views */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
             <CardHeader>
              <CardTitle>Blood Inventory</CardTitle>
              <CardDescription>Manage stock levels for your hospital.</CardDescription>
            </CardHeader>
            <CardContent>
              <BloodInventoryTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="donors" className="space-y-4">
          <Card>
             <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Review and approve new donor registrations.</CardDescription>
            </CardHeader>
            <CardContent>
              <DonorApprovalList />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Receiver/Donor Views */}
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

        {/* Shared active requests view for manager to see what's incoming */}
        <TabsContent value="requests" className="space-y-4">
           <Card>
             <CardHeader>
              <CardTitle>Incoming Requests</CardTitle>
              <CardDescription>Requests from receivers that need fulfillment.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requests.map(req => {
                  const formattedStatus = req.status.charAt(0).toUpperCase() + req.status.slice(1);

                  return (
                    <div
                      key={req.id}
                      className={cn(
                        "flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/10 transition-colors",
                        req.urgency === "critical" &&
                          "border-red-200 bg-red-50/80 dark:bg-red-950/30 shadow-[0_0_0_1px_rgba(239,68,68,0.35)]"
                      )}
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-semibold">{req.patientName}</h4>
                          <Badge
                            variant="outline"
                            className={cn(
                              "capitalize",
                              statusColorByValue[req.status] || "bg-muted text-foreground border-muted"
                            )}
                          >
                            {formattedStatus}
                          </Badge>
                          <UrgencyBadge urgency={req.urgency} size="sm" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Needs {req.unitsNeeded} unit(s) of {req.bloodGroup} at {req.hospitalName}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p>No donation history yet.</p>
          </div>
        </TabsContent>

      </Tabs>

      {/* Contact Section */}
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
