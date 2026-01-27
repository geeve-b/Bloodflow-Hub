import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Trophy, Clock, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EligibilityReminders } from "@/components/donor/EligibilityReminders";
import { DonationHistory } from "@/components/donor/DonationHistory";
import { AchievementBadges } from "@/components/donor/AchievementBadges";

export default function DonorDashboardPage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect if not logged in or not a donor
    if (!user) {
      setLocation("/login");
      return;
    }

    if (user.role !== "donor" && user.role !== "receiver") {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  if (!user || (user.role !== "donor" && user.role !== "receiver")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500" />
              <div>
                <h1 className="text-2xl font-bold">Donor Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome, {user.username || "Donor"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                Donation Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Eligible</p>
              <p className="text-xs text-muted-foreground mt-1">
                You can donate now
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Badges Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">--</p>
              <p className="text-xs text-muted-foreground mt-1">
                Check your badges section
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Total Donations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">--</p>
              <p className="text-xs text-muted-foreground mt-1">
                View your complete history
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="reminders" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="reminders" className="gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Reminders</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Badges</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            {/* Eligibility Reminders Tab */}
            <TabsContent value="reminders" className="space-y-6">
              <EligibilityReminders />

              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-base">About Eligibility Reminders</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    We'll remind you when you're able to donate again based on your blood type and
                    donation history.
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">You'll receive reminders:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>7 days before you become eligible</li>
                      <li>On the day you become eligible</li>
                      <li>During emergency blood shortage situations</li>
                    </ul>
                  </div>
                  <p className="italic">
                    Reminders are sent via in-app notifications. Make sure to check your reminders
                    regularly!
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Donation History Tab */}
            <TabsContent value="history" className="space-y-6">
              <DonationHistory />

              <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                <CardHeader>
                  <CardTitle className="text-base">About Your Donation History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    Your complete donation history is maintained for medical and compliance
                    purposes.
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">You can:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>View all your past donations with details</li>
                      <li>Filter donations by year, location, or status</li>
                      <li>Download certificates for completed donations</li>
                      <li>See how many lives you've helped save</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Achievement Badges Tab */}
            <TabsContent value="badges" className="space-y-6">
              <AchievementBadges />

              <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="text-base">About Achievement Badges</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    Earn badges as you reach milestones in your donation journey. These badges
                    celebrate your commitment to saving lives.
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Featured Badges:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        <span className="font-medium">🩸 First Drop</span> - Your first donation
                      </li>
                      <li>
                        <span className="font-medium">💪 Lifesaver</span> - 5 donations completed
                      </li>
                      <li>
                        <span className="font-medium">🏆 Hero</span> - 10 donations completed
                      </li>
                      <li>
                        <span className="font-medium">🔥 Consistent</span> - 3 donations in a year
                      </li>
                      <li>
                        <span className="font-medium">🚑 Emergency Helper</span> - Emergency
                        donation
                      </li>
                    </ul>
                  </div>
                  <p className="italic">
                    New badges are automatically unlocked and awarded after each successful
                    donation.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center py-6 border-t">
          <p className="text-sm text-muted-foreground">
            Thank you for being a lifesaver! 🩸 Your donations save lives every day.
          </p>
        </div>
      </div>
    </div>
  );
}
