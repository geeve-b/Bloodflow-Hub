import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, AlertCircle, CheckCircle, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Reminder {
  _id: string;
  donorId: string;
  reminderType: "pre_eligibility" | "eligibility_reached" | "emergency";
  scheduledFor: string;
  message: string;
  nextEligibleDate: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  createdAt: string;
}

export function EligibilityReminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchReminders = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/eligibility/reminders/${user.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch reminders");
        }
        const data = await response.json();
        setReminders(data.reminders || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reminders");
        setReminders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReminders();
  }, [user]);

  const handleAcknowledge = async (reminderId: string) => {
    try {
      const response = await fetch(`/api/eligibility/reminders/${reminderId}/acknowledge`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to acknowledge reminder");
      }

      setReminders(
        reminders.map((r) =>
          r._id === reminderId
            ? { ...r, acknowledged: true, acknowledgedAt: new Date().toISOString() }
            : r
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to acknowledge reminder");
    }
  };

  const getReminderIcon = (type: Reminder["reminderType"]) => {
    switch (type) {
      case "pre_eligibility":
        return <Clock className="w-4 h-4" />;
      case "eligibility_reached":
        return <CheckCircle className="w-4 h-4" />;
      case "emergency":
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getReminderBadgeVariant = (
    type: Reminder["reminderType"]
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case "pre_eligibility":
        return "outline";
      case "eligibility_reached":
        return "default";
      case "emergency":
        return "destructive";
    }
  };

  const getReminderLabel = (type: Reminder["reminderType"]) => {
    switch (type) {
      case "pre_eligibility":
        return "Coming Soon";
      case "eligibility_reached":
        return "You're Eligible!";
      case "emergency":
        return "Emergency Alert";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Eligibility Reminders
          </CardTitle>
          <CardDescription>Track when you can donate again</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading reminders...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Eligibility Reminders
        </CardTitle>
        <CardDescription>Track when you can donate again</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {reminders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No reminders at this time</p>
            <p className="text-sm">You'll see reminders 7 days before and when you're eligible to donate</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div
                key={reminder._id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex gap-3 flex-1">
                  <div className="mt-1 text-muted-foreground">
                    {getReminderIcon(reminder.reminderType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{reminder.message}</span>
                      <Badge variant={getReminderBadgeVariant(reminder.reminderType)}>
                        {getReminderLabel(reminder.reminderType)}
                      </Badge>
                      {reminder.acknowledged && (
                        <Badge variant="secondary" className="ml-auto">
                          ✓ Acknowledged
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Next eligible: {new Date(reminder.nextEligibleDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Reminder scheduled for: {new Date(reminder.scheduledFor).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {!reminder.acknowledged && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAcknowledge(reminder._id)}
                    className="ml-2"
                  >
                    Acknowledge
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Donation Cooldown Periods
          </h4>
          <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
            <li>🩸 Whole Blood: 90 days</li>
            <li>🩸 Platelets: 15 days</li>
            <li>🩸 Plasma: 48 hours</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
