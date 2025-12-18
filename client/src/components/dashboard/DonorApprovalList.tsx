import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/DataContext";
import { Check, X, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DonorApprovalList() {
  const { donors, approveDonor, rejectDonor } = useData();
  const { toast } = useToast();
  
  const pendingDonors = donors.filter(d => d.status === "pending");

  const handleApprove = (id: string) => {
    approveDonor(id);
    toast({ title: "Donor Approved", description: "Donor can now receive requests." });
  };

  const handleReject = (id: string) => {
    rejectDonor(id);
    toast({ title: "Donor Rejected", variant: "destructive" });
  };

  if (pendingDonors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-md bg-muted/20 text-muted-foreground">
        <AlertCircle className="h-10 w-10 mb-2 opacity-50" />
        <p>No pending donor applications.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Blood Group</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Conditions</TableHead>
            <TableHead>Documents</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingDonors.map((donor) => (
            <TableRow key={donor.id}>
              <TableCell className="font-medium">{donor.name}</TableCell>
              <TableCell><Badge variant="outline">{donor.bloodGroup}</Badge></TableCell>
              <TableCell>{donor.age}</TableCell>
              <TableCell>
                {donor.medicalConditions.length > 0 ? (
                  <span className="text-destructive font-medium text-xs">
                    {donor.medicalConditions.join(", ")}
                  </span>
                ) : (
                  <span className="text-green-600 text-xs">None</span>
                )}
              </TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="link" size="sm" className="h-auto p-0 gap-1">
                      <FileText className="h-3 w-3" /> View ID
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>ID Verification: {donor.name}</DialogTitle>
                      <DialogDescription>
                        Reviewing uploaded identification documents.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="aspect-video bg-muted rounded-md flex items-center justify-center border-2 border-dashed">
                      <p className="text-muted-foreground text-sm">Preview of ID Document</p>
                    </div>
                  </DialogContent>
                </Dialog>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleReject(donor.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                  <Button size="sm" className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(donor.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
