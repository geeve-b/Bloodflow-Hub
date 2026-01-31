import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Heart, Download, Filter, AlertCircle, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface DonationRecord {
  _id: string;
  donorId: string;
  donorName: string;
  bloodType: string;
  unitsCollected: number;
  location: string;
  donationDate: string;
  status: "completed" | "deferred" | "cancelled";
  certificateUrl?: string;
  certificationDate?: string;
}

interface DonationStats {
  totalDonations: number;
  totalUnitsCollected: number;
  lastDonationDate?: string;
  lifesSaved: number;
  allTimeDonations: DonationRecord[];
}

export function DonationHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<DonationRecord[]>([]);
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<DonationRecord["status"] | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch donation history
        const historyResponse = await fetch(`/api/donations/history/${user.id}`);
        if (!historyResponse.ok) {
          throw new Error("Failed to fetch donation history");
        }
        const historyData = await historyResponse.json();
        setHistory(historyData.donations || historyData || []);

        // Fetch donation stats
        const statsResponse = await fetch(`/api/donations/stats/${user.id}`);
        if (!statsResponse.ok) {
          throw new Error("Failed to fetch donation stats");
        }
        const statsData = await statsResponse.json();
        setStats(statsData);

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load donation history");
        setHistory([]);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const filteredHistory = history.filter((donation) => {
    const donationYear = new Date(donation.donationDate).getFullYear();
    if (selectedYear && donationYear !== selectedYear) return false;
    if (selectedLocation && donation.location !== selectedLocation) return false;
    if (selectedStatus && donation.status !== selectedStatus) return false;
    return true;
  });

  const uniqueYears = Array.from(
    new Set(history.map((d) => new Date(d.donationDate).getFullYear()))
  ).sort((a, b) => b - a);

  const uniqueLocations = Array.from(new Set(history.map((d) => d.location)));

  const handleDownloadCertificate = async (donationId: string) => {
    try {
      const response = await fetch(`/api/donations/certificate/${donationId}`);
      if (!response.ok) {
        throw new Error("Failed to download certificate");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `donation-certificate-${donationId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error ? `Failed to download certificate: ${err.message}` : "Failed to download"
      );
    }
  };

  const getStatusBadge = (status: DonationRecord["status"]) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "deferred":
        return <Badge variant="secondary">Deferred</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Donation History
          </CardTitle>
          <CardDescription>Your donation journey and certificates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading donation history...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Donation History
            </CardTitle>
            <CardDescription>Your donation journey and certificates</CardDescription>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by Year</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={selectedYear === null}
                  onCheckedChange={() => setSelectedYear(null)}
                >
                  All Years
                </DropdownMenuCheckboxItem>
                {uniqueYears.map((year) => (
                  <DropdownMenuCheckboxItem
                    key={year}
                    checked={selectedYear === year}
                    onCheckedChange={() => setSelectedYear(year)}
                  >
                    {year}
                  </DropdownMenuCheckboxItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filter by Location</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={selectedLocation === null}
                  onCheckedChange={() => setSelectedLocation(null)}
                >
                  All Locations
                </DropdownMenuCheckboxItem>
                {uniqueLocations.map((location) => (
                  <DropdownMenuCheckboxItem
                    key={location}
                    checked={selectedLocation === location}
                    onCheckedChange={() => setSelectedLocation(location)}
                  >
                    {location}
                  </DropdownMenuCheckboxItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={selectedStatus === null}
                  onCheckedChange={() => setSelectedStatus(null)}
                >
                  All Status
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedStatus === "completed"}
                  onCheckedChange={() => setSelectedStatus("completed")}
                >
                  Completed
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedStatus === "deferred"}
                  onCheckedChange={() => setSelectedStatus("deferred")}
                >
                  Deferred
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedStatus === "cancelled"}
                  onCheckedChange={() => setSelectedStatus("cancelled")}
                >
                  Cancelled
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground">Total Donations</p>
              <p className="text-2xl font-bold">{stats.totalDonations}</p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground">Units Collected</p>
              <p className="text-2xl font-bold">{stats.totalUnitsCollected}</p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground">Lives Impacted</p>
              <p className="text-2xl font-bold">{stats.lifesSaved}</p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground">Last Donation</p>
              <p className="text-lg font-bold">
                {stats.lastDonationDate
                  ? new Date(stats.lastDonationDate).toLocaleDateString()
                  : "Never"}
              </p>
            </div>
          </div>
        )}

        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">No donations yet</p>
            <p className="text-sm">
              {selectedYear || selectedLocation || selectedStatus
                ? "No donations match the selected filters"
                : "Start your donation journey today!"}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Blood Type</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((donation) => (
                  <TableRow key={donation._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {new Date(donation.donationDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{donation.bloodType}</Badge>
                    </TableCell>
                    <TableCell>{donation.unitsCollected} units</TableCell>
                    <TableCell>{donation.location}</TableCell>
                    <TableCell>{getStatusBadge(donation.status)}</TableCell>
                    <TableCell>
                      {donation.status === "completed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadCertificate(donation._id)}
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Certificate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            📋 Data Security
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Your donation history is read-only and tamper-proof. All records are maintained for medical
            and compliance purposes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
