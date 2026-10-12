import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Trophy, Clock } from "lucide-react";
import { EligibilityReminders } from "@/components/donor/EligibilityReminders";
import { DonationHistory } from "@/components/donor/DonationHistory";
import { AchievementBadges } from "@/components/donor/AchievementBadges";

interface DonorStats {
  totalDonations: number;
  totalUnitsCollected: number;
  lifesSaved: number;
  eligible: boolean;
  nextEligibleDate: string | null;
}

const fetchJson = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Request failed");
  return response.json();
};

export default function DonorDashboardPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { data: stats } = useQuery({
    queryKey: ["donation-stats", userId],
    queryFn: () => fetchJson<DonorStats>(`/api/donations/stats/${userId}`),
    enabled: Boolean(userId),
  });
  const { data: badgeData } = useQuery({
    queryKey: ["badges", userId],
    queryFn: () => fetchJson<{ badges: unknown[] }>(`/api/badges/${userId}`),
    enabled: Boolean(userId),
  });

  if (!user) return null;

  const nextEligible = stats?.nextEligibleDate ? new Date(stats.nextEligibleDate) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 to-pink-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500" />
            <div>
              <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Achievement</h1>
              <p className="text-sm text-slate-600 dark:text-muted-foreground">
                Welcome back, {user.username || "Donor"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-red-50 dark:bg-slate-800 border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-900 dark:text-white">
                <Heart className="w-4 h-4 text-red-500" />
                Donation Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-700 dark:text-white">
                {!stats ? "…" : stats.eligible ? "Eligible" : "Resting"}
              </p>
              <p className="text-xs text-red-600 dark:text-muted-foreground mt-1">
                {!stats
                  ? "Checking eligibility"
                  : stats.eligible
                    ? "You can donate now"
                    : `Eligible again on ${nextEligible?.toLocaleDateString() ?? "a later date"}`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 dark:bg-slate-800 border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-900 dark:text-white">
                <Trophy className="w-4 h-4 text-amber-500" />
                Badges Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-700 dark:text-white">
                {badgeData ? badgeData.badges.length : "…"}
              </p>
              <p className="text-xs text-amber-600 dark:text-muted-foreground mt-1">
                Check your badges section
              </p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-slate-800 border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-900 dark:text-white">
                <Clock className="w-4 h-4 text-blue-500" />
                Total Donations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-700 dark:text-white">
                {stats ? stats.totalDonations : "…"}
              </p>
              <p className="text-xs text-blue-600 dark:text-muted-foreground mt-1">
                {stats && stats.lifesSaved > 0
                  ? `Up to ${stats.lifesSaved} lives helped`
                  : "View your complete history"}
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

              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    About Eligibility Reminders
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-blue-800 dark:text-blue-200">
                  <p>
                    We'll remind you when you're able to donate again based on your blood type and
                    donation history.
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium text-blue-900 dark:text-white">You'll receive reminders:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>7 days before you become eligible</li>
                      <li>On the day you become eligible</li>
                      <li>During emergency blood shortage situations</li>
                    </ul>
                  </div>
                  <p className="italic text-blue-700 dark:text-blue-300">
                    Reminders are sent via in-app notifications. Make sure to check your reminders
                    regularly!
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Donation History Tab */}
            <TabsContent value="history" className="space-y-6">
              <DonationHistory />

              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    About Your Donation History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-blue-800 dark:text-blue-200">
                  <p>
                    Your complete donation history is maintained for medical and compliance
                    purposes.
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium text-blue-900 dark:text-white">You can:</p>
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

              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    About Achievement Badges
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-blue-800 dark:text-blue-200">
                  <p>
                    Earn badges as you reach milestones in your donation journey. These badges
                    celebrate your commitment to saving lives.
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium text-blue-900 dark:text-white">Featured Badges:</p>
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
                  <p className="italic text-blue-700 dark:text-blue-300">
                    New badges are automatically unlocked and awarded after each successful
                    donation.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center py-6 border-t border-red-200 dark:border-slate-700">
          <p className="text-sm text-slate-700 dark:text-muted-foreground">
            Thank you for being a lifesaver! 🩸 Your donations save lives every day.
          </p>
        </div>
      </div>
    </div>
  );
}
