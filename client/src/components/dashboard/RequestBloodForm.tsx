import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const API_URL = "http://localhost:3001/api";

export function RequestBloodForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

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

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const bloodGroup = formData.get("bloodGroup") as string;
    const units = Number(formData.get("units"));
    const notes = formData.get("notes") as string;

    const requestData = {
      requesterId: user.id,
      requesterName: user.name,
      hospitalName: formData.get("hospital") as string,
      bloodType: bloodGroup,
      quantity: units,
      urgency: "medium" as const,
      reason: notes || "Patient blood requirement",
      patientName: formData.get("patientName") as string,
      contactNumber: formData.get("primaryMobileNumber") as string,
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
      
      (e.target as HTMLFormElement).reset();
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Request Blood</CardTitle>
        <CardDescription>
          Submit a request if blood is unavailable. We will notify eligible donors immediately.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
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
                    <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="units">Units Required</Label>
              <Input id="units" name="units" type="number" min="1" max="10" placeholder="1" required />
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
            <Textarea id="notes" name="notes" placeholder="Condition, urgency level, etc." />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Broadcasting Request..." : "Submit Request & Notify Donors"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
