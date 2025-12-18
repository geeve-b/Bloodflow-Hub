import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    // Simulate validation delay
    setTimeout(() => {
      register(data);
      setLoading(false);
      setLocation("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-muted/30 flex justify-center items-start">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Donor Registration</CardTitle>
          <CardDescription>
            Join our community of life savers. Strict medical eligibility is required.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" name="dob" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Select name="bloodGroup" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                     {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 border rounded-lg p-4 bg-secondary/20">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Medical Eligibility</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="flex items-start space-x-2">
                  <Checkbox id="weight" required />
                  <Label htmlFor="weight" className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    I weigh more than 50kg (110lbs)
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="age" required />
                  <Label htmlFor="age" className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    I am between 18 and 65 years old
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="health" required />
                  <Label htmlFor="health" className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    I have not had a tattoo in the last 6 months
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="alcohol" required />
                  <Label htmlFor="alcohol" className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                     No alcohol consumption in last 24h
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="idProof">Upload ID Proof (Govt ID)</Label>
              <Input id="idProof" type="file" required className="cursor-pointer" />
              <p className="text-xs text-muted-foreground">This will be verified by our staff. Your ID is kept secure.</p>
            </div>

          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Submitting Application..." : "Submit Application"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              By registering, you agree to our privacy policy. Your contact info is never shared publicly.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
