import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

type Urgency = "critical" | "high" | "medium" | "low";

interface UrgencyPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (urgency: Urgency) => void;
}

const urgencyOptions: Array<{
  value: Urgency;
  emoji: string;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}> = [
  {
    value: "critical",
    emoji: "🔴",
    label: "Critical",
    description: "Immediate life-threatening emergency",
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950",
  },
  {
    value: "high",
    emoji: "🟠",
    label: "High",
    description: "Needed within a few hours",
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950",
  },
  {
    value: "medium",
    emoji: "🟡",
    label: "Medium",
    description: "Needed within 24 hours",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950",
  },
  {
    value: "low",
    emoji: "🟢",
    label: "Low",
    description: "Planned or non-emergency request",
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950",
  },
];

export function UrgencyPopup({
  open,
  onOpenChange,
  onConfirm,
}: UrgencyPopupProps) {
  const [selectedUrgency, setSelectedUrgency] = useState<Urgency | null>(null);
  const [error, setError] = useState(false);

  const handleConfirm = () => {
    if (!selectedUrgency) {
      setError(true);
      return;
    }
    onConfirm(selectedUrgency);
    setSelectedUrgency(null);
    setError(false);
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setSelectedUrgency(null);
      setError(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select Blood Request Urgency</DialogTitle>
          <DialogDescription>
            Please choose the urgency level to help hospitals and donors respond faster.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={selectedUrgency || ""} onValueChange={(value) => {
            setSelectedUrgency(value as Urgency);
            setError(false);
          }}>
            <div className="space-y-3">
              {urgencyOptions.map((option) => (
                <div key={option.value} className="flex items-start space-x-3">
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="mt-1"
                  />
                  <Label
                    htmlFor={option.value}
                    className={`flex-1 cursor-pointer p-3 rounded-lg border-2 transition-colors ${
                      selectedUrgency === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    } ${option.bgColor}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{option.emoji}</span>
                      <div className="flex-1">
                        <div className={`font-semibold ${option.color}`}>
                          {option.label}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Please select an urgency level before proceeding</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedUrgency}
          >
            Confirm & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
