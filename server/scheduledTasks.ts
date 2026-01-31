import { eligibilityReminderService } from "./eligibilityReminder";
import { achievementBadgeService } from "./achievementBadges";

export const scheduledTasksService = {
  async initialize() {
    // Initialize scheduled tasks - cron jobs
    console.log("[ScheduledTasks] Service initialized");
  },
};
