import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UrgencyBadge } from "@/components/dashboard/UrgencyBadge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

const API_URL = "http://localhost:3001/api";

type Urgency = "critical" | "high" | "medium" | "low";

const urgencyOptions: Array<{ value: Urgency; label: string; helper: string }> = [
  { value: "critical", label: "Critical", helper: "Immediate life-threatening emergency" },
  { value: "high", label: "High", helper: "Needed within the next 6 hours" },
  { value: "medium", label: "Medium", helper: "Needed within 24 hours" },
  { value: "low", label: "Low", helper: "Routine or scheduled need" },
];

interface RequestFormValues {
  bloodGroup: string;
  units: number;
  notes: string;
  hospital: string;
  patientName: string;
  primaryMobileNumber: string;
  secondaryMobileNumber?: string;
  urgency: Urgency;
}

interface ConfirmationDetails {
  id: string;
  patientName: string;
  hospitalName: string;
  bloodGroup: string;
  units: number;
  urgency: Urgency;
}

export function RequestBloodForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [urgency, setUrgency] = useState<Urgency | "">("");
  const [formRef, setFormRef] = useState<HTMLFormElement | null>(null);
  const [confirmationDetails, setConfirmationDetails] = useState<ConfirmationDetails | null>(null);

  const submitRequest = async (data: RequestFormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to request blood",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const requestData = {
      requesterId: user.id,
      requesterName: user.name,
      hospitalName: data.hospital,
      bloodType: data.bloodGroup,
      quantity: data.units,
      urgency: data.urgency,
      reason: data.notes || "Patient blood requirement",
      patientName: data.patientName,
      contactNumber: data.primaryMobileNumber,
      secondaryContactNumber: data.secondaryMobileNumber || undefined,
    };

    try {
      const response = await fetch(`${API_URL}/blood-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || "Failed to submit request");
      }

      const createdRequest = await response.json();
      
      toast({
        title: "Success",
        description: "Blood request submitted successfully. Eligible donors will be notified.",
      });
      
      if (formRef) {
        formRef.reset();
      }
      setUrgency("");
      setConfirmationDetails({
        id: String(createdRequest?._id ?? createdRequest?.id ?? Date.now()),
        patientName: data.patientName,
        hospitalName: data.hospital,
        bloodGroup: data.bloodGroup,
        units: data.units,
        urgency: data.urgency,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit blood request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to request blood",
        variant: "destructive",
      });
      return;
    }

    if (!urgency) {
      toast({
        title: "Urgency required",
        description: "Select an urgency level to prioritize your request",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data: RequestFormValues = {
      bloodGroup: formData.get("bloodGroup") as string,
      units: Number(formData.get("units")),
      notes: formData.get("notes") as string,
      hospital: formData.get("hospital") as string,
      patientName: formData.get("patientName") as string,
      primaryMobileNumber: formData.get("primaryMobileNumber") as string,
      secondaryMobileNumber: formData.get("secondaryMobileNumber") as string | undefined,
      urgency: urgency as Urgency,
    };

    setConfirmationDetails(null);
    await submitRequest(data);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Request Blood</CardTitle>
          <CardDescription>
            Submit a request if blood is unavailable. We will notify eligible donors immediately.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} ref={setFormRef}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name</Label>
                <Input id="patientName" name="patientName" placeholder="Full Name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group Needed</Label>
                <Select name="bloodGroup" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <SelectItem key={bg} value={bg}>
                        {bg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="units">Units Required</Label>
                <Input id="units" name="units" type="number" min="1" max="10" placeholder="1" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency Level</Label>
                <Select value={urgency} onValueChange={(value) => setUrgency(value as Urgency)}>
                  <SelectTrigger id="urgency" aria-required="true">
                    <SelectValue placeholder="Select urgency level" />
                  </SelectTrigger>
                  <SelectContent>
                    {urgencyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.helper}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select urgency to prioritize blood requests effectively.
                </p>
                <input type="hidden" name="urgency" value={urgency} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hospital">Hospital Name</Label>
                <Input id="hospital" name="hospital" placeholder="Where is the patient?" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryMobileNumber">
                  Primary Mobile Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="primaryMobileNumber"
                  name="primaryMobileNumber"
                  type="tel"
                  placeholder="10-digit mobile number"
                  pattern="[0-9]{10}"
                  inputMode="numeric"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryMobileNumber">Secondary Mobile Number (Optional)</Label>
                <Input
                  id="secondaryMobileNumber"
                  name="secondaryMobileNumber"
                  type="tel"
                  placeholder="10-digit mobile number"
                  pattern="[0-9]{10}"
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea id="notes" name="notes" placeholder="Condition details, ward info, etc." />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Broadcasting Request..." : "Submit Request & Notify Donors"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {confirmationDetails && (
        <Card className="mt-6 border-primary/40 bg-primary/5">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Request Confirmed
              </CardTitle>
              <CardDescription>
                We alerted eligible donors and highlighted your urgency level for staff review.
              </CardDescription>
            </div>
            <UrgencyBadge urgency={confirmationDetails.urgency} size="sm" />
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Request ID</p>
              <Badge variant="outline" className="font-mono text-xs">
                {confirmationDetails.id}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Patient</p>
              <p className="font-semibold text-foreground">{confirmationDetails.patientName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Hospital</p>
              <p className="font-semibold text-foreground">{confirmationDetails.hospitalName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Blood Requirement</p>
              <p className="font-semibold text-foreground">
                {confirmationDetails.units} unit(s) of {confirmationDetails.bloodGroup}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Track this request in your dashboard — critical items are flagged for hospitals automatically.
            </p>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
