import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  Droplets,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCcw,
  Heart,
  TrendingUp,
} from "lucide-react";

interface TrackingRecord {
  _id: string;
  donorId: string;
  donorName: string;
  bloodType: string;
  quantity: number;
  donationDate: string;
  hospitalName: string;
  receiverName?: string;
  receiverHospitalName?: string;
  medicalCondition?: string;
  urgencyLevel: "critical" | "normal";
  status:
    | "collected"
    | "in_transit"
    | "received"
    | "in_use"
    | "transfused"
    | "expired"
    | "discarded";
  trackingNotes: Array<{
    timestamp: string;
    status: string;
    note: string;
    updatedBy?: string;
  }>;
  isSuccessful?: boolean;
  transfusionCompleteTime?: string;
  collectionTime?: string;
  createdAt: string;
}

const statusConfig: Record<
  string,
  { color: string; icon: any; label: string; description: string }
> = {
  collected: {
    color: "bg-blue-500/10 text-blue-700",
    icon: Droplets,
    label: "Collected",
    description: "Blood collected from donor",
  },
  in_transit: {
    color: "bg-yellow-500/10 text-yellow-700",
    icon: MapPin,
    label: "In Transit",
    description: "Being transported to hospital",
  },
  received: {
    color: "bg-purple-500/10 text-purple-700",
    icon: CheckCircle2,
    label: "Received",
    description: "Received by receiving hospital",
  },
  in_use: {
    color: "bg-orange-500/10 text-orange-700",
    icon: Clock,
    label: "In Use",
    description: "Currently being prepared for transfusion",
  },
  transfused: {
    color: "bg-green-500/10 text-green-700",
    icon: Heart,
    label: "Transfused",
    description: "Successfully transfused to patient",
  },
  expired: {
    color: "bg-red-500/10 text-red-700",
    icon: AlertCircle,
    label: "Expired",
    description: "Blood expired before use",
  },
  discarded: {
    color: "bg-gray-500/10 text-gray-700",
    icon: AlertCircle,
    label: "Discarded",
    description: "Blood was discarded",
  },
};

const urgencyColors = {
  critical: "bg-red-500/10 text-red-700 border-red-200",
  normal: "bg-blue-500/10 text-blue-700 border-blue-200",
};

