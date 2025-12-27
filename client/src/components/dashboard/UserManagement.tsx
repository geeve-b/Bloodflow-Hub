import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

interface UserDetails extends User {
  phone?: string;
  bloodType?: string;
  idProof?: boolean;
}

export default function UserManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile details (donor, staff, receiver info)
  const fetchUserDetails = async (userId: string, role: string) => {
    try {
      const response = await fetch(`/api/profile/${userId}/${role}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle view user details
  const handleViewDetails = async (user: User) => {
    setSelectedUser(user);
    const profileData = await fetchUserDetails(user._id, user.role);
    setUserProfile(profileData);
    setShowDetails(true);
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setUsers(users.filter((u) => u._id !== userId));
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
      } else {
        throw new Error("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  // Filter and search users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-500/10 text-red-700 hover:bg-red-500/20",
      donor: "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20",
      hospital: "bg-green-500/10 text-green-700 hover:bg-green-500/20",
      receiver: "bg-purple-500/10 text-purple-700 hover:bg-purple-500/20",
    };
    return colors[role] || "bg-gray-500/10 text-gray-700";
  };

  if (loading) {
    return (
      <Card className="border-border/70">
        <CardContent className="pt-8">
          <div className="text-center text-muted-foreground">Loading users...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-xl">User Management</CardTitle>
          <CardDescription>View and manage all registered users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="donor">Donor</SelectItem>
                <SelectItem value="hospital">Hospital</SelectItem>
                <SelectItem value="receiver">Receiver</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.emailVerified ? "default" : "secondary"}
                          className={user.emailVerified ? "bg-green-500/10 text-green-700" : ""}
                        >
                          {user.emailVerified ? "Verified" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(user)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user._id)}
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </CardContent>
      </Card>

      {/* User Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Account Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="font-medium">{selectedUser.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <Badge className={`${getRoleBadgeColor(selectedUser.role)} mt-1`}>
                      {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Verification Status</p>
                    <Badge
                      variant={selectedUser.emailVerified ? "default" : "secondary"}
                      className={`mt-1 ${selectedUser.emailVerified ? "bg-green-500/10 text-green-700" : ""}`}
                    >
                      {selectedUser.emailVerified ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-medium">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Role-specific Details */}
              {userProfile && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)} Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedUser.role === "donor" && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">First Name</p>
                          <p className="font-medium">{userProfile.firstName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Last Name</p>
                          <p className="font-medium">{userProfile.lastName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Phone Number</p>
                          <p className="font-medium">{userProfile.phone || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Blood Type</p>
                          <p className="font-medium text-red-600">{userProfile.bloodType || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p className="font-medium">{userProfile.address || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge variant={userProfile.isActive ? "default" : "secondary"} className="mt-1">
                            {userProfile.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </>
                    )}

                    {selectedUser.role === "hospital" && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">First Name</p>
                          <p className="font-medium">{userProfile.firstName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Last Name</p>
                          <p className="font-medium">{userProfile.lastName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Phone Number</p>
                          <p className="font-medium">{userProfile.phone || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Hospital Name</p>
                          <p className="font-medium">{userProfile.hospitalName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p className="font-medium">{userProfile.address || "—"}</p>
                        </div>
                      </>
                    )}

                    {selectedUser.role === "receiver" && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">First Name</p>
                          <p className="font-medium">{userProfile.firstName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Last Name</p>
                          <p className="font-medium">{userProfile.lastName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Phone Number</p>
                          <p className="font-medium">{userProfile.phone || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Blood Type Required</p>
                          <p className="font-medium text-red-600">{userProfile.bloodType || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Hospital Name</p>
                          <p className="font-medium">{userProfile.hospitalName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Urgency Level</p>
                          <Badge variant="secondary" className="mt-1">
                            {userProfile.urgencyLevel || "Medium"}
                          </Badge>
                        </div>
                      </>
                    )}

                    {selectedUser.role === "admin" && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Administrator Account</p>
                        <p className="font-medium">Full system access</p>
                      </div>
                    )}
                  </div>

                  {/* ID Proof Status for Staff */}
                  {selectedUser.role === "hospital" && userProfile.staff_id_document && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">ID Proof Document</p>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        ✓ Submitted: {userProfile.staff_id_document}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!userProfile && (
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    No additional profile information available
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
