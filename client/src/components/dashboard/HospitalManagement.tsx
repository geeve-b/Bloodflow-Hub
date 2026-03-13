import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, CheckCircle, XCircle, Search, Building2, Clock, Phone, Mail, User, ShieldCheck } from "lucide-react";

interface StaffProfile {
  _id?: string;
  userId: string;
  firstName: string;
  lastName: string;
  staffId: string;
  department: string;
  position: string;
  phone: string;
  email: string;
  hospitalName: string;
}

interface Hospital {
  _id: string;
  username: string;
  email: string;
  role: string;
  emailVerified: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
  staffProfile: StaffProfile | null;
}

const defaultForm = {
  username: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  staffId: "",
  department: "",
  position: "",
  phone: "",
  hospitalName: "",
};

function ApprovalBadge({ status }: { status?: string }) {
  if (status === "approved")
    return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
  if (status === "rejected")
    return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>;
  return <Badge className="bg-primary/10 text-primary border-primary/20"><Clock className="h-3 w-3 mr-1 inline" />Pending</Badge>;
}

export default function HospitalManagement() {
  const { toast } = useToast();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [rejectReason, setRejectReason] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hospitals");
      if (!res.ok) throw new Error("Failed to fetch hospitals");
      const data = await res.json();
      setHospitals(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch hospitals", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const openAdd = () => {
    setForm(defaultForm);
    setEditingId(null);
    setShowDialog(true);
  };

  const openEdit = (hospital: Hospital) => {
    setForm({
      username: hospital.username,
      email: hospital.email,
      password: "",
      firstName: hospital.staffProfile?.firstName || "",
      lastName: hospital.staffProfile?.lastName || "",
      staffId: hospital.staffProfile?.staffId || "",
      department: hospital.staffProfile?.department || "",
      position: hospital.staffProfile?.position || "",
      phone: hospital.staffProfile?.phone || "",
      hospitalName: hospital.staffProfile?.hospitalName || "",
    });
    setEditingId(hospital._id);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.username || !form.email) {
      toast({ title: "Validation", description: "Username and email are required", variant: "destructive" });
      return;
    }
    if (!editingId && !form.password) {
      toast({ title: "Validation", description: "Password is required for new hospitals", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/hospitals/${editingId}` : "/api/hospitals";
      const method = editingId ? "PUT" : "POST";
      const body = editingId
        ? { username: form.username, email: form.email, firstName: form.firstName, lastName: form.lastName, staffId: form.staffId, department: form.department, position: form.position, phone: form.phone, hospitalName: form.hospitalName }
        : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Request failed");
      }
      toast({ title: "Success", description: editingId ? "Hospital updated" : "Hospital added successfully" });
      setShowDialog(false);
      fetchHospitals();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to save hospital", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/hospitals/${id}/approve`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to approve");
      toast({ title: "Approved", description: "Hospital registration approved" });
      fetchHospitals();
    } catch {
      toast({ title: "Error", description: "Failed to approve hospital", variant: "destructive" });
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.id) return;
    try {
      const res = await fetch(`/api/hospitals/${rejectDialog.id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!res.ok) throw new Error("Failed to reject");
      toast({ title: "Rejected", description: "Hospital registration rejected" });
      setRejectDialog({ open: false, id: null });
      setRejectReason("");
      fetchHospitals();
    } catch {
      toast({ title: "Error", description: "Failed to reject hospital", variant: "destructive" });
    }
  };

  const filtered = hospitals.filter(
    (h) =>
      h.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.staffProfile?.hospitalName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Hospital Management</h2>
            <p className="text-sm text-muted-foreground">
              {hospitals.length} hospital{hospitals.length !== 1 ? "s" : ""} registered
            </p>
          </div>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Hospital
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search hospitals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Hospital Cards Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse border-border/60">
              <CardContent className="p-5 space-y-3">
                <div className="h-5 w-2/3 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded" />
                <div className="h-4 w-3/4 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="rounded-full bg-muted p-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-muted-foreground">No hospitals found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {searchTerm ? "Try a different search term" : "Add a hospital to get started"}
              </p>
            </div>
            {!searchTerm && (
              <Button onClick={openAdd} variant="outline" className="gap-2 mt-2">
                <Plus className="h-4 w-4" />
                Add First Hospital
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((hospital) => {
            const name = hospital.staffProfile?.hospitalName || hospital.username;
            const contact = hospital.staffProfile
              ? `${hospital.staffProfile.firstName} ${hospital.staffProfile.lastName}`.trim()
              : null;
            return (
              <Card key={hospital._id} className="border-border/70 hover:shadow-md transition-all duration-200 relative overflow-hidden">
                {/* Status stripe */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    hospital.approvalStatus === "approved"
                      ? "bg-green-500"
                      : hospital.approvalStatus === "rejected"
                      ? "bg-destructive"
                      : "bg-primary"
                  }`}
                />
                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="rounded-md bg-primary/10 p-1.5 shrink-0">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle className="text-base leading-tight truncate">{name}</CardTitle>
                    </div>
                    <ApprovalBadge status={hospital.approvalStatus} />
                  </div>
                  {hospital.staffProfile?.department && (
                    <CardDescription className="text-xs mt-1">{hospital.staffProfile.department}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-2 pb-4">
                  {contact && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{contact}</span>
                      {hospital.staffProfile?.position && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">{hospital.staffProfile.position}</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{hospital.email}</span>
                  </div>
                  {hospital.staffProfile?.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{hospital.staffProfile.phone}</span>
                    </div>
                  )}
                  {hospital.staffProfile?.staffId && hospital.staffProfile.staffId !== "N/A" && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>ID: {hospital.staffProfile.staffId}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-3 border-t border-border/50 mt-3">
                    <Button variant="outline" size="sm" onClick={() => openEdit(hospital)} className="gap-1 flex-1">
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    {hospital.approvalStatus !== "approved" && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(hospital._id)}
                        className="gap-1 flex-1"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                    )}
                    {hospital.approvalStatus !== "rejected" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRejectDialog({ open: true, id: hospital._id })}
                        className="gap-1 flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Hospital" : "Add Hospital"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update hospital account and staff details." : "Create a new hospital account in the system."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username *</Label>
                <Input id="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="hospital_user" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@hospital.com" />
              </div>
            </div>
            {!editingId && (
              <div className="space-y-1.5">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="hospitalName">Hospital Name</Label>
              <Input id="hospitalName" value={form.hospitalName} onChange={(e) => setForm({ ...form, hospitalName: e.target.value })} placeholder="City General Hospital" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="John" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Doe" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="department">Department</Label>
                <Input id="department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Blood Bank" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="position">Position</Label>
                <Input id="position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Manager" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 8900" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="staffId">Staff ID</Label>
                <Input id="staffId" value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })} placeholder="STF-001" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Hospital"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, id: open ? rejectDialog.id : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Hospital Registration</DialogTitle>
            <DialogDescription>Optionally provide a reason for rejection. This will be recorded.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label htmlFor="rejectReason">Reason (optional)</Label>
            <Input id="rejectReason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Incomplete documentation" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, id: null })}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject}>Reject Registration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
