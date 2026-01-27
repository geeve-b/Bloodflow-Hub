import { useMemo, useState } from "react";
import { useBloodRequests } from "@/hooks/useBloodRequests";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Approved", color: "bg-blue-100 text-blue-800" },
  fulfilled: { label: "Fulfilled", color: "bg-green-100 text-green-800" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
};

const URGENCY_CONFIG = {
  critical: { label: "Critical", color: "bg-red-100 text-red-800" },
  normal: { label: "Normal", color: "bg-gray-100 text-gray-800" },
};

export function ActiveRequestsTable() {
  const {
    data: requests = [],
    isLoading,
    isFetching,
    error,
  } = useBloodRequests();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredRequests = useMemo(() => {
    return requests
      .filter((req) =>
        statusFilter === "all" ? true : req.status === statusFilter
      )
      .filter((req) =>
        urgencyFilter === "all" ? true : req.urgency === urgencyFilter
      )
      .filter((req) => {
        if (!normalizedSearch) return true;
        return (
          req.hospitalName.toLowerCase().includes(normalizedSearch) ||
          req.patientName.toLowerCase().includes(normalizedSearch) ||
          req.bloodType.toLowerCase().includes(normalizedSearch) ||
          req.requesterName.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
  }, [requests, statusFilter, urgencyFilter, normalizedSearch]);

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const criticalCount = requests.filter((r) => r.urgency === "critical").length;

  if (error) {
    return (
      <Card className="border-destructive/80 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">
            Failed to load requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Active Blood Requests</CardTitle>
            <CardDescription>
              Manage all incoming blood requests and track their status
            </CardDescription>
          </div>
          {(pendingCount > 0 || criticalCount > 0) && (
            <Alert className="w-auto border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm text-yellow-800">
                {pendingCount} pending • {criticalCount} critical
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
          <div className="md:col-span-2 lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by hospital, patient, blood type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="fulfilled">Fulfilled</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Urgencies</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="space-y-3 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading requests...</p>
            </div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="space-y-2 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                {searchTerm || statusFilter !== "all" || urgencyFilter !== "all"
                  ? "No requests match your filters"
                  : "No blood requests yet"}
              </p>
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                >
                  Clear search
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 bg-muted/30">
                  <TableHead className="font-semibold">Hospital</TableHead>
                  <TableHead className="font-semibold">Patient</TableHead>
                  <TableHead className="font-semibold">Blood Type</TableHead>
                  <TableHead className="text-center font-semibold">
                    Qty
                  </TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Urgency</TableHead>
                  <TableHead className="text-right font-semibold">
                    Requested
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow
                    key={request._id}
                    className={cn(
                      "border-border/40 hover:bg-muted/40 transition-colors",
                      request.urgency === "critical" && "bg-red-50/50"
                    )}
                  >
                    <TableCell className="font-medium">
                      {request.hospitalName}
                    </TableCell>
                    <TableCell className="text-sm">
                      {request.patientName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {request.bloodType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {request.quantity}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          STATUS_CONFIG[
                            request.status as keyof typeof STATUS_CONFIG
                          ]?.color || "bg-gray-100 text-gray-800"
                        }
                      >
                        {
                          STATUS_CONFIG[
                            request.status as keyof typeof STATUS_CONFIG
                          ]?.label
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          URGENCY_CONFIG[
                            request.urgency as keyof typeof URGENCY_CONFIG
                          ]?.color || "bg-gray-100 text-gray-800"
                        }
                      >
                        {
                          URGENCY_CONFIG[
                            request.urgency as keyof typeof URGENCY_CONFIG
                          ]?.label
                        }
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {request.createdAt
                        ? new Date(request.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <p>
                Showing {filteredRequests.length} of {requests.length} request
                {requests.length !== 1 ? "s" : ""}
              </p>
              {isFetching && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
