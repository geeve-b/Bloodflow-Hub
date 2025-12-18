import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/context/DataContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function RequestBloodForm() {
  const { addRequest } = useData();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      patientName: formData.get("patientName") as string,
      bloodGroup: formData.get("bloodGroup") as string,
      unitsNeeded: Number(formData.get("units")),
      hospitalName: formData.get("hospital") as string,
    };

    setTimeout(() => {
      addRequest(data);
      setLoading(false);
      toast({
        title: "Request Submitted",
        description: "Eligible donors have been notified via email.",
      });
      (e.target as HTMLFormElement).reset();
    }, 1500);
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
