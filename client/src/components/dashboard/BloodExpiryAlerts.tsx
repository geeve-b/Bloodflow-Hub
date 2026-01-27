import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  Droplets,
  Building2,
  Calendar,
  RefreshCw,
  Filter,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface BloodExpiryAlert {
  _id: string;
  inventoryId: string;
  hospitalId: string;
  hospitalName: string;
  bloodType: string;
  quantity: number;
  expiryDate: string | Date;
  daysRemaining: number;
  alertLevel: "critical" | "warning" | "info";
  alertSentAt: string | Date;
  emailsSent: Array<{
    email: string;
    staffName: string;
    sentAt: string | Date;
  }>;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string | Date;
  acknowledgedNotes?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string | Date;
  resolvedNotes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface AlertSummary {
  criticalAlerts: number;
  warningAlerts: number;
  infoAlerts: number;
  totalAlerts: number;
  affectedBloodTypes: string[];
  affectedHospitals: string[];
}

export function BloodExpiryAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<BloodExpiryAlert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterLevel, setFilterLevel] = useState<"all" | "critical" | "warning" | "info">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "acknowledged" | "resolved">("active");
  const [selectedAlert, setSelectedAlert] = useState<BloodExpiryAlert | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch alerts and summary
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const [alertsRes, summaryRes] = await Promise.all([
        fetch("/api/blood-expiry-alerts"),
        fetch("/api/blood-expiry-alerts/summary"),
      ]);

      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(Array.isArray(data) ? data : []);
      }

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Trigger new alert check
      await fetch("/api/blood-expiry-alerts/check/create", { method: "POST" });
      // Refetch alerts
      await fetchAlerts();
    } catch (error) {
      console.error("Error refreshing alerts:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/blood-expiry-alerts/${alertId}/acknowledge`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user?.id,
            notes: actionNotes,
          }),
        }
      );

      if (response.ok) {
        await fetchAlerts();
        setSelectedAlert(null);
        setActionNotes("");
      }
    } catch (error) {
      console.error("Error acknowledging alert:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async (alertId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/blood-expiry-alerts/${alertId}/resolve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user?.id,
            notes: actionNotes,
          }),
        }
      );

      if (response.ok) {
        await fetchAlerts();
        setSelectedAlert(null);
        setActionNotes("");
      }
    } catch (error) {
      console.error("Error resolving alert:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (filterLevel !== "all" && alert.alertLevel !== filterLevel) {
        return false;
      }

      if (filterStatus === "active" && (alert.acknowledged || alert.resolved)) {
        return false;
      }
      if (filterStatus === "acknowledged" && (!alert.acknowledged || alert.resolved)) {
        return false;
      }
      if (filterStatus === "resolved" && !alert.resolved) {
        return false;
      }

      return true;
    });
  }, [alerts, filterLevel, filterStatus]);

  const getAlertIcon = (level: string) => {
    switch (level) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-blue-600" />;
    }
  };

  const getAlertColor = (level: string): "destructive" | "secondary" | "outline" => {
    switch (level) {
      case "critical":
        return "destructive";
      case "warning":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getBgColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Blood Expiry Alerts</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading alerts...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && summary.totalAlerts > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-red-50 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-900">
                Critical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summary.criticalAlerts}
              </div>
              <p className="text-xs text-red-700 mt-1">
                Expiring within 24 hours
              </p>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-900">
                Warning Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {summary.warningAlerts}
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Expiring within 3 days
              </p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">
                Info Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {summary.infoAlerts}
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Expiring within 7 days
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">
                Total Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {summary.totalAlerts}
              </div>
              <p className="text-xs text-gray-700 mt-1">
                Active alerts requiring attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Affected Resources */}
      {summary && summary.totalAlerts > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Affected Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.affectedBloodTypes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-amber-900">
                  Blood Types:
                </span>
                {summary.affectedBloodTypes.map((type) => (
                  <Badge key={type} variant="outline" className="bg-white">
                    <Droplets className="h-3 w-3 mr-1" />
                    {type}
                  </Badge>
                ))}
              </div>
            )}
            {summary.affectedHospitals.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-amber-900">
                  Hospitals:
                </span>
                {summary.affectedHospitals.map((hospital) => (
                  <Badge key={hospital} variant="outline" className="bg-white">
                    <Building2 className="h-3 w-3 mr-1" />
                    {hospital}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Alerts Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Blood Expiry Alerts</CardTitle>
            <CardDescription>
              {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? "s" : ""}{" "}
              requiring attention
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span className="ml-2">Refresh</span>
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 pb-4 border-b">
            <Button
              variant={filterLevel === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterLevel("all")}
            >
              All Levels
            </Button>
            <Button
              variant={filterLevel === "critical" ? "destructive" : "outline"}
              size="sm"
              onClick={() => setFilterLevel("critical")}
            >
              Critical
            </Button>
            <Button
              variant={filterLevel === "warning" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setFilterLevel("warning")}
            >
              Warning
            </Button>
            <Button
              variant={filterLevel === "info" ? "outline" : "outline"}
              size="sm"
              onClick={() => setFilterLevel("info")}
            >
              Info
            </Button>

            <div className="flex-grow" />

            <Button
              variant={filterStatus === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("active")}
            >
              Active
            </Button>
            <Button
              variant={filterStatus === "acknowledged" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("acknowledged")}
            >
              Acknowledged
            </Button>
            <Button
              variant={filterStatus === "resolved" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("resolved")}
            >
              Resolved
            </Button>
          </div>

          {/* Alerts List */}
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No {filterStatus === "all" ? "" : filterStatus} alerts
              </h3>
              <p className="text-gray-600">
                All blood units are within safe expiry limits
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <Dialog key={alert._id}>
                  <DialogTrigger asChild>
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${getBgColor(
                        alert.alertLevel
                      )}`}
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <div className="flex items-start gap-3">
                        {getAlertIcon(alert.alertLevel)}
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">
                              {alert.bloodType} - {alert.quantity} units
                            </h4>
                            <Badge color={getAlertColor(alert.alertLevel)}>
                              {alert.alertLevel.toUpperCase()}
                            </Badge>
                            {alert.resolved && (
                              <Badge variant="outline" className="bg-green-50">
                                ✓ Resolved
                              </Badge>
                            )}
                            {alert.acknowledged && !alert.resolved && (
                              <Badge variant="outline" className="bg-blue-50">
                                Acknowledged
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm text-gray-700">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {alert.hospitalName}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {alert.daysRemaining} day
                              {alert.daysRemaining !== 1 ? "s" : ""} remaining
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Expires:{" "}
                              {new Date(alert.expiryDate).toLocaleDateString()}
                            </div>
                          </div>
                          {alert.acknowledgedNotes && (
                            <p className="text-xs text-gray-600 mt-2">
                              Ack: {alert.acknowledgedNotes}
                            </p>
                          )}
                          {alert.resolvedNotes && (
                            <p className="text-xs text-gray-600 mt-2">
                              Resolved: {alert.resolvedNotes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </DialogTrigger>

                  {/* Alert Details Dialog */}
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        {getAlertIcon(alert.alertLevel)}
                        Blood Expiry Alert - {alert.bloodType}
                      </DialogTitle>
                      <DialogDescription>
                        Alert Level: {alert.alertLevel.toUpperCase()}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      {/* Alert Details Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Blood Type
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            {alert.bloodType}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Quantity
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            {alert.quantity} units
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Hospital
                          </p>
                          <p className="text-gray-900">{alert.hospitalName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Expiry Date
                          </p>
                          <p className="text-gray-900">
                            {new Date(alert.expiryDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Days Remaining
                          </p>
                          <p className="text-lg font-bold text-red-600">
                            {alert.daysRemaining} day
                            {alert.daysRemaining !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Alert Created
                          </p>
                          <p className="text-gray-900 text-sm">
                            {new Date(alert.alertSentAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Status Information */}
                      {alert.acknowledged && (
                        <Alert className="bg-blue-50 border-blue-200">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <AlertTitle>Acknowledged</AlertTitle>
                          <AlertDescription>
                            By {alert.acknowledgedBy} on{" "}
                            {new Date(
                              alert.acknowledgedAt || ""
                            ).toLocaleDateString()}
                            {alert.acknowledgedNotes &&
                              `: ${alert.acknowledgedNotes}`}
                          </AlertDescription>
                        </Alert>
                      )}

                      {alert.resolved && (
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertTitle>Resolved</AlertTitle>
                          <AlertDescription>
                            By {alert.resolvedBy} on{" "}
                            {new Date(alert.resolvedAt || "").toLocaleDateString()}
                            {alert.resolvedNotes && `: ${alert.resolvedNotes}`}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Emails Sent */}
                      {alert.emailsSent.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Notifications Sent
                          </p>
                          <div className="space-y-1 text-sm text-gray-600">
                            {alert.emailsSent.map((email, idx) => (
                              <p key={idx}>
                                ✓ {email.staffName} ({email.email}) on{" "}
                                {new Date(email.sentAt).toLocaleDateString()}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Notes Input */}
                      {!alert.resolved && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Add Notes
                          </label>
                          <Textarea
                            placeholder="Add any notes about this alert..."
                            value={actionNotes}
                            onChange={(e) => setActionNotes(e.target.value)}
                            className="mt-2"
                            rows={3}
                          />
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 justify-end pt-4 border-t">
                        {!alert.acknowledged && !alert.resolved && (
                          <Button
                            variant="outline"
                            onClick={() =>
                              handleAcknowledge(alert._id)
                            }
                            disabled={actionLoading}
                          >
                            Acknowledge
                          </Button>
                        )}
                        {!alert.resolved && (
                          <Button
                            onClick={() =>
                              handleResolve(alert._id)
                            }
                            disabled={actionLoading}
                          >
                            Mark as Resolved
                          </Button>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
