import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { BloodInventoryTable } from "@/components/dashboard/BloodInventoryTable";
import { RequestBloodForm } from "@/components/dashboard/RequestBloodForm";
import { DonorApprovalList } from "@/components/dashboard/DonorApprovalList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, AlertTriangle, Droplets } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user } = useAuth();
  const { inventory, requests } = useData();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  if (!user) return null;

  const lowStockCount = inventory.filter(i => i.units < 5).length;
  const criticalRequests = requests.filter(r => r.status === "critical").length;

  return (
    <div className="container max-w-screen-2xl py-8 px-4 md:px-8 space-y-8">
      {/* Header Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name} 
            {user.role === 'manager' && ` - ${user.hospitalName}`}
          </p>
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
            <div className="text-2xl font-bold">{inventory.reduce((acc, curr) => acc + curr.units, 0)}</div>
            <p className="text-xs text-muted-foreground">Across all groups</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockCount}</div>
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
        {user.role === 'manager' && (
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
      <Tabs defaultValue={user.role === 'manager' ? "inventory" : "search"} className="space-y-4">
        <TabsList>
          {user.role === 'manager' ? (
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
                {requests.map(req => (
                  <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/10 transition-colors">
                    <div>
                      <h4 className="font-semibold">{req.patientName} <Badge variant={req.status === 'critical' ? 'destructive' : 'secondary'}>{req.status}</Badge></h4>
                      <p className="text-sm text-muted-foreground">Needs {req.unitsNeeded} unit(s) of {req.bloodGroup} at {req.hospitalName}</p>
                    </div>
                    <Button size="sm" variant="outline">View Details</Button>
                  </div>
                ))}
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
    </div>
  );
}
