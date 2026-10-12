import { useState } from "react";
import { HeartHandshake, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";

const today = () => new Date().toISOString().split("T")[0];

/** Lets hospital staff log a donation; the units are added to the hospital's inventory. */
export function RecordDonationDialog({ onRecorded }: { onRecorded: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [donorIdentifier, setDonorIdentifier] = useState("");
  const [units, setUnits] = useState("1");
  const [donationDate, setDonationDate] = useState(today);

  const reset = () => {
    setDonorIdentifier("");
    setUnits("1");
    setDonationDate(today());
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/donations/record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorIdentifier, units: Number(units), donationDate }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || "Failed to record donation");
      }
      toast({
        title: "Donation recorded",
        description: `${body.donation.unitsCollected} unit(s) of ${body.donation.bloodType} from ${body.donation.donorName} added to inventory.`,
      });
      reset();
      setOpen(false);
      onRecorded();
    } catch (error) {
      toast({
        title: "Could not record donation",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <HeartHandshake className="h-4 w-4 mr-2" />
        Record Donation
      </Button>
      <Dialog open={open} onOpenChange={(next) => !saving && setOpen(next)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Record a donation</DialogTitle>
              <DialogDescription>
                Log blood collected from a registered donor. The units are added to your inventory
                and the donor's history, badges and eligibility update automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="donor-identifier">Donor email or username</Label>
              <Input
                id="donor-identifier"
                value={donorIdentifier}
                onChange={(e) => setDonorIdentifier(e.target.value)}
                placeholder="donor@example.com"
                autoComplete="off"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="donation-units">Units</Label>
                <Input
                  id="donation-units"
                  type="number"
                  min={1}
                  max={2}
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="donation-date">Date</Label>
                <Input
                  id="donation-date"
                  type="date"
                  max={today()}
                  value={donationDate}
                  onChange={(e) => setDonationDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !donorIdentifier.trim()}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Record donation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