export function DonorBloodTrackingDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trackings, setTrackings] = useState<TrackingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedTracking, setSelectedTracking] = useState<TrackingRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchTrackingRecords = async () => {
    if (!user || user.role !== "donor") return;

    try {
      const response = await fetch(`/api/blood-donation-tracking/donor/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setTrackings(Array.isArray(data) ? data : []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch tracking records",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch tracking records:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tracking records",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchTrackingRecords();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchTrackingRecords, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const stats = useMemo(() => {
    return {
      totalDonations: trackings.length,
      successfulTransfusions: trackings.filter((t) => t.status === "transfused").length,
      inProgress: trackings.filter(
        (t) =>
          t.status === "collected" ||
          t.status === "in_transit" ||
          t.status === "received" ||
          t.status === "in_use"
      ).length,
      totalUnitsHelped: trackings
        .filter((t) => t.status === "transfused")
        .reduce((sum, t) => sum + t.quantity, 0),
    };
  }, [trackings]);

  const handleRefresh = async () => {
    setIsFetching(true);
    await fetchTrackingRecords();
  };

  const handleViewDetails = (tracking: TrackingRecord) => {
    setSelectedTracking(tracking);
    setIsDetailOpen(true);
  };

  if (!user || user.role !== "donor") {
    return (
      <Card className="border-border/70">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Blood tracking is only available for donors.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <Droplets className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDonations}</div>
            <p className="text-xs text-muted-foreground">units tracked</p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Transfusions</CardTitle>
            <Heart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successfulTransfusions}</div>
            <p className="text-xs text-muted-foreground">lives helped</p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">being tracked</p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units Helped</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUnitsHelped}</div>
            <p className="text-xs text-muted-foreground">successfully transfused</p>
          </CardContent>
        </Card>
      </div>

      {/* Tracking Records Table */}
      <Card className="border-border/70">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Blood Tracking History</CardTitle>
            <CardDescription>Track your donated blood through its journey</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isFetching}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            {isFetching ? "Refreshing..." : "Refresh"}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : trackings.length === 0 ? (
            <div className="text-center py-12">
              <Droplets className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No blood donations tracked yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your donated blood tracking records will appear here.
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Blood Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Receiver Hospital</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Donation Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackings.map((tracking) => {
                    const config = statusConfig[tracking.status];
                    const Icon = config?.icon;
                    return (
                      <TableRow key={tracking._id} className="hover:bg-muted/50">
                        <TableCell>
                          <Badge variant="outline" className="text-base font-semibold">
                            {tracking.bloodType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{tracking.quantity} unit(s)</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {Icon && <Icon className="h-4 w-4" />}
                            <Badge className={config?.color}>
                              {config?.label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">
                              {tracking.receiverHospitalName || tracking.hospitalName}
                            </p>
                            {tracking.receiverName && (
                              <p className="text-xs text-muted-foreground">
                                Patient: {tracking.receiverName}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${urgencyColors[tracking.urgencyLevel]} border`}
                            variant="outline"
                          >
                            {tracking.urgencyLevel === "critical" ? "🚨 Critical" : "Normal"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(tracking.donationDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(tracking)}
                            className="hover:bg-muted"
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Tracking Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-red-600" />
              Blood Donation Tracking Details
            </DialogTitle>
            <DialogDescription>
              Track your donated blood through its complete journey
            </DialogDescription>
          </DialogHeader>

          {selectedTracking && (
            <div className="space-y-6">
              {/* Primary Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Blood Type</p>
                  <Badge variant="outline" className="text-base font-semibold mt-1">
                    {selectedTracking.bloodType}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-semibold mt-1">{selectedTracking.quantity} unit(s)</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Donation Date</p>
                  <p className="font-semibold mt-1">
                    {new Date(selectedTracking.donationDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Status</p>
                  <Badge className={`${statusConfig[selectedTracking.status]?.color} mt-1`}>
                    {statusConfig[selectedTracking.status]?.label}
                  </Badge>
                </div>
              </div>

              {/* Receiver Information */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Patient & Hospital Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Receiving Hospital</p>
                    <p className="font-medium mt-1">
                      {selectedTracking.receiverHospitalName || selectedTracking.hospitalName}
                    </p>
                  </div>
                  {selectedTracking.receiverName && (
                    <div>
                      <p className="text-sm text-muted-foreground">Patient Name</p>
                      <p className="font-medium mt-1">{selectedTracking.receiverName}</p>
                    </div>
                  )}
                  {selectedTracking.medicalCondition && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Medical Condition</p>
                      <p className="font-medium mt-1">{selectedTracking.medicalCondition}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Urgency Level</p>
                    <Badge
                      className={`${urgencyColors[selectedTracking.urgencyLevel]} border mt-1`}
                      variant="outline"
                    >
                      {selectedTracking.urgencyLevel === "critical" ? "🚨 Critical" : "Normal"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Tracking Timeline */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Tracking Timeline</h3>
                <div className="space-y-3">
                  {selectedTracking.trackingNotes && selectedTracking.trackingNotes.length > 0 ? (
                    selectedTracking.trackingNotes
                      .sort(
                        (a, b) =>
                          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                      )
                      .map((note, index) => {
                        const config = statusConfig[note.status];
                        const Icon = config?.icon;
                        return (
                          <div key={index} className="flex gap-3 pb-3">
                            {Icon && (
                              <div className={`rounded-full p-2 ${config?.color}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{note.status.replace(/_/g, " ").toUpperCase()}</p>
                              <p className="text-sm text-muted-foreground">{note.note}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(note.timestamp).toLocaleString()}
                              </p>
                              {note.updatedBy && (
                                <p className="text-xs text-muted-foreground">
                                  Updated by: {note.updatedBy}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <p className="text-sm text-muted-foreground">No tracking updates yet.</p>
                  )}
                </div>
              </div>

              {/* Success Status */}
              {selectedTracking.status === "transfused" && (
                <div className="border-t pt-4 bg-green-500/5 border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-700">
                        ✓ Successfully Transfused
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your blood helped save a life! Thank you for your donation.
                      </p>
                      {selectedTracking.transfusionCompleteTime && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Transfusion completed:{" "}
                          {new Date(selectedTracking.transfusionCompleteTime).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(selectedTracking.status === "expired" || selectedTracking.status === "discarded") && (
                <div className="border-t pt-4 bg-red-500/5 border-red-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-700">
                        {selectedTracking.status === "expired" ? "Blood Expired" : "Blood Discarded"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Unfortunately, this blood unit could not be used.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
