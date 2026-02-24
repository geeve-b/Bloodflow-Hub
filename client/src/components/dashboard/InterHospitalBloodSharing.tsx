import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { UrgencyBadge } from "@/components/dashboard/UrgencyBadge";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Building2,
  Phone,
  MapPin,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";

interface InterHospitalRequest {
  _id: string;
  requestingHospitalId: string;
  requestingHospitalName: string;
  requestingHospitalLocation?: string;
  requestingHospitalPhone?: string;
  providingHospitalId?: string;
  providingHospitalName?: string;
  bloodType: string;
  quantity: number;
  urgency: "critical" | "normal";
  reason?: string;
  status: "pending" | "accepted" | "fulfilled" | "rejected" | "cancelled";
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export function InterHospitalBloodSharing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<InterHospitalRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"outgoing" | "incoming">("outgoing");

  // Form state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    bloodType: "",
    quantity: "",
    urgency: "normal" as const,
    reason: "",
  });

  // Accept modal
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InterHospitalRequest | null>(null);
  const [acceptLoading, setAcceptLoading] = useState(false);

  // Fetch requests
  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const fetchRequests = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/inter-hospital-blood/${activeTab}/${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch inter-hospital requests:", error);
      toast({
        title: "Error",
        description: "Failed to load inter-hospital requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!user || !formData.bloodType || !formData.quantity) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setFormLoading(true);
    try {
      const response = await fetch(`${API_URL}/inter-hospital-blood`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestingHospitalId: user.id,
          requestingHospitalName: user.name,
          bloodType: formData.bloodType,
          quantity: parseInt(formData.quantity),
          urgency: formData.urgency,
          reason: formData.reason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create inter-hospital request");
      }

      toast({
        title: "Success",
        description: "Inter-hospital blood request created successfully",
      });

      setFormData({ bloodType: "", quantity: "", urgency: "normal", reason: "" });
      setShowRequestModal(false);
      fetchRequests();
    } catch (error) {
      console.error("Error creating request:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create request",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!selectedRequest || !user) return;

    setAcceptLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/inter-hospital-blood/${selectedRequest._id}/accept`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            providingHospitalId: user.id,
            providingHospitalName: user.name,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to accept request");
      }

      toast({
        title: "Success",
        description: "Inter-hospital request accepted",
      });

      setShowAcceptModal(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error("Error accepting request:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept request",
        variant: "destructive",
      });
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string, reason: string) => {
    if (!user) return;

    try {
      const response = await fetch(
        `${API_URL}/inter-hospital-blood/${requestId}/reject`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rejectionReason: reason }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reject request");
      }

      toast({
        title: "Success",
        description: "Request rejected",
      });

      fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject request",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/15 text-amber-700 dark:text-amber-200 border border-amber-500/30";
      case "accepted":
        return "bg-blue-500/15 text-blue-700 dark:text-blue-200 border border-blue-500/30";
      case "fulfilled":
        return "bg-green-500/15 text-green-700 dark:text-green-200 border border-green-500/30";
      case "rejected":
        return "bg-red-500/15 text-red-700 dark:text-red-200 border border-red-500/30";
      case "cancelled":
        return "bg-gray-500/15 text-gray-700 dark:text-gray-200 border border-gray-500/30";
      default:
        return "bg-muted text-foreground border border-border";
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (activeTab === "outgoing") {
      return req.requestingHospitalId === user?.id;
    } else {
      return req.requestingHospitalId !== user?.id;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inter-Hospital Blood Sharing</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Request blood from other hospitals or respond to requests
          </p>
        </div>
        <Button
          onClick={() => setShowRequestModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Building2 className="h-4 w-4 mr-2" />
          Request Blood from Hospital
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "outgoing" ? "default" : "ghost"}
          onClick={() => setActiveTab("outgoing")}
          className="rounded-b-none"
        >
          My Requests
        </Button>
        <Button
          variant={activeTab === "incoming" ? "default" : "ghost"}
          onClick={() => setActiveTab("incoming")}
          className="rounded-b-none"
        >
          Requests for Us
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              No {activeTab === "outgoing" ? "outgoing" : "incoming"} inter-hospital requests
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">
                    {activeTab === "outgoing" ? "Requested From" : "Requested By"}
                  </TableHead>
                  <TableHead className="font-semibold">Blood Type</TableHead>
                  <TableHead className="font-semibold text-center">Quantity</TableHead>
                  <TableHead className="font-semibold">Urgency</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
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
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {activeTab === "outgoing"
                          ? request.providingHospitalName || "Waiting for response"
                          : request.requestingHospitalName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold">
                        {request.bloodType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {request.quantity} units
                    </TableCell>
                    <TableCell>
                      <UrgencyBadge urgency={request.urgency} size="sm" />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`font-medium ${getStatusColor(request.status)}`}
                      >
                        {request.status.charAt(0).toUpperCase() +
                          request.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {activeTab === "incoming" &&
                        request.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowAcceptModal(true);
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const reason = prompt("Rejection reason (optional):");
                                if (reason !== null) {
                                  handleRejectRequest(request._id, reason || "");
                                }
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      {request.status === "rejected" && (
                        <div className="text-xs text-red-600 dark:text-red-400">
                          {request.rejectionReason}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Create Request Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Blood from Another Hospital</DialogTitle>
            <DialogDescription>
              Submit a request to other hospitals for the blood type you need
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="blood-type">Blood Type *</Label>
              <Select
                value={formData.bloodType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, bloodType: value }))
                }
              >
                <SelectTrigger id="blood-type">
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>
                <SelectContent>
                  {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map(
                    (type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Units Required *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, quantity: e.target.value }))
                }
                placeholder="Number of units"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency Level</Label>
              <Select
                value={formData.urgency}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({ ...prev, urgency: value }))
                }
              >
                <SelectTrigger id="urgency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Provide any additional details..."
                value={formData.reason}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, reason: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRequestModal(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRequest}
              disabled={formLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {formLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accept Request Modal */}
      <Dialog open={showAcceptModal} onOpenChange={setShowAcceptModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Accept Inter-Hospital Request</DialogTitle>
            <DialogDescription>
              Confirm that you can provide the requested blood
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Requesting Hospital</p>
                  <p className="font-semibold">{selectedRequest.requestingHospitalName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Blood Type</p>
                  <p className="font-semibold text-lg">{selectedRequest.bloodType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p className="font-semibold">{selectedRequest.quantity} units</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Urgency</p>
                  <UrgencyBadge urgency={selectedRequest.urgency} size="sm" />
                </div>
              </div>

              {selectedRequest.reason && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">Reason</p>
                  <p className="text-sm">{selectedRequest.reason}</p>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  By accepting this request, you commit to providing the specified blood
                  units. Please ensure you have sufficient inventory available.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAcceptModal(false)}
              disabled={acceptLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAcceptRequest}
              disabled={acceptLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {acceptLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                "Accept Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
