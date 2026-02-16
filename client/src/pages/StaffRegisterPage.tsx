import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, User, Mail, Phone, Lock, Home, Briefcase, Upload, X, FileText, Building2 } from "lucide-react";

const API_URL = "http://localhost:3001/api";
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
const ALLOWED_FILE_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function StaffRegisterPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Get role from query params, default to "hospital"
  const getInitialRole = () => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get("role");
    return roleParam === "donor" ? "donor" : "hospital";
  };
  
  const [selectedRole, setSelectedRole] = useState<"hospital" | "donor">("hospital");

  useEffect(() => {
    const initialRole = getInitialRole();
    setSelectedRole(initialRole);
  }, []);

  useEffect(() => {
    // If role changes to donor, redirect immediately
    if (selectedRole === "donor") {
      setLocation("/register?role=donor");
    }
  }, [selectedRole, setLocation]);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    staffId: "",
    gender: "male",
    contactNumber: "",
    email: "",
    address: "",
    username: "",
    designation: "nurse",
    hospitalName: "",
    password: "",
    confirmPassword: "",
    staffIdDocument: null as File | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState<string>("");

  const hospitals = [
    { value: "PSG", label: "PSG Hospital" },
    { value: "Karunya", label: "Karunya Hospital" },
    { value: "Amirtha", label: "Amirtha Institute" },
    { value: "NGP", label: "NGP Medical Center" },
  ];

  const designations = [
    { value: "doctor", label: "Doctor" },
    { value: "nurse", label: "Nurse" },
    { value: "technician", label: "Technician" },
    { value: "receptionist", label: "Receptionist" },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, designation: value }));
    if (errors.designation) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.designation;
        return newErrors;
      });
    }
  };

  const handleGenderChange = (value: string) => {
    setFormData((prev) => ({ ...prev, gender: value }));
    if (errors.gender) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.gender;
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      // Check file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setFileError(`Invalid file format. Allowed formats: PDF, JPG, JPEG, PNG`);
        setFormData((prev) => ({ ...prev, staffIdDocument: null }));
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`File size exceeds 5 MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        setFormData((prev) => ({ ...prev, staffIdDocument: null }));
        return;
      }

      setFormData((prev) => ({ ...prev, staffIdDocument: file }));
      setFileError("");
    }
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({ ...prev, staffIdDocument: null }));
    setFileError("");
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let fileValidationError = "";

    // Required field validation
    if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required";
    if (!formData.staffId.trim()) newErrors.staffId = "Staff ID is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.contactNumber.trim())
      newErrors.contactNumber = "Contact Number is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.designation) newErrors.designation = "Designation is required";
    if (!formData.hospitalName) newErrors.hospitalName = "Hospital Name is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Confirm Password is required";

    // File validation
    if (!formData.staffIdDocument) {
      fileValidationError = "Staff ID proof document is required";
    } else {
      const file = formData.staffIdDocument;
      
      // Check file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        fileValidationError = `Invalid file format. Allowed formats: PDF, JPG, JPEG, PNG`;
      }
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        fileValidationError = `File size exceeds 5 MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)} MB`;
      }
    }

    // Email validation
    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = "Please enter a valid email address";
    }

    // Contact number validation (10-15 digits)
    if (
      formData.contactNumber.trim() &&
      !/^\d{10,15}$/.test(formData.contactNumber.replace(/\D/g, ""))
    ) {
      newErrors.contactNumber = "Please enter a valid contact number (10-15 digits)";
    }

    // Username validation
    if (
      formData.username.trim() &&
      formData.username.length < 3
    ) {
      newErrors.username = "Username must be at least 3 characters";
    }

    // Password validation
    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Password match validation
    if (
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    setFileError(fileValidationError);
    return Object.keys(newErrors).length === 0 && !fileValidationError;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // First, register the user account
      const registerResponse = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          role: "hospital",
        }),
      });

      if (!registerResponse.ok) {
        const error = await registerResponse.json();
        throw new Error(error.error || "Registration failed");
      }

      const userData = await registerResponse.json();
      const userId = userData.user?._id || userData.userId;

      // Then, create the staff profile with file upload using FormData
      const staffFormData = new FormData();
      staffFormData.append("userId", userId);
      staffFormData.append("firstName", formData.fullName.split(" ")[0]);
      staffFormData.append("lastName", formData.fullName.split(" ").slice(1).join(" ") || "Staff");
      staffFormData.append("staffId", formData.staffId);
      staffFormData.append("department", "General");
      staffFormData.append("position", formData.designation);
      staffFormData.append("phone", formData.contactNumber);
      staffFormData.append("email", formData.email);
      staffFormData.append("hospitalName", formData.hospitalName);
      
      // Add the file to FormData
      if (formData.staffIdDocument) {
        staffFormData.append("staffIdDocument", formData.staffIdDocument);
      }

      const staffResponse = await fetch(`${API_URL}/staff`, {
        method: "POST",
        body: staffFormData,
      });

      if (!staffResponse.ok) {
        const error = await staffResponse.json();
        throw new Error(error.error || "Failed to create staff profile");
      }

      toast({
        title: "Success",
        description:
          "Staff registration successful! Please verify your email to login.",
      });

      // Store pending verification info
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "lifeflow:pendingVerification",
          JSON.stringify({
            userId,
            email: formData.email,
          })
        );
      }

      // Redirect to email verification page
      setLocation(
        `/verify-email?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(
          formData.email
        )}`
      );
    } catch (error) {
      toast({
        title: "Registration Failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      fullName: "",
      staffId: "",
      gender: "male",
      contactNumber: "",
      email: "",
      address: "",
      username: "",
      designation: "nurse",
      hospitalName: "",
      password: "",
      confirmPassword: "",
      staffIdDocument: null,
    });
    setErrors({});
    setFileError("");
  };

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="min-h-screen py-12 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/5 dark:to-primary/10 rounded-t-2xl">
            <CardTitle className="text-3xl font-bold text-foreground">Staff Registration</CardTitle>
            <CardDescription className="text-base text-muted-foreground mt-2">
              Join our hospital staff network to manage blood inventory
            </CardDescription>
          </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  <SelectItem value="hospital">Hospital Staff</SelectItem>
                  <SelectItem value="donor">Donor</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                {selectedRole === "hospital"
                  ? "Register as hospital staff to manage blood inventory"
                  : "Register as a blood donor to contribute to saving lives"}
              </p>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Full Name *
              </Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`rounded-lg ${errors.fullName ? "border-destructive" : ""}`}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName}</p>
              )}
            </div>

            {/* Staff ID and Gender Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="staffId">Staff ID / Employee ID *</Label>
                <Input
                  id="staffId"
                  name="staffId"
                  type="text"
                  placeholder="EMP001"
                  value={formData.staffId}
                  onChange={handleInputChange}
                  className={`rounded-lg ${errors.staffId ? "border-destructive" : ""}`}
                />
                {errors.staffId && (
                  <p className="text-sm text-destructive">{errors.staffId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Gender *</Label>
                <RadioGroup value={formData.gender} onValueChange={handleGenderChange}>
                  <div className="flex items-center gap-4">
                    {genderOptions.map((option) => (
                      <div key={option.value} className="flex items-center gap-2">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="font-normal cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
                {errors.gender && (
                  <p className="text-sm text-destructive">{errors.gender}</p>
                )}
              </div>
            </div>

            {/* Staff ID Proof Upload */}
            <div className="space-y-2">
              <Label htmlFor="staffIdDocument" className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                Upload Staff ID / Employee ID Proof *
              </Label>
              <div className="flex flex-col gap-4">
                <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary hover:bg-primary/10 transition-all cursor-pointer"
                  onClick={() => document.getElementById("fileInput")?.click()}>
                  <input
                    id="fileInput"
                    type="file"
                    name="staffIdDocument"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">PDF, JPG, JPEG, or PNG (Max 5MB)</p>
                    </div>
                  </div>
                </div>

                {/* File Preview */}
                {formData.staffIdDocument && (
                  <div className="border border-border rounded-lg p-4 bg-muted flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {formData.staffIdDocument.type === "application/pdf" ? (
                        <FileText className="h-5 w-5 text-destructive" />
                      ) : (
                        <div className="h-10 w-10 bg-muted/80 rounded-md flex items-center justify-center text-xs text-muted-foreground">
                          IMG
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {formData.staffIdDocument.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(formData.staffIdDocument.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {fileError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <span className="h-4 w-4 rounded-full bg-destructive text-white flex items-center justify-center text-xs">!</span>
                    {fileError}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Number and Email Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="contactNumber" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  Contact Number (Primary) *
                </Label>
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  className={`rounded-lg ${errors.contactNumber ? "border-destructive" : ""}`}
                />
                {errors.contactNumber && (
                  <p className="text-sm text-destructive">{errors.contactNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`rounded-lg ${errors.email ? "border-destructive" : ""}`}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Residential Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <Home className="h-4 w-4 text-primary" />
                Residential Address *
              </Label>
              <Textarea
                id="address"
                name="address"
                placeholder="Enter your complete residential address..."
                value={formData.address}
                onChange={handleInputChange}
                className={`rounded-lg min-h-[100px] ${errors.address ? "border-destructive" : ""}`}
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address}</p>
              )}
            </div>

            {/* Username and Designation Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="john_staff"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`rounded-lg ${errors.username ? "border-destructive" : ""}`}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Designation / Role *
                </Label>
                <Select value={formData.designation} onValueChange={handleSelectChange}>
                  <SelectTrigger className={`rounded-lg ${errors.designation ? "border-destructive" : ""}`}>
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    {designations.map((designation) => (
                      <SelectItem key={designation.value} value={designation.value}>
                        {designation.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.designation && (
                  <p className="text-sm text-destructive">{errors.designation}</p>
                )}
              </div>
            </div>

            {/* Hospital Name Selection Row */}
            <div className="space-y-2">
              <Label htmlFor="hospitalName" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Hospital Name *
              </Label>
              <Select value={formData.hospitalName} onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, hospitalName: value }));
                if (errors.hospitalName) {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.hospitalName;
                    return newErrors;
                  });
                }
              }}>
                <SelectTrigger className={`rounded-lg ${errors.hospitalName ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Select hospital" />
                </SelectTrigger>
                <SelectContent>
                  {hospitals.map((hospital) => (
                    <SelectItem key={hospital.value} value={hospital.value}>
                      {hospital.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.hospitalName && (
                <p className="text-sm text-destructive">{errors.hospitalName}</p>
              )}
            </div>

            {/* Password and Confirm Password Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Password *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`rounded-lg pr-10 ${errors.password ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`rounded-lg pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <Button
                type="reset"
                variant="outline"
                className="rounded-lg"
                onClick={handleReset}
              >
                Reset
              </Button>
              <Button
                type="submit"
                className="rounded-lg bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? "Registering..." : "Register"}
              </Button>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center text-sm text-muted-foreground border-t border-border bg-muted/20 rounded-b-lg">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:underline font-semibold ml-1">
            Login
          </a>
        </CardFooter>
        </Card>
      </div>
    </div>
  );
}
