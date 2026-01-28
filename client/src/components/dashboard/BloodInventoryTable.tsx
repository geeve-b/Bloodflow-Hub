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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useBloodInventory } from "@/hooks/useBloodInventory";
import {
  InventoryStatus,
  INVENTORY_STALE_THRESHOLD_HOURS,
  formatInventoryTimestamp,
  inventoryStatusMeta,
  isInventoryStale,
  calculateStatusFromQuantity,
} from "@/lib/inventory";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  Droplets,
  Loader2,
  RefreshCcw,
  Search,
} from "lucide-react";

const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

export function BloodInventoryTable() {
  const { refreshInventory } = useData();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const {
    data: inventory = [],
    isLoading,
    isFetching,
    error,
    refetch,
    dataUpdatedAt,
  } = useBloodInventory();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | "all">(
    "all"
  );
  const [bloodTypeFilter, setBloodTypeFilter] = useState<string>("all");

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredInventory = useMemo(() => {
    return inventory
      .filter((entry) => {
        if (statusFilter === "all") return true;
        // Calculate status based on quantity and compare
        const calculatedStatus = calculateStatusFromQuantity(entry.quantity);
        return calculatedStatus === statusFilter;
      })
      .filter((entry) =>
        bloodTypeFilter === "all" ? true : entry.bloodType === bloodTypeFilter
      )
      .filter((entry) => {
        if (!normalizedSearch) return true;
        return (
          entry.hospitalName.toLowerCase().includes(normalizedSearch) ||
          entry.bloodType.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((a, b) =>
        a.bloodType.localeCompare(b.bloodType) ||
        a.hospitalName.localeCompare(b.hospitalName)
      );
  }, [inventory, statusFilter, bloodTypeFilter, normalizedSearch]);
  // Listen for blood inventory updates
  useEffect(() => {
    const handleInventoryUpdate = () => {
      refreshInventory();
    };

    window.addEventListener('bloodInventoryUpdated', handleInventoryUpdate);
    return () => window.removeEventListener('bloodInventoryUpdated', handleInventoryUpdate);
  }, [refreshInventory]);

  const staleEntries = useMemo(
    () => filteredInventory.filter((entry) => isInventoryStale(entry.updatedAt)),
    [filteredInventory]
  );

  const uniqueHospitals = useMemo(() => {
    const ids = new Set(filteredInventory.map((entry) => entry.hospitalId));
    return ids.size;
  }, [filteredInventory]);

  const lastSyncedLabel = formatInventoryTimestamp(
    dataUpdatedAt ? new Date(dataUpdatedAt) : undefined
  );

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-lg font-semibold">Search Network Inventory</p>
            <p className="text-sm text-muted-foreground">
              Showing {filteredInventory.length} entr
              {filteredInventory.length === 1 ? "y" : "ies"} across {uniqueHospitals}
              {" "}
              hospital{uniqueHospitals === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-muted-foreground">
              Last sync: {lastSyncedLabel}
              {isFetching && !isLoading && " · Refreshing…"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full lg:w-auto"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
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

        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          <div className="md:col-span-2 lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by hospital or blood group"
                className="pl-9 bg-white dark:bg-slate-900 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
          </div>
          <Select value={bloodTypeFilter} onValueChange={setBloodTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Blood group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All blood groups</SelectItem>
              {BLOOD_TYPES.map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as InventoryStatus | "all")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(inventoryStatusMeta) as InventoryStatus[]).map(
                (status) => (
                  <SelectItem key={status} value={status}>
                    {inventoryStatusMeta[status].label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {staleEntries.length > 0 && (
        <Alert className="border-amber-300 bg-yellow-50 text-amber-900 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-200">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-blue-400" />
          <AlertTitle className="text-amber-900 dark:text-blue-200">Some entries look stale</AlertTitle>
          <AlertDescription>
            {staleEntries.length} entr
            {staleEntries.length === 1 ? "y" : "ies"} have not been updated in over {INVENTORY_STALE_THRESHOLD_HOURS}
            {" "}
            hours. Please contact the respective hospital for confirmation.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Unable to load inventory</AlertTitle>
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>{error.message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {user?.role === "hospital" && (
        <Alert>
          <AlertTitle>Need to update availability?</AlertTitle>
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            Manage inventory from the hospital dashboard to sync donor data instantly.
            <Button
              size="sm"
              variant="link"
              className="px-0"
              onClick={() => setLocation("/hospital-dashboard")}
            >
              Open dashboard
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border">
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">
            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
            Fetching live inventory...
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No matching inventory found. Adjust your filters and try again.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Hospital</TableHead>
                  <TableHead className="font-semibold">Blood Group</TableHead>
                  <TableHead className="font-semibold text-center">
                    Units Available
                  </TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Data Freshness</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((entry) => {
                  // Calculate status based on quantity
                  const calculatedStatus = calculateStatusFromQuantity(entry.quantity);
                  const statusMeta = inventoryStatusMeta[calculatedStatus];
                  const stale = isInventoryStale(entry.updatedAt);
                  const StatusIcon = statusMeta.icon;
                  return (
                    <TableRow
                      key={`${entry._id}-${entry.hospitalId}`}
                      className={cn(
                        "hover:bg-muted/30 transition-colors",
                        stale && "bg-yellow-50/70 dark:bg-blue-950/40"
                      )}
                    >
                      <TableCell>
                        <p className="font-semibold">{entry.hospitalName}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {entry.hospitalId}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-bold text-primary">
                          <Droplets className="h-4 w-4 text-red-500" />
                          {entry.bloodType}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-lg font-semibold">
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
                            className={cn(
                              "gap-1 text-xs font-semibold",
                              statusMeta.badgeClass
                            )}
                          >
                            <StatusIcon
                              className={cn("h-3.5 w-3.5", statusMeta.iconClass)}
                            />
                            {statusMeta.label}
                          </Badge>
                          <p className="text-[11px] text-muted-foreground">
                            {statusMeta.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">
                          {formatInventoryTimestamp(entry.updatedAt)}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "mt-1 text-[11px]",
                            stale
                              ? "border-amber-400 bg-yellow-100 text-amber-900 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200"
                              : "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200"
                          )}
                        >
                          {stale ? "Stale" : "Fresh"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
