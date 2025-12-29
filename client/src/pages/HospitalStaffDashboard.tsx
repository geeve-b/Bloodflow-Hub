import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Droplets,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  FileText,
  X,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_URL = "http://localhost:3001/api";

interface BloodRequest {
  _id: string;
  requesterId: string;
  requesterName: string;
  hospitalName: string;
  bloodType: string;
  quantity: number;
  urgency: "low" | "medium" | "high" | "critical";
  reason?: string;
  status: "pending" | "approved" | "fulfilled" | "rejected";
  createdAt: string;
  updatedAt: string;
  // Extended fields (will be populated from server)
  patientName?: string;
  purpose?: string;
  operationType?: string;
  requiredWithin?: string;
  hospitalAddress?: string;
  contactNumber?: string;
  remarks?: string;
}

interface StaffProfile {
  _id: string;
  firstName: string;
  lastName: string;
  staffId: string;
  position: string;
  phone: string;
  email: string;
  hospitalName: string;
}

export default function HospitalStaffDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<BloodRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");

  // Debug logging
  useEffect(() => {
    console.log("🏥 HospitalStaffDashboard mounted");
    console.log("👤 User state:", user);
  }, []);

  useEffect(() => {
    console.log("📝 User updated:", user);
  }, [user]);

  // Fetch staff profile
  useEffect(() => {
    const fetchStaffProfile = async () => {
      if (!user) return;

      try {
        const response = await fetch(
          `${API_URL}/profile/${user.id}/${user.role}`
        );
        if (response.ok) {
          const data = await response.json();
          setStaffProfile(data);
        }
      } catch (error) {
        console.error("Failed to fetch staff profile:", error);
      }
    };

    fetchStaffProfile();
  }, [user]);

  // Fetch blood requests
  useEffect(() => {
    const fetchRequests = async () => {
      // Don't redirect, just skip fetching if no user
      if (!user) {
        console.log("No user yet, skipping request fetch");
        return;
      }

      // Only fetch if user is hospital staff
      if (user.role !== "hospital") {
        console.log("User is not hospital staff, skipping fetch");
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/blood-requests`);
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} - Failed to fetch requests`);
        }

        const data = await response.json();
        console.log("Fetched requests:", data);
        setRequests(Array.isArray(data) ? data : []);
        setFilteredRequests(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching blood requests:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch blood requests",
          variant: "destructive",
        });
        // Set empty array on error to show "No requests found" message
        setRequests([]);
        setFilteredRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user, toast]);

  // Apply filters
  useEffect(() => {
    let filtered = requests;

    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    if (urgencyFilter !== "all") {
      filtered = filtered.filter((req) => req.urgency === urgencyFilter);
    }

    setFilteredRequests(filtered);
  }, [requests, statusFilter, urgencyFilter]);

  const handleViewDetails = (request: BloodRequest) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  const getUrgencyColor = (
    urgency: "low" | "medium" | "high" | "critical"
  ) => {
    switch (urgency) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (
    status: "pending" | "approved" | "fulfilled" | "rejected"
  ) => {
    switch (status) {
      case "fulfilled":
        return "bg-green-100 text-green-800 border-green-300";
      case "approved":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    if (urgency === "critical" || urgency === "high") {
      return <AlertTriangle className="h-4 w-4" />;
    }
    return null;
  };

  const activeRequests = filteredRequests.filter(
    (r) => r.status === "pending" || r.status === "approved"
  ).length;
  const criticalRequests = filteredRequests.filter(
    (r) => r.urgency === "critical"
  ).length;

  try {
    // Show loading while user is being loaded
    if (!user) {
      console.log("⏳ User not loaded yet");
      return (
        <div className="w-full min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="text-muted-foreground space-y-3">
                <div className="animate-pulse">
                  <Droplets className="h-8 w-8 mx-auto mb-3 text-primary" />
                </div>
                <p className="text-sm">Loading dashboard...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    console.log("👤 User role:", user.role);

    // Check if user is hospital staff
    if (user.role !== "hospital") {
      console.log("❌ User role is not hospital. Current role:", user.role);
      return (
        <div className="w-full min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-destructive bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm">This dashboard is only accessible to hospital staff members.</p>
                <p className="text-xs text-muted-foreground">Your role: <strong>{user.role}</strong></p>
                <p className="text-xs text-muted-foreground">Your name: <strong>{user.name}</strong></p>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-2 rounded text-xs space-y-1">
                <p><strong>Debug:</strong></p>
                <p>ID: {user.id}</p>
                <p>Email: {user.email}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.location.href = "/"}
                  className="flex-1 text-xs"
                  variant="outline"
                  size="sm"
                >
                  Home
                </Button>
                <Button
                  onClick={() => window.location.href = "/"}
                  className="flex-1 text-xs"
                  variant="destructive"
                  size="sm"
                >
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Main dashboard
    return (
    <div className="container max-w-screen-2xl py-8 px-4 md:px-8 space-y-8">
      {/* Debug Info */}
      <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm">
        <p><strong>Debug Info:</strong> User: {user?.name}, Role: {user?.role}</p>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Hospital Staff Dashboard
        </h1>
        <p className="text-lg text-primary font-semibold">
          Welcome, {user?.name || user?.username || "Staff Member"}
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
            <Droplets className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending or approved requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {criticalRequests}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredRequests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on current filters
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Requests Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Active Requests</h2>
            <p className="text-muted-foreground text-sm mt-1">
              View and manage blood requests from patients and hospitals
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="fulfilled">Fulfilled</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Urgency</label>
                <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Urgencies</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                Loading blood requests...
              </div>
            </CardContent>
          </Card>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                No requests found matching your filters
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Request ID</TableHead>
                    <TableHead className="font-semibold">Patient Name</TableHead>
                    <TableHead className="font-semibold">Blood Type</TableHead>
                    <TableHead className="font-semibold text-center">
                      Quantity
                    </TableHead>
                    <TableHead className="font-semibold">Urgency</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="text-right font-semibold">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow
                      key={request._id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-mono text-xs">
                        {request._id.slice(-8).toUpperCase()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {request.requesterName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-bold">
                          {request.bloodType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-primary">
                          {request.quantity}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          units
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`font-medium ${getUrgencyColor(
                            request.urgency || "medium"
                          )} flex items-center gap-1 w-fit`}
                        >
                          {getUrgencyIcon(request.urgency || "medium")}
                          {(request.urgency || "medium").charAt(0).toUpperCase() +
                            (request.urgency || "medium").slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`font-medium ${getStatusColor(
                            request.status || "pending"
                          )}`}
                        >
                          {(request.status || "pending").charAt(0).toUpperCase() +
                            (request.status || "pending").slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(request)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      {/* Details Modal */}
      {selectedRequest && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Blood Request Details</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDetailsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Blood Requirement Details */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-primary" />
                  Blood Requirement Details
                </h3>
                <div className="grid gap-4 md:grid-cols-2 bg-muted/40 p-4 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      PATIENT NAME
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      {selectedRequest.patientName ||
                        selectedRequest.requesterName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      BLOOD GROUP REQUIRED
                    </p>
                    <p className="text-sm font-bold mt-1 text-primary">
                      {selectedRequest.bloodType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      QUANTITY OF BLOOD
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      {selectedRequest.quantity} Units
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      PURPOSE OF REQUIREMENT
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      {selectedRequest.purpose || selectedRequest.reason || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      TYPE OF OPERATION
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      {selectedRequest.operationType || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Time Requirement */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Time Requirement
                </h3>
                <div className="grid gap-4 md:grid-cols-2 bg-muted/40 p-4 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      REQUIRED WITHIN
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      {selectedRequest.requiredWithin || "As soon as possible"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      URGENCY LEVEL
                    </p>
                    <div className="mt-1">
                      <Badge
                        className={`font-bold ${getUrgencyColor(
                          selectedRequest.urgency || "medium"
                        )}`}
                      >
                        {(selectedRequest.urgency || "medium").charAt(0).toUpperCase() +
                          (selectedRequest.urgency || "medium").slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hospital Details */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  Hospital Details
                </h3>
                <div className="grid gap-4 md:grid-cols-2 bg-muted/40 p-4 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      HOSPITAL NAME
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      {selectedRequest.hospitalName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      HOSPITAL LOCATION / ADDRESS
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      {selectedRequest.hospitalAddress || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      CONTACT NUMBER
                    </p>
                    <p className="text-sm font-semibold mt-1 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {selectedRequest.contactNumber || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Additional Information
                </h3>
                <div className="grid gap-4 md:grid-cols-2 bg-muted/40 p-4 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      REQUEST ID
                    </p>
                    <p className="text-sm font-mono font-bold mt-1">
                      {selectedRequest._id}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      REQUEST DATE
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      {new Date(selectedRequest.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      STATUS
                    </p>
                    <div className="mt-1">
                      <Badge
                        className={`font-bold ${getStatusColor(
                          selectedRequest.status || "pending"
                        )}`}
                      >
                        {(selectedRequest.status || "pending")
                          .charAt(0)
                          .toUpperCase() + (selectedRequest.status || "pending").slice(1)}
                      </Badge>
                    </div>
                  </div>
                  {selectedRequest.remarks && (
                    <div className="md:col-span-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        REMARKS OR NOTES
                      </p>
                      <p className="text-sm mt-1 bg-white p-3 rounded border">
                        {selectedRequest.remarks}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDetailsOpen(false)}
                >
                  Close
                </Button>
                <Button className="flex-1">Process Request</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
    );
  } catch (error) {
    console.error("🚨 Error rendering HospitalStaffDashboard:", error);
    return (
      <div className="w-full min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">An error occurred while loading the dashboard.</p>
            <p className="text-xs font-mono bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
            <Button onClick={() => window.location.href = "/"} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
}
