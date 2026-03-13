import { useState, useEffect } from "react";
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
import { CalendarIcon, Eye, EyeOff, Upload } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";
const PENDING_VERIFICATION_KEY = "lifeflow:pendingVerification";

const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const STATE_REGION_MAP: Record<string, string[]> = {
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
  Kerala: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
  Delhi: ["New Delhi", "Dwarka", "Saket", "Karol Bagh"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Noida"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
};

const ALL_REGIONS = Object.values(STATE_REGION_MAP).flat();

export default function RegisterPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Get role from query params, default to "donor"
  const getInitialRole = () => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get("role");
    return roleParam === "hospital" ? "hospital" : "donor";
  };
  
  const [selectedRole, setSelectedRole] = useState<"donor" | "hospital">("donor");

  useEffect(() => {
    const initialRole = getInitialRole();
    setSelectedRole(initialRole);
  }, []);

  useEffect(() => {
    // If role changes to hospital, redirect immediately
    if (selectedRole === "hospital") {
      setLocation("/staff-register?role=hospital");
    }
  }, [selectedRole, setLocation]);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    dateOfBirth: undefined as Date | undefined,
    bloodGroup: "",
    state: "",
    region: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [medicalEligibility, setMedicalEligibility] = useState({
    weight: false,
    age: false,
    tattoo: false,
    alcohol: false,
  });

  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [idProofFileName, setIdProofFileName] = useState("");
  const [isRegionFocused, setRegionFocused] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, bloodGroup: value }));
  };

  const handleStateSelect = (value: string) => {
    setFormData(prev => ({ ...prev, state: value, region: "" }));
  };

  const handleRegionInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, region: value }));
  };

  const handleRegionSuggestionSelect = (value: string) => {
    setFormData(prev => ({ ...prev, region: value }));
    setRegionFocused(false);
  };

  const handleRegionFocus = () => setRegionFocused(true);
  const handleRegionBlur = () => {
    setTimeout(() => setRegionFocused(false), 120);
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

  const stateOptions = Object.keys(STATE_REGION_MAP);
  const regionPool =
    formData.state && STATE_REGION_MAP[formData.state]
      ? STATE_REGION_MAP[formData.state]
      : ALL_REGIONS;
  const normalizedRegionInput = formData.region.trim().toLowerCase();
  let regionSuggestions = regionPool.filter((region) =>
    normalizedRegionInput
      ? region.toLowerCase().includes(normalizedRegionInput)
      : true,
  );

  if (normalizedRegionInput && formData.region.trim()) {
    const hasExactMatch = regionSuggestions.some(
      (region) => region.toLowerCase() === normalizedRegionInput,
    );
    if (!hasExactMatch) {
      regionSuggestions = [formData.region.trim(), ...regionSuggestions];
    }
  }

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

      if (!formData.state || !formData.region) {
        toast({
          title: "Error",
          description: "Please select your state and region",
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
      const trimmedUsername = formData.username.trim();
      const trimmedEmail = formData.email.trim();
      const [firstName, lastName] = formData.fullName.split(" ");

      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: trimmedUsername,
          password: formData.password,
          email: trimmedEmail,
          role: "donor",
          firstName: firstName || "",
          lastName: lastName || "",
          bloodType: formData.bloodGroup,
          state: formData.state,
          region: formData.region,
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
      const nextTarget = {
        userId: verification?.userId ?? "",
        email: verification?.email ?? trimmedEmail,
      };
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          PENDING_VERIFICATION_KEY,
          JSON.stringify(nextTarget),
        );
      }

      if (nextTarget.userId || nextTarget.email) {
        setLocation(
          `/verify-email?userId=${encodeURIComponent(
            nextTarget.userId,
          )}&email=${encodeURIComponent(nextTarget.email)}`,
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
    <div className="min-h-screen py-12 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/5 dark:to-primary/10 rounded-t-2xl">
            <CardTitle className="text-3xl font-bold text-foreground">
              {selectedRole === "donor" ? "Donor Registration" : "Hospital Registration"}
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground mt-2">
              {selectedRole === "donor"
                ? "Join our community of life savers. We deeply appreciate your commitment to saving lives."
                : "Register as hospital staff to manage blood inventory and requests."}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-8 pt-8">
              {/* Role Selection Section */}
              <div className="bg-secondary/30 dark:bg-secondary/40 p-6 rounded-lg border border-border">
                <Label className="text-sm font-semibold text-foreground block mb-3">
                  Registration Type
                </Label>
                <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
                  <SelectTrigger className="w-full rounded-lg border-border shadow-sm focus:ring-2 focus:ring-primary">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="donor">Donor</SelectItem>
                    <SelectItem value="hospital">Hospital Login</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedRole === "donor" 
                    ? "Register as a blood donor to contribute to saving lives"
                    : "Register as hospital staff to manage blood inventory"}
                </p>
              </div>

              {/* Personal Information Section */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-6">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
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
                      className="rounded-lg border-border shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
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
                      className="rounded-lg border-border shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-sm font-medium text-foreground">
                      Date of Birth
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal rounded-lg shadow-sm border-border hover:bg-muted"
                          aria-label="Select your date of birth"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                          {formData.dateOfBirth 
                            ? format(formData.dateOfBirth, "dd-MM-yyyy") 
                            : "Select date of birth"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-full sm:w-96 p-0 rounded-lg shadow-xl bg-card border border-border"
                        align="start"
                      >
                        {(() => {
                          const today = new Date();
                          const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
                          return (
                            <StepDatePicker
                              selected={formData.dateOfBirth}
                              onSelect={handleDateSelect}
                              minYear={1950}
                              maxYear={maxDate.getFullYear()}
                              disabled={(date) => date > maxDate}
                            />
                          );
                        })()}
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">
                      Select year → month → day
                    </p>
                  </div>

                  {/* Blood Group */}
                  <div className="space-y-2">
                    <Label htmlFor="bloodGroup" className="text-sm font-medium text-foreground">
                      Blood Group
                    </Label>
                    <Select value={formData.bloodGroup} onValueChange={handleSelectChange}>
                      <SelectTrigger className="rounded-lg border-border shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent">
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

                  {/* State */}
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-medium text-foreground">
                      State / Province
                    </Label>
                    <Select value={formData.state} onValueChange={handleStateSelect}>
                      <SelectTrigger className="rounded-lg border-border shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg shadow-lg max-h-60 overflow-auto">
                        {stateOptions.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Pick where you live to tailor region suggestions.
                    </p>
                  </div>

                  {/* Region */}
                  <div className="space-y-2">
                    <Label htmlFor="region" className="text-sm font-medium text-foreground">
                      Region / City
                    </Label>
                    <div className="relative">
                      <Input
                        id="region"
                        name="region"
                        type="text"
                        placeholder={formData.state ? "Start typing your city" : "Select state first"}
                        value={formData.region}
                        onChange={handleRegionInput}
                        onFocus={handleRegionFocus}
                        onBlur={handleRegionBlur}
                        disabled={!formData.state}
                        className="rounded-lg border-border shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      {isRegionFocused && regionSuggestions.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg">
                          {regionSuggestions.map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => handleRegionSuggestionSelect(suggestion)}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Suggestions adapt as you type.
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Information Section */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-6">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-foreground">
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
                      className="rounded-lg border-border shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-foreground">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min 6 characters"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="rounded-lg border-border shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        className="rounded-lg border-border shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(prev => !prev)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical Eligibility Section */}
              <div className="bg-secondary/30 dark:bg-secondary/40 rounded-2xl p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
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
                        className="w-5 h-5 rounded border-border text-primary focus:ring-primary shadow-sm"
                      />
                      <Label
                        htmlFor={item.key}
                        className="text-sm font-normal text-foreground cursor-pointer"
                      >
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* File Upload Section */}
              <div className="bg-accent/30 dark:bg-accent/10 rounded-2xl p-6 border border-accent/40">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <Upload className="w-5 h-5 mr-3 text-primary" />
                  Upload ID Proof
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
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
                    className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-accent rounded-lg cursor-pointer hover:bg-accent/20 transition-colors"
                  >
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium text-foreground">
                        {idProofFileName || "Click to upload or drag and drop"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, JPG, PNG (Max 5MB)
                      </p>
                    </div>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-4 italic">
                  🔒 This will be verified by our staff. Your ID is kept secure and never shared publicly.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 border-t border-border pt-8">
              <Button
                type="submit"
                className="w-full py-6 text-base font-semibold bg-primary text-primary-foreground rounded-lg shadow-lg hover:bg-primary/90 transition-all"
                disabled={loading}
              >
                {loading ? "Submitting Application..." : "Submit Application"}
              </Button>

              {/* Privacy Disclaimer */}
              <p className="text-xs text-center text-muted-foreground leading-relaxed">
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
