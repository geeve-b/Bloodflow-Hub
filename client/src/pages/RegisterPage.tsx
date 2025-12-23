import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StepDatePicker } from "@/components/ui/step-date-picker";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarIcon, Upload } from "lucide-react";

const API_URL = "http://localhost:3001/api";

const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    dateOfBirth: undefined as Date | undefined,
    bloodGroup: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [medicalEligibility, setMedicalEligibility] = useState({
    weight: false,
    age: false,
    tattoo: false,
    alcohol: false,
  });

  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [idProofFileName, setIdProofFileName] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, bloodGroup: value }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, dateOfBirth: date }));
  };

  const handleCheckboxChange = (key: keyof typeof medicalEligibility) => {
    setMedicalEligibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdProofFile(file);
      setIdProofFileName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!Object.values(medicalEligibility).every(v => v === true)) {
        toast({
          title: "Error",
          description: "You must meet all medical eligibility requirements",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!idProofFile) {
        toast({
          title: "Error",
          description: "Please upload your ID proof",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Register user
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          role: "donor",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: "Verification code sent to your email.",
      });

      const verification = data.verification;
      if (verification?.userId) {
        setLocation(
          `/verify-email?userId=${encodeURIComponent(
            verification.userId,
          )}&email=${encodeURIComponent(verification.email || formData.email)}`,
        );
      } else {
        setLocation("/verify-email");
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg rounded-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 rounded-t-2xl">
            <CardTitle className="text-3xl font-bold text-slate-800">Donor Registration</CardTitle>
            <CardDescription className="text-base text-slate-600 mt-2">
              Join our community of life savers. We deeply appreciate your commitment to saving lives.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-8 pt-8">
              {/* Personal Information Section */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-6">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="rounded-lg border-slate-200 shadow-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="rounded-lg border-slate-200 shadow-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-sm font-medium text-slate-700">
                      Date of Birth
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal rounded-lg shadow-sm border-slate-200 hover:bg-slate-50"
                          aria-label="Select your date of birth"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-pink-500" />
                          {formData.dateOfBirth 
                            ? format(formData.dateOfBirth, "dd-MM-yyyy") 
                            : "Select date of birth"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-full sm:w-96 p-0 rounded-lg shadow-xl bg-white border border-slate-200"
                        align="start"
                      >
                        <StepDatePicker
                          selected={formData.dateOfBirth}
                          onSelect={handleDateSelect}
                          minYear={1950}
                          maxYear={new Date().getFullYear()}
                          disabled={(date) => date > new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-slate-500">
                      Select year → month → day
                    </p>
                  </div>

                  {/* Blood Group */}
                  <div className="space-y-2">
                    <Label htmlFor="bloodGroup" className="text-sm font-medium text-slate-700">
                      Blood Group
                    </Label>
                    <Select value={formData.bloodGroup} onValueChange={handleSelectChange}>
                      <SelectTrigger className="rounded-lg border-slate-200 shadow-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg shadow-lg">
                        {BLOOD_GROUPS.map(group => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Account Information Section */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-6">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-slate-700">
                      Username
                    </Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="john_donor"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      className="rounded-lg border-slate-200 shadow-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                      Password
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="rounded-lg border-slate-200 shadow-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      className="rounded-lg border-slate-200 shadow-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Medical Eligibility Section */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
                  Medical Eligibility
                </h3>
                <div className="space-y-4">
                  {[
                    { key: "weight", label: "I weigh more than 50kg (110lbs)" },
                    { key: "age", label: "I am between 18 and 65 years old" },
                    { key: "tattoo", label: "I have not had a tattoo in the last 6 months" },
                    { key: "alcohol", label: "No alcohol consumption in last 24h" },
                  ].map(item => (
                    <div key={item.key} className="flex items-center space-x-3">
                      <Checkbox
                        id={item.key}
                        checked={medicalEligibility[item.key as keyof typeof medicalEligibility]}
                        onCheckedChange={() => handleCheckboxChange(item.key as keyof typeof medicalEligibility)}
                        className="w-5 h-5 rounded border-slate-300 text-pink-600 focus:ring-pink-500 shadow-sm"
                      />
                      <Label
                        htmlFor={item.key}
                        className="text-sm font-normal text-slate-700 cursor-pointer"
                      >
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* File Upload Section */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-50 rounded-2xl p-6 border border-amber-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <Upload className="w-5 h-5 mr-3 text-pink-500" />
                  Upload ID Proof
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  (Government ID - Passport, Driving License, etc.)
                </p>
                <div className="relative">
                  <input
                    type="file"
                    id="idProof"
                    name="idProof"
                    onChange={handleFileChange}
                    required
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                  <label
                    htmlFor="idProof"
                    className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors"
                  >
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                      <p className="text-sm font-medium text-slate-700">
                        {idProofFileName || "Click to upload or drag and drop"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        PDF, JPG, PNG (Max 5MB)
                      </p>
                    </div>
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-4 italic">
                  🔒 This will be verified by our staff. Your ID is kept secure and never shared publicly.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 border-t border-slate-200 pt-8">
              <Button
                type="submit"
                className="w-full py-6 text-base font-semibold bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
                disabled={loading}
              >
                {loading ? "Submitting Application..." : "Submit Application"}
              </Button>

              {/* Privacy Disclaimer */}
              <p className="text-xs text-center text-slate-500 leading-relaxed">
                By registering, you agree to our privacy policy. Your contact info is never shared publicly.
                We are committed to protecting your personal information.
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
