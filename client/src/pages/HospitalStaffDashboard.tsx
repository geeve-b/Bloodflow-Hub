import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UrgencyBadge } from "@/components/dashboard/UrgencyBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useDonorSuggestions } from "@/hooks/useDonorSuggestions";
import { cn } from "@/lib/utils";
import {
  Droplets,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  FileText,
  X,
  Filter,
  Pencil,
  RefreshCcw,
  Loader2,
  UserCheck,
  Search,
  Building2,
} from "lucide-react";
import { BloodExpiryAlerts } from "@/components/dashboard/BloodExpiryAlerts";
import { InterHospitalBloodSharing } from "@/components/dashboard/InterHospitalBloodSharing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InventoryStatus,
  formatInventoryTimestamp,
  INVENTORY_STALE_THRESHOLD_HOURS,
  inventoryStatusMeta,
  isInventoryStale,
  isInventoryUsable,
  normalizeInventoryStatus,
  calculateStatusFromQuantity,
} from "@/lib/inventory";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
const INVENTORY_STATUS_ORDER: InventoryStatus[] = [
  "available",
  "limited",
  "not_available",
];

type NormalizedUrgency = "critical" | "normal";

const normalizeUrgency = (value?: string | null): NormalizedUrgency =>
  value === "critical" ? "critical" : "normal";

