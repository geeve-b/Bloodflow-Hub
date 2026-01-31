import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy, Star, AlertCircle, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AchievementBadge {
  _id: string;
  donorId: string;
  badgeId: string;
  badgeName: string;
  badgeEmoji: string;
  description: string;
  rule: string;
  unlockedAt: string;
  viewed: boolean;
}

interface BadgeDefinition {
  _id: string;
  name: string;
  emoji: string;
  description: string;
  rule: string;
  condition: string;
  difficulty: "easy" | "medium" | "hard";
}

export function AchievementBadges() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<AchievementBadge[]>([]);
  const [allBadgeDefinitions, setAllBadgeDefinitions] = useState<BadgeDefinition[]>([]);
  const [newBadges, setNewBadges] = useState<AchievementBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchBadges = async () => {
      try {
        setLoading(true);

        // Fetch badge definitions
        const defsResponse = await fetch("/api/badges/definitions");
        if (!defsResponse.ok) {
          throw new Error("Failed to fetch badge definitions");
        }
        const defsData = await defsResponse.json();
        setAllBadgeDefinitions(defsData.badges || []);

        // Fetch donor's badges
        const badgesResponse = await fetch(`/api/badges/${user.id}`);
        if (!badgesResponse.ok) {
          throw new Error("Failed to fetch badges");
        }
        const badgesData = await badgesResponse.json();
        setBadges(badgesData.badges || []);

        // Fetch new badges
        const newBadgesResponse = await fetch(`/api/badges/${user.id}/new`);
        if (!newBadgesResponse.ok) {
          throw new Error("Failed to fetch new badges");
        }
        const newBadgesData = await newBadgesResponse.json();
        setNewBadges(newBadgesData.newBadges || []);

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load badges");
        setBadges([]);
        setAllBadgeDefinitions([]);
        setNewBadges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [user]);

  const handleBadgeView = async (badgeId: string) => {
    try {
      const response = await fetch(`/api/badges/${badgeId}/view`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to mark badge as viewed");
      }

      setBadges(
        badges.map((b) => (b._id === badgeId ? { ...b, viewed: true } : b))
      );
      setNewBadges(newBadges.filter((b) => b._id !== badgeId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update badge view");
    }
  };

  const unlockedBadgeIds = new Set(badges.map((b) => b.badgeId));
  const lockedBadges = allBadgeDefinitions.filter((d) => !unlockedBadgeIds.has(d._id));

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300";
      case "medium":
        return "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300";
      case "hard":
        return "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-950";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Achievement Badges
          </CardTitle>
          <CardDescription>Unlock badges as you donate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading badges...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Achievement Badges
        </CardTitle>
        <CardDescription>
          Unlock badges as you donate and contribute to saving lives
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* New Badges Alert */}
        {newBadges.length > 0 && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <Star className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              🎉 You've unlocked {newBadges.length} new badge{newBadges.length !== 1 ? "s" : ""}!
            </AlertDescription>
          </Alert>
        )}

        {/* Unlocked Badges */}
        {badges.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Unlocked Badges ({badges.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge) => (
                <div
                  key={badge._id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${
                    newBadges.some((b) => b._id === badge._id)
                      ? "border-green-400 bg-green-50 dark:bg-green-950"
                      : "border-primary bg-card"
                  }`}
                  onClick={() => {
                    if (!badge.viewed && newBadges.some((b) => b._id === badge._id)) {
                      handleBadgeView(badge._id);
                    }
                  }}
                >
                  <div className="text-center">
                    <div className="text-5xl mb-3">{badge.badgeEmoji}</div>
                    <h4 className="font-bold text-lg">{badge.badgeName}</h4>
                    <p className="text-sm text-muted-foreground mt-2">{badge.description}</p>
                    <p className="text-xs text-muted-foreground mt-3">
                      Unlocked: {new Date(badge.unlockedAt).toLocaleDateString()}
                    </p>
                    {!badge.viewed && newBadges.some((b) => b._id === badge._id) && (
                      <div className="mt-3 px-2 py-1 bg-green-200 dark:bg-green-800 rounded text-xs font-medium text-green-800 dark:text-green-200">
                        ✨ New!
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locked Badges */}
        {lockedBadges.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Locked Badges ({lockedBadges.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lockedBadges.map((badge) => (
                <div
                  key={badge._id}
                  className={`p-4 rounded-lg border-2 border-dashed opacity-60 ${getDifficultyColor(
                    badge.difficulty
                  )}`}
                >
                  <div className="text-center">
                    <div className="text-5xl mb-3 opacity-50">🔒</div>
                    <h4 className="font-bold text-lg">{badge.name}</h4>
                    <p className="text-sm mt-2">{badge.description}</p>
                    <div className="mt-3">
                      <Badge variant="outline" className="text-xs">
                        {badge.difficulty.charAt(0).toUpperCase() + badge.difficulty.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-xs mt-3 font-medium">{badge.condition}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {badges.length === 0 && lockedBadges.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">No badges available</p>
            <p className="text-sm">Check back soon for achievement badges</p>
          </div>
        )}

        {/* Badge Info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Star className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Badge Rules
          </h4>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <span className="font-medium">🩸 First Drop</span> - Complete your first donation
            </div>
            <div>
              <span className="font-medium">💪 Lifesaver</span> - Complete 5 donations
            </div>
            <div>
              <span className="font-medium">🏆 Hero</span> - Complete 10 donations
            </div>
            <div>
              <span className="font-medium">🔥 Consistent</span> - 3 donations within 1 year
            </div>
            <div>
              <span className="font-medium">🚑 Emergency Helper</span> - Donate during an emergency
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            ✅ How Badges Work
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Badges are automatically awarded after each donation. They recognize your contribution to
            saving lives and building a strong donor community. Collect them all!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
