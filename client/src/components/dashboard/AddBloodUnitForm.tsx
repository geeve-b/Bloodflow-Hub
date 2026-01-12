import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Droplets, Plus } from "lucide-react";

const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const API_URL = "http://localhost:3001/api";

interface AddBloodUnitFormProps {
  hospitalId: string;
  onSuccess?: () => void;
}

export function AddBloodUnitForm({ hospitalId, onSuccess }: AddBloodUnitFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bloodType: "O+",
    quantity: "1",
    expiryDate: "",
    status: "available" as "available" | "reserved" | "expired",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.bloodType) {
      toast({
        title: "Error",
        description: "Please select a blood type",
        variant: "destructive",
      });
      return false;
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Error",
        description: "Quantity must be a positive number",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.expiryDate) {
      toast({
        title: "Error",
        description: "Please select an expiry date",
        variant: "destructive",
      });
      return false;
    }

    const expiryDate = new Date(formData.expiryDate);
    const today = new Date();
    if (expiryDate <= today) {
      toast({
        title: "Error",
        description: "Expiry date must be in the future",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/blood-inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hospitalId,
          bloodType: formData.bloodType,
          quantity: parseInt(formData.quantity),
          expiryDate: new Date(formData.expiryDate),
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add blood unit");
      }

      const data = await response.json();
      
      toast({
        title: "Success",
        description: `Added ${formData.quantity} units of ${formData.bloodType} blood successfully`,
      });

      setOpen(false);
      setFormData({
        bloodType: "O+",
        quantity: "1",
        expiryDate: "",
        status: "available",
      });

      onSuccess?.();
    } catch (error) {
      console.error("Error adding blood unit:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add blood unit",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="gap-2 bg-emerald-600 hover:bg-emerald-700"
      >
        <Plus className="h-4 w-4" />
        Add Blood Unit
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-red-600" />
              Add Blood Unit to Inventory
            </DialogTitle>
            <DialogDescription>
              Manually add a new blood unit to your hospital's inventory
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Blood Type */}
            <div className="space-y-2">
              <Label htmlFor="bloodType" className="text-sm font-semibold">
                Blood Type <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.bloodType} onValueChange={(value) => handleInputChange("bloodType", value)}>
                <SelectTrigger id="bloodType">
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      <span className="font-bold text-primary">{type}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-semibold">
                Quantity (Units) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                step="1"
                placeholder="Enter quantity"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                className="border-primary/20 focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">
                Number of blood units to add
              </p>
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label htmlFor="expiryDate" className="text-sm font-semibold">
                Expiry Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="expiryDate"
                type="date"
                min={getTodayDateString()}
                value={formData.expiryDate}
                onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                className="border-primary/20 focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">
                Date when the blood will expire
              </p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-semibold">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  handleInputChange(
                    "status",
                    value as "available" | "reserved" | "expired"
                  )
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                      Available
                    </span>
                  </SelectItem>
                  <SelectItem value="reserved">
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-yellow-500"></span>
                      Reserved
                    </span>
                  </SelectItem>
                  <SelectItem value="expired">
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
                      Expired
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Current status of the blood unit
              </p>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p className="text-sm font-semibold text-blue-900">
                Summary:
              </p>
              <p className="text-sm text-blue-800 mt-1">
                Adding <span className="font-bold">{formData.quantity}</span> unit(s) of{" "}
                <span className="font-bold text-primary">{formData.bloodType}</span> blood
                {formData.expiryDate && (
                  <>
                    {" "}
                    expiring on{" "}
                    <span className="font-semibold">
                      {new Date(formData.expiryDate).toLocaleDateString()}
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Blood Unit"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
