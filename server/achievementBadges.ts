import { donationHistoryService } from "./donationHistory";

interface BadgeDefinition {
  _id: string;
  name: string;
  emoji: string;
  description: string;
  rule: string;
  condition: string;
  difficulty: "easy" | "medium" | "hard";
  /** Number of donations needed to unlock the badge. */
  donations: number;
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { _id: "first-drop", name: "First Drop", emoji: "🩸", description: "Made your first blood donation", rule: "donations >= 1", condition: "Donate once", difficulty: "easy", donations: 1 },
  { _id: "regular-donor", name: "Regular Donor", emoji: "💪", description: "Donated blood three times", rule: "donations >= 3", condition: "Donate 3 times", difficulty: "easy", donations: 3 },
  { _id: "life-saver", name: "Life Saver", emoji: "❤️", description: "Donated blood five times", rule: "donations >= 5", condition: "Donate 5 times", difficulty: "medium", donations: 5 },
  { _id: "hero", name: "Blood Hero", emoji: "🦸", description: "Donated blood ten times", rule: "donations >= 10", condition: "Donate 10 times", difficulty: "hard", donations: 10 },
  { _id: "legend", name: "Legend", emoji: "🏆", description: "Donated blood twenty-five times", rule: "donations >= 25", condition: "Donate 25 times", difficulty: "hard", donations: 25 },
];

// Badges are derived from recorded donations, so they can never drift out of sync.
export const achievementBadgeService = {
  async getBadgeDefinitions() {
    return BADGE_DEFINITIONS.map(({ donations: _donations, ...definition }) => definition);
  },

  async getDonorBadges(donorUserId: string) {
    // Oldest first, so the nth donation is the one that unlocked the badge
    const history = (await donationHistoryService.getDonationHistory(donorUserId)).reverse();
    return BADGE_DEFINITIONS.filter((badge) => history.length >= badge.donations).map((badge) => ({
      _id: `${donorUserId}-${badge._id}`,
      donorId: donorUserId,
      badgeId: badge._id,
      badgeName: badge.name,
      badgeEmoji: badge.emoji,
      description: badge.description,
      rule: badge.rule,
      unlockedAt: history[badge.donations - 1].donationDate,
      viewed: true,
    }));
  },
};
