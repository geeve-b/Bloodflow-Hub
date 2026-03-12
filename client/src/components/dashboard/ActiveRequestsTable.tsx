import { useMemo, useState } from "react";
import { useBloodRequests } from "@/hooks/useBloodRequests";
import { useToast } from "@/hooks/use-toast";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, AlertTriangle, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300" },
  approved: { label: "Approved", color: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300" },
  fulfilled: { label: "Fulfilled", color: "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300" },
};

const URGENCY_CONFIG = {
  critical: {
    label: "Critical",
    color: "border border-red-200 bg-red-50 text-red-700 dark:border-red-800/70 dark:bg-red-950/50 dark:text-red-300",
  },
  normal: {
    label: "Normal",
    color: "border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/70 dark:bg-sky-950/50 dark:text-sky-300",
  },
};

export function ActiveRequestsTable() {
  const {
    data: requests = [],
    isLoading,
    isFetching,
    error,
  } = useBloodRequests();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id?: string; patientName?: string; isBulk?: boolean }>({
    open: false,
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const handleDeleteClick = (id: string, patientName: string) => {
    setDeleteDialog({ open: true, id, patientName, isBulk: false });
  };

  const handleSelectToggle = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRequests.map((req) => req._id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const selectedCount = selectedIds.size;
    setDeleteDialog({
      open: true,
      isBulk: true,
      patientName: `${selectedCount} request${selectedCount !== 1 ? "s" : ""}`,
    });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.isBulk) {
      // Bulk delete
      setDeletingId("bulk");
      let successCount = 0;
      let failCount = 0;

      for (const id of Array.from(selectedIds)) {
        try {
          const response = await fetch(`/api/blood-requests/${id}`, {
            method: "DELETE",
            credentials: "include",
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }

      setDeletingId(null);
      setDeleteDialog({ open: false });
      setSelectedIds(new Set());

      if (successCount > 0) {
        toast({
          title: "Requests deleted",
          description: `Successfully deleted ${successCount} request${successCount !== 1 ? "s" : ""}${failCount > 0 ? ` (${failCount} failed)` : ""}.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete selected requests",
          variant: "destructive",
        });
      }
    } else if (deleteDialog.id) {
      // Single delete
      setDeletingId(deleteDialog.id);
      try {
        const response = await fetch(`/api/blood-requests/${deleteDialog.id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to delete request");
        }

        toast({
          title: "Request deleted",
          description: `Blood request for ${deleteDialog.patientName} has been removed.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete request",
          variant: "destructive",
        });
      } finally {
        setDeletingId(null);
        setDeleteDialog({ open: false });
      }
    }
  };

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
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Active Blood Requests</CardTitle>
              <CardDescription>
                Manage all incoming blood requests and track their status
              </CardDescription>
            </div>
            {(pendingCount > 0 || criticalCount > 0) && (
              <Alert className="w-auto border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70">
                <AlertTriangle className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                <AlertDescription className="text-sm text-slate-700 dark:text-slate-200">
                  {pendingCount} pending • {criticalCount} critical
                </AlertDescription>
              </Alert>
            )}
          </div>
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <span className="text-sm font-medium text-foreground">
                {selectedIds.size} request{selectedIds.size !== 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDelete}
                  disabled={!!deletingId}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete {selectedIds.size}
                </Button>
              </div>
            </div>
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
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredRequests.length && filteredRequests.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                      title={selectedIds.size === filteredRequests.length ? "Deselect all" : "Select all"}
                    />
                  </TableHead>
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
                  <TableHead className="text-right font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow
                    key={request._id}
                    className={cn(
                      "border-border/40 transition-colors",
                      selectedIds.has(request._id)
                        ? "bg-primary/5"
                        : "hover:bg-muted/40"
                    )}
                  >
                    <TableCell className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(request._id)}
                        onChange={() => handleSelectToggle(request._id)}
                        className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                      />
                    </TableCell>
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
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() =>
                          handleDeleteClick(request._id, request.patientName)
                        }
                        disabled={deletingId === request._id}
                      >
                        {deletingId === request._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
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

        {deleteDialog.open && (
          <Dialog open={true} onOpenChange={() => setDeleteDialog({ open: false })}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Delete {deleteDialog.isBulk ? `${selectedIds.size} Blood Requests` : "Blood Request"}?
                </DialogTitle>
                <DialogDescription>
                  {deleteDialog.isBulk ? (
                    <>
                      Are you sure you want to delete{" "}
                      <span className="font-semibold text-foreground">{selectedIds.size} blood request(s)</span>? This
                      action cannot be undone.
                    </>
                  ) : (
                    <>
                      Are you sure you want to delete the blood request for{" "}
                      <span className="font-semibold text-foreground">{deleteDialog.patientName}</span>? This action cannot
                      be undone.
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>This will be removed from all dashboards in real-time.</span>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialog({ open: false })}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={!!deletingId}
                >
                  {deletingId ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