interface BloodRequest {
  _id: string;
  requesterId: string;
  requesterName: string;
  hospitalName: string;
  bloodType: string;
  quantity: number;
  urgency: NormalizedUrgency;
  reason?: string;
  status: "pending" | "approved" | "fulfilled" | "rejected";
  rejectionReason?: string;
  approvedByHospitalId?: string;
  approvedByHospitalName?: string;
  createdAt: string;
  updatedAt: string;
  // Extended fields (will be populated from server)
  patientName?: string;
  purpose?: string;
  operationType?: string;
  requiredWithin?: string;
  hospitalAddress?: string;
  contactNumber?: string;
  secondaryContactNumber?: string;
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

interface BloodInventory {
  _id: string;
  hospitalId: string;
  hospitalName?: string;
  bloodType: string;
  quantity: number;
  expiryDate?: string;
  status: InventoryStatus;
  createdAt: string;
  updatedAt: string;
}

export default function HospitalStaffDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<BloodRequest[]>([]);
  const [inventory, setInventory] = useState<BloodInventory[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [editingInventory, setEditingInventory] = useState<BloodInventory | null>(null);
  const [inventoryDraft, setInventoryDraft] = useState<{ quantity: string; status: InventoryStatus }>({ quantity: "", status: "available" });
  const [inventorySaving, setInventorySaving] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [requestsTab, setRequestsTab] = useState<"active" | "completed">("active");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<"all" | NormalizedUrgency>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processAction, setProcessAction] = useState<"approve" | "reject" | "fulfill" | null>(null);
  const [showProcessMenu, setShowProcessMenu] = useState(false);
  const [processNotes, setProcessNotes] = useState("");
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showAddBloodModal, setShowAddBloodModal] = useState(false);
  const [addBloodLoading, setAddBloodLoading] = useState(false);
  const [addBloodForm, setAddBloodForm] = useState({
    bloodType: "",
    quantity: "",
    expiryDate: "",
  });
  const [activeTab, setActiveTab] = useState<"search" | "request" | "sharing">("search");
  const {
    data: donorSuggestions = [],
    isLoading: donorSuggestionsLoading,
    isError: donorSuggestionsHasError,
    error: donorSuggestionsError,
    refetch: refetchDonorSuggestions,
    isFetching: donorSuggestionsFetching,
  } = useDonorSuggestions(
    isDetailsOpen && selectedRequest ? selectedRequest._id : undefined,
    5
  );

  // Debug logging
  useEffect(() => {
    console.log("🏥 HospitalStaffDashboard mounted");
    console.log("👤 User state:", user);
  }, []);

  useEffect(() => {
    console.log("📝 User updated:", user);
    // Redirect to home if user logs out (becomes null)
    if (user === null) {
      const timer = setTimeout(() => {
        setLocation("/");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, setLocation]);

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

  const fetchInventory = useCallback(async () => {
    if (!user || user.role !== "hospital") return;

    setInventoryLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/blood-inventory/hospital/${user.id}`
      );
      if (!response.ok) {
        throw new Error("Unable to load hospital inventory");
      }

      const data = await response.json();
      const normalized = Array.isArray(data)
        ? data.map((entry: BloodInventory) => ({
            ...entry,
            status: normalizeInventoryStatus(entry.status),
          }))
        : [];
      setInventory(normalized);
      setInventoryError(null);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      setInventory([]);
      setInventoryError(
        error instanceof Error
          ? error.message
          : "Failed to load inventory data"
      );
    } finally {
      setInventoryLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

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
        const normalized = Array.isArray(data)
          ? data.map((req) => ({ ...req, urgency: normalizeUrgency(req.urgency) }))
          : [];
        
        // Filter requests: 
        // - Pending/Active: show all pending requests
        // - Approved: only show if THIS hospital approved it
        // - Completed: only show if THIS hospital approved it
        const filtered = normalized.filter((req) => {
          if (req.status === "pending") {
            return true; // All hospitals can see pending requests
          }
          // For approved, fulfilled, rejected - only show if this hospital approved/handled it
          return req.approvedByHospitalId === user.id || req.approvedByHospitalName === user.name;
        });
        
        setRequests(filtered);
        setFilteredRequests(filtered);
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

  const getUsableInventoryForType = (bloodType: string) =>
    inventory.find(
      (inv) => inv.bloodType === bloodType && isInventoryUsable(inv.status)
    );

  const openInventoryEditor = (entry: BloodInventory) => {
    setEditingInventory(entry);
    setInventoryDraft({
      quantity: entry.quantity?.toString() ?? "0",
      status: entry.status ?? "available",
    });
  };

  const closeInventoryEditor = () => {
    setEditingInventory(null);
    setInventoryDraft({ quantity: "", status: "available" });
    setInventorySaving(false);
  };

  const handleInventorySave = async () => {
    if (!editingInventory) return;

    const quantityValue = Math.max(0, Number(inventoryDraft.quantity) || 0);
    setInventorySaving(true);
    try {
      const response = await fetch(
        `${API_URL}/blood-inventory/${editingInventory._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quantity: quantityValue,
            status: inventoryDraft.status,
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || "Failed to update inventory");
      }

      const updated: BloodInventory = await response.json();
      setInventory((prev) =>
        prev.map((item) =>
          item._id === updated._id
            ? {
                ...updated,
                status: normalizeInventoryStatus(updated.status),
              }
            : item
        )
      );

      toast({
        title: "Inventory updated",
        description: `${updated.bloodType} now shows ${quantityValue} unit(s).`,
      });
      closeInventoryEditor();
    } catch (error) {
      toast({
        title: "Update failed",
        description:
          error instanceof Error
            ? error.message
            : "Unable to update inventory",
        variant: "destructive",
      });
    } finally {
      setInventorySaving(false);
    }
  };

  const statusCounts = useMemo(
    () =>
      inventory.reduce(
        (acc, entry) => {
          // Calculate status based on quantity instead of stored status
          const calculatedStatus = calculateStatusFromQuantity(entry.quantity);
          acc[calculatedStatus] = (acc[calculatedStatus] ?? 0) + 1;
          return acc;
        },
        { available: 0, limited: 0, not_available: 0 } as Record<
          InventoryStatus,
          number
        >
      ),
    [inventory]
  );

  const totalUnits = useMemo(
    () => inventory.reduce((sum, entry) => sum + (entry.quantity ?? 0), 0),
    [inventory]
  );

  const staleInventory = useMemo(
    () => inventory.filter((entry) => isInventoryStale(entry.updatedAt)),
    [inventory]
  );

  const sortedInventory = useMemo(
    () =>
      [...inventory].sort((a, b) => a.bloodType.localeCompare(b.bloodType)),
    [inventory]
  );

  // Apply filters
  useEffect(() => {
    let filtered = requests;

    // Filter by tab - Active (pending/approved) or Completed (fulfilled/rejected)
    if (requestsTab === "active") {
      filtered = filtered.filter((req) => 
        req.status === "pending" || req.status === "approved"
      );
    } else if (requestsTab === "completed") {
      filtered = filtered.filter((req) => 
        req.status === "fulfilled" || req.status === "rejected"
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => (req.status || "pending") === statusFilter);
    }

    if (urgencyFilter !== "all") {
      filtered = filtered.filter((req) => req.urgency === urgencyFilter);
    }

    setFilteredRequests(filtered);
  }, [requests, statusFilter, urgencyFilter, requestsTab]);

  const handleViewDetails = (request: BloodRequest) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  const handleAddBlood = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !addBloodForm.bloodType || !addBloodForm.quantity || !addBloodForm.expiryDate) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setAddBloodLoading(true);
    try {
      const response = await fetch(`${API_URL}/blood-inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId: user.id,
          hospitalName: staffProfile?.hospitalName || "Unknown Hospital",
          bloodType: addBloodForm.bloodType,
          quantity: parseInt(addBloodForm.quantity),
          expiryDate: addBloodForm.expiryDate,
          status: "available",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to add blood inventory");
      }

      const newInventory = await response.json();
      
      // Update inventory list
      setInventory([...inventory, newInventory]);
      
      // Reset form
      setAddBloodForm({ bloodType: "", quantity: "", expiryDate: "" });
      setShowAddBloodModal(false);
      
      toast({
        title: "Success",
        description: `${addBloodForm.quantity} units of ${addBloodForm.bloodType} blood added successfully`,
      });
      
      // Refresh inventory in other components via window event
      window.dispatchEvent(new Event('bloodInventoryUpdated'));
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add blood inventory",
        variant: "destructive",
      });
    } finally {
      setAddBloodLoading(false);
    }
  };

  const getStatusColor = (
    status: "pending" | "approved" | "fulfilled" | "rejected"
  ) => {
    switch (status) {
      case "fulfilled":
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border border-emerald-500/30";
      case "approved":
        return "bg-blue-500/15 text-blue-700 dark:text-blue-200 border border-blue-500/30";
      case "pending":
        return "bg-amber-500/15 text-amber-700 dark:text-amber-200 border border-amber-500/30";
      case "rejected":
        return "bg-destructive/10 text-destructive border border-destructive/40";
      default:
        return "bg-muted text-foreground border border-border";
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    if (urgency === "critical") {
      return <AlertTriangle className="h-4 w-4" />;
    }
    return null;
  };

  const handleProcessRequest = async (
    action: "approve" | "reject" | "fulfill",
    rejectionReason?: string
  ) => {
    if (!selectedRequest) return;

    setProcessingId(selectedRequest._id);
    try {
      // Check inventory for approve action
      if (action === "approve") {
        const availableInventory = getUsableInventoryForType(
          selectedRequest.bloodType
        );

        if (!availableInventory || availableInventory.quantity < selectedRequest.quantity) {
          toast({
            title: "Insufficient Inventory",
            description: `Not enough ${selectedRequest.bloodType} blood available. Required: ${selectedRequest.quantity} units, Available: ${availableInventory?.quantity || 0} units. Request will be rejected.`,
            variant: "destructive",
          });

          // Auto-reject if inventory insufficient
          const rejectResponse = await fetch(
            `${API_URL}/blood-requests/${selectedRequest._id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                status: "rejected",
                rejectionReason: `Insufficient ${selectedRequest.bloodType} blood inventory. Required: ${selectedRequest.quantity} units, Available: ${availableInventory?.quantity || 0} units.`
              }),
            }
          );

          if (rejectResponse.ok) {
            setRequests(
              requests.map((req) =>
                req._id === selectedRequest._id
                  ? { ...req, status: "rejected" }
                  : req
              )
            );
            setIsDetailsOpen(false);
          } else {
            throw new Error("Failed to auto-reject request due to insufficient inventory");
          }
          return;
        }
      }

      const response = await fetch(
        `${API_URL}/blood-requests/${selectedRequest._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            action === "reject"
              ? {
                  status: "rejected",
                  rejectionReason: rejectionReason || "Request rejected by hospital staff",
                }
              : {
                  status:
                    action === "approve"
                      ? "approved"
                      : action === "fulfill"
                        ? "fulfilled"
                        : "rejected",
                  // Include hospital info when approving
                  ...(action === "approve" && {
                    approvedByHospitalId: user?.id,
                    approvedByHospitalName: user?.name,
                  }),
                }
          ),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Failed to update request status"
        );
      }

      // Update local state
      const updatedStatus = action === "approve" ? "approved" : action === "fulfill" ? "fulfilled" : "rejected";
      setRequests(
        requests.map((req) =>
          req._id === selectedRequest._id
            ? { ...req, status: updatedStatus }
            : req
        )
      );

      // Send notification email if approved
      if (action === "approve") {
        try {
          await fetch(`${API_URL}/blood-requests/${selectedRequest._id}/notify-donors`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bloodType: selectedRequest.bloodType,
              quantity: selectedRequest.quantity,
            }),
          });
        } catch (emailError) {
          console.error("Failed to send notification:", emailError);
          // Don't show error to user, email is secondary
        }
      }

      toast({
        title: "Success",
        description: `Request ${updatedStatus} successfully${action === "approve" ? " and donors notified" : ""}`,
      });

      setIsDetailsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process request",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
      setProcessAction(null);
      setProcessNotes("");
    }
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
              <div className="flex gap-2">
                <Button
                  onClick={() => setLocation("/")}
                  className="flex-1 text-xs"
                  variant="outline"
                  size="sm"
                >
                  Home
                </Button>
                <Button
                  onClick={() => {
                    logout();
                    setLocation("/");
                  }}
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
    <div className="w-full min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b bg-card sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col gap-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight">
              Hospital Staff Dashboard
            </h1>
            <p className="text-lg text-primary font-semibold">
              Welcome, {user?.name || user?.username || "Staff Member"}
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b">
            <Button
              variant={activeTab === "search" ? "default" : "ghost"}
              onClick={() => setActiveTab("search")}
              className={cn(
                "rounded-b-none text-base font-semibold",
                activeTab === "search" && "bg-blue-600 hover:bg-blue-700"
              )}
            >
              <Search className="h-4 w-4 mr-2" />
              Search Blood
            </Button>
            <Button
              variant={activeTab === "request" ? "default" : "ghost"}
              onClick={() => setActiveTab("request")}
              className={cn(
                "rounded-b-none text-base font-semibold",
                activeTab === "request" && "bg-blue-600 hover:bg-blue-700"
              )}
            >
              <Droplets className="h-4 w-4 mr-2" />
              Request Blood
            </Button>
            <Button
              variant={activeTab === "sharing" ? "default" : "ghost"}
              onClick={() => setActiveTab("sharing")}
              className={cn(
                "rounded-b-none text-base font-semibold",
                activeTab === "sharing" && "bg-blue-600 hover:bg-blue-700"
              )}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Inter-Hospital Sharing
            </Button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="w-full py-8 px-4 md:px-8 space-y-8">
        {/* Tab Content */}
        {activeTab === "search" && (
          <>
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

      {/* Blood Inventory Expiry Alerts Section */}
      <div>
        <BloodExpiryAlerts />
      </div>

      {/* Blood Inventory Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Blood Inventory</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Live stock levels for {staffProfile?.hospitalName || "your hospital"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tracking {inventory.length} blood group entr{inventory.length === 1 ? "y" : "ies"} · {totalUnits} total units
            </p>
          </div>
          <div className="flex items-center w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="w-full md:w-auto"
              onClick={fetchInventory}
              disabled={inventoryLoading}
            >
              {inventoryLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </div>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setShowAddBloodModal(true)}
          >
            <Droplets className="h-4 w-4 mr-2" />
            Add Blood
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {INVENTORY_STATUS_ORDER.map((status) => {
            const meta = inventoryStatusMeta[status];
            const StatusIcon = meta.icon;
            return (
              <Card key={status}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      {meta.label}
                    </p>
                    <p className="text-2xl font-bold mt-1">
                      {statusCounts[status] ?? 0}
                    </p>
                  </div>
                  <StatusIcon className={cn("h-6 w-6", meta.iconClass)} />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {staleInventory.length > 0 && (
          <div className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-semibold">
              <AlertTriangle className="h-5 w-5" />
              {staleInventory.length} inventory entr{staleInventory.length === 1 ? "y" : "ies"} need updates
            </div>
            <p className="text-sm text-amber-800">
              Last updated more than {INVENTORY_STALE_THRESHOLD_HOURS} hours ago. Donors will see a stale warning until refreshed.
            </p>
          </div>
        )}

        {inventoryLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                Loading inventory...
              </div>
            </CardContent>
          </Card>
        ) : inventoryError ? (
          <Card>
            <CardContent className="pt-6 space-y-3 text-center">
              <p className="text-sm text-destructive">{inventoryError}</p>
              <Button variant="outline" size="sm" onClick={fetchInventory}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : inventory.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                No blood inventory records found
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Blood Group</TableHead>
                    <TableHead className="font-semibold text-center">
                      Units
                    </TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Last Updated</TableHead>
                    <TableHead className="text-right font-semibold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedInventory.map((entry) => {
                    // Calculate status based on quantity
                    const calculatedStatus = calculateStatusFromQuantity(entry.quantity);
                    const meta = inventoryStatusMeta[calculatedStatus];
                    const stale = isInventoryStale(entry.updatedAt);
                    const StatusIcon = meta.icon;
                    return (
                      <TableRow
                        key={entry._id}
                        className={cn(
                          "hover:bg-muted/40 transition-colors",
                          stale && "bg-amber-50/70 border-l-2 border-amber-300",
                          calculatedStatus === "not_available" && "opacity-80"
                        )}
                      >
                        <TableCell>
                          <div className="font-semibold text-lg text-primary">
                            {entry.bloodType}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {entry.hospitalName || staffProfile?.hospitalName || "Hospital"}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-bold text-primary">
                            {entry.quantity}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            units
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge
                              variant="outline"
                              className={cn("gap-1 text-xs font-semibold", meta.badgeClass)}
                            >
                              <StatusIcon className={cn("h-3.5 w-3.5", meta.iconClass)} />
                              {meta.label}
                            </Badge>
                            <p className="text-[11px] text-muted-foreground">
                              {meta.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <p className="font-medium">
                              {formatInventoryTimestamp(entry.updatedAt)}
                            </p>
                            {stale && (
                              <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Needs refresh
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openInventoryEditor(entry)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Update
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
            </div>
          </>
        )}

        {activeTab === "request" && (
          <>
      {/* Active Requests Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Blood Requests</h2>
            <p className="text-muted-foreground text-sm mt-1">
              View and manage blood requests from patients and hospitals
            </p>
          </div>
        </div>

        {/* Request Tabs */}
        <div className="flex gap-2 border-b">
          <Button
            variant={requestsTab === "active" ? "default" : "ghost"}
            onClick={() => {
              setRequestsTab("active");
              setStatusFilter("all");
            }}
            className="rounded-b-none"
          >
            Active Requests
          </Button>
          <Button
            variant={requestsTab === "completed" ? "default" : "ghost"}
            onClick={() => {
              setRequestsTab("completed");
              setStatusFilter("all");
            }}
            className="rounded-b-none"
          >
            Completed Requests
          </Button>
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
                    {requestsTab === "active" && (
                      <>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                      </>
                    )}
                    {requestsTab === "completed" && (
                      <>
                        <SelectItem value="fulfilled">Fulfilled</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Urgency</label>
                <Select
                  value={urgencyFilter}
                  onValueChange={(value) => setUrgencyFilter(value as "all" | NormalizedUrgency)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Urgencies</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
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
                      className={cn(
                        "hover:bg-muted/30 transition-colors",
                        request.urgency === "critical" &&
                          "border-l-4 border-red-500 bg-red-50/70 dark:bg-red-950/30"
                      )}
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
                        <div className="flex items-center gap-2">
                          {getUrgencyIcon(request.urgency || "normal")}
                          <UrgencyBadge urgency={request.urgency || "normal"} size="sm" />
                        </div>
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
          </>
        )}

        {activeTab === "sharing" && (
          <InterHospitalBloodSharing />
        )}
      </div>

      {/* Inventory Editor */}
      <Dialog
        open={Boolean(editingInventory)}
        onOpenChange={(open) => {
          if (!open) {
            closeInventoryEditor();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Update {editingInventory?.bloodType} Inventory
            </DialogTitle>
            <DialogDescription>
              Changes sync instantly with donor search results.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inventory-quantity">Units Available</Label>
              <Input
                id="inventory-quantity"
                type="number"
                min={0}
                value={inventoryDraft.quantity}
                onChange={(event) =>
                  setInventoryDraft((prev) => ({
                    ...prev,
                    quantity: event.target.value,
                  }))
                }
                disabled={inventorySaving}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={inventoryDraft.status}
                onValueChange={(value) =>
                  setInventoryDraft((prev) => ({
                    ...prev,
                    status: value as InventoryStatus,
                  }))
                }
                disabled={inventorySaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {INVENTORY_STATUS_ORDER.map((status) => (
                    <SelectItem key={status} value={status}>
                      {inventoryStatusMeta[status].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Last updated {formatInventoryTimestamp(editingInventory?.updatedAt)}
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={closeInventoryEditor}
              disabled={inventorySaving}
            >
              Cancel
            </Button>
            <Button onClick={handleInventorySave} disabled={inventorySaving}>
              {inventorySaving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

              {/* Inventory Status */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-blue-600" />
                  Inventory Status
                </h3>
                {(() => {
                  const usableInventory = getUsableInventoryForType(
                    selectedRequest.bloodType
                  );
                  const hasEnough =
                    usableInventory &&
                    usableInventory.quantity >= selectedRequest.quantity;

                  return (
                    <div className={`p-4 rounded-lg border-2 ${hasEnough ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">
                          {selectedRequest.bloodType} Available:{" "}
                          <span className={`text-lg font-bold ${hasEnough ? "text-green-600" : "text-red-600"}`}>
                            {usableInventory?.quantity || 0} units
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Required: <span className="font-semibold">{selectedRequest.quantity} units</span>
                        </p>
                        {hasEnough ? (
                          <div className="flex items-center gap-2 text-green-700 mt-2">
                            <span className="text-lg">✓</span>
                            <span className="text-sm font-medium">
                              Sufficient inventory available. You can approve this request.
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-700 mt-2">
                            <span className="text-lg">✕</span>
                            <span className="text-sm font-medium">
                              Insufficient inventory. Request will be auto-rejected if you try to approve.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Suggested Donors */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-red-600" />
                    Suggested Donors
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => refetchDonorSuggestions()}
                    disabled={donorSuggestionsLoading || donorSuggestionsFetching}
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
                <div className="bg-muted/40 p-4 rounded-lg space-y-3">
                  {donorSuggestionsLoading || donorSuggestionsFetching ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Calculating best matches…
                    </div>
                  ) : donorSuggestionsHasError ? (
                    <p className="text-sm text-destructive">
                      {donorSuggestionsError?.message || "Unable to load donor suggestions."}
                    </p>
                  ) : donorSuggestions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No eligible donors found within the preferred radius.
                    </p>
                  ) : (
                    donorSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.donorId}
                        className="border border-border/60 rounded-lg bg-background/70 p-4 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-sm text-foreground">
                            {suggestion.donorName}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            Match {Math.round(suggestion.score * 100)}%
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Droplets className="h-3 w-3" />
                            {suggestion.bloodType}
                          </span>
                          {typeof suggestion.distanceKm === "number" && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {suggestion.distanceKm.toFixed(1)} km away
                            </span>
                          )}
                          {suggestion.lastDonationDate && (
                            <span>
                              Last donation {new Date(suggestion.lastDonationDate).toLocaleDateString()}
                            </span>
                          )}
                          {suggestion.eligibilityStatus && (
                            <span className="capitalize">
                              {suggestion.eligibilityStatus.replaceAll("_", " ")}
                            </span>
                          )}
                        </div>
                        {suggestion.rationale.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {suggestion.rationale.map((reason, index) => (
                              <Badge key={`${suggestion.donorId}-reason-${index}`} variant="outline" className="text-xs">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {suggestion.availabilityWindows.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Next availability: {new Date(suggestion.availabilityWindows[0].start).toLocaleString()} – {new Date(suggestion.availabilityWindows[0].end).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))
                  )}
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
                    <div className="mt-2">
                      <UrgencyBadge urgency={selectedRequest.urgency || "normal"} size="sm" />
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
                    {selectedRequest.secondaryContactNumber && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Alt: {selectedRequest.secondaryContactNumber}
                      </p>
                    )}
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
                      <p className="text-sm mt-1 bg-card p-3 rounded border border-border">
                        {selectedRequest.remarks}
                      </p>
                    </div>
                  )}
                  {selectedRequest.rejectionReason && (
                    <div className="md:col-span-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        REJECTION REASON
                      </p>
                      <p className="text-sm mt-1 bg-destructive/10 p-3 rounded border border-destructive/40 text-destructive">
                        {selectedRequest.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t border-border">
                {(selectedRequest.status || "pending") === "pending" ? (
                  <>
                    {!showRejectReason ? (
                      <>
                        <p className="text-sm font-medium text-muted-foreground">
                          Process this blood request:
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setIsDetailsOpen(false)}
                          >
                            Close
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => {
                              const usableInventory = getUsableInventoryForType(
                                selectedRequest.bloodType
                              );
                              if (!usableInventory || usableInventory.quantity < selectedRequest.quantity) {
                                setRejectReason(
                                  `Insufficient ${selectedRequest.bloodType} blood inventory. Required: ${selectedRequest.quantity} units, Available: ${usableInventory?.quantity || 0} units.`
                                );
                              }
                              setShowRejectReason(true);
                            }}
                            disabled={processingId === selectedRequest._id}
                          >
                            {processingId === selectedRequest._id ? "Processing..." : "Reject"}
                          </Button>
                          {(() => {
                            const usableInventory = getUsableInventoryForType(
                              selectedRequest.bloodType
                            );
                            const hasEnough =
                              usableInventory &&
                              usableInventory.quantity >= selectedRequest.quantity;

                            return (
                              <Button
                                className={`flex-1 ${hasEnough
                                  ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white"
                                  : "bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-300 text-foreground"}`}
                                onClick={() => handleProcessRequest("approve")}
                                disabled={processingId === selectedRequest._id}
                                title={!hasEnough ? "Insufficient inventory - will auto-reject" : ""}
                              >
                                {processingId === selectedRequest._id ? "Processing..." : "Approve"}
                              </Button>
                            );
                          })()}
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-muted-foreground mb-3">
                          Rejection Reason:
                        </p>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Enter reason for rejecting this request..."
                          className="w-full p-3 border border-border rounded-md text-sm min-h-20 bg-card"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setShowRejectReason(false);
                              setRejectReason("");
                            }}
                          >
                            Back
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => {
                              handleProcessRequest("reject", rejectReason);
                              setShowRejectReason(false);
                              setRejectReason("");
                            }}
                            disabled={processingId === selectedRequest._id}
                          >
                            {processingId === selectedRequest._id ? "Rejecting..." : "Confirm Rejection"}
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                ) : (selectedRequest.status || "pending") === "approved" ? (
                  <>
                    <p className="text-sm font-medium text-muted-foreground">
                      Request has been approved. Mark as fulfilled when blood is delivered:
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setIsDetailsOpen(false)}
                      >
                        Close
                      </Button>
                      <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleProcessRequest("fulfill")}
                        disabled={processingId === selectedRequest._id}
                      >
                        {processingId === selectedRequest._id ? "Processing..." : "Mark as Fulfilled"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    {selectedRequest.status === "rejected" && selectedRequest.rejectionReason && (
                      <div className="bg-red-50 border border-red-300 p-3 rounded">
                        <p className="text-xs font-medium text-red-700 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-800">{selectedRequest.rejectionReason}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setIsDetailsOpen(false)}
                      >
                        Close
                      </Button>
                      <Button
                        disabled
                        className="flex-1"
                      >
                        {selectedRequest.status === "rejected" ? "Request Rejected" : "Request Fulfilled"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Blood Modal */}
      {showAddBloodModal && (
        <Dialog open={showAddBloodModal} onOpenChange={setShowAddBloodModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-red-500" />
                Add Blood to Inventory
              </DialogTitle>
              <DialogDescription>
                Add new blood units to your hospital inventory
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddBlood} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Blood Type</label>
                <Select 
                  value={addBloodForm.bloodType} 
                  onValueChange={(value) => 
                    setAddBloodForm({ ...addBloodForm, bloodType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity (Units)</label>
                <input
                  type="number"
                  min="1"
                  value={addBloodForm.quantity}
                  onChange={(e) =>
                    setAddBloodForm({ ...addBloodForm, quantity: e.target.value })
                  }
                  placeholder="Enter quantity in units"
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Expiry Date</label>
                <input
                  type="date"
                  value={addBloodForm.expiryDate}
                  onChange={(e) =>
                    setAddBloodForm({ ...addBloodForm, expiryDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAddBloodModal(false);
                    setAddBloodForm({ bloodType: "", quantity: "", expiryDate: "" });
                  }}
                  disabled={addBloodLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={addBloodLoading}
                >
                  {addBloodLoading ? "Adding..." : "Add Blood"}
                </Button>
              </div>
            </form>
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
            <p className="text-xs font-mono bg-muted p-2 rounded overflow-auto max-h-40">
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
