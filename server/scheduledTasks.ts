import { bloodExpiryService } from "./bloodExpiryService";

const EXPIRY_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

async function runExpiryCheck() {
  try {
    const result = await bloodExpiryService.checkAndCreateAlerts();
    console.log(
      `[ScheduledTasks] Expiry check: ${result.alertsCreated} new alert(s), ${result.emailsSent} email(s) sent`,
    );
  } catch (error) {
    console.error("[ERROR] Scheduled expiry check failed:", error);
  }
}

export const scheduledTasksService = {
  /** Checks inventory for blood nearing expiry at startup and every 6 hours. */
  async initialize() {
    if (process.env.DISABLE_SCHEDULED_TASKS === "true") {
      console.log("[ScheduledTasks] Disabled via DISABLE_SCHEDULED_TASKS");
      return;
    }
    setTimeout(runExpiryCheck, 30_000).unref();
    setInterval(runExpiryCheck, EXPIRY_CHECK_INTERVAL_MS).unref();
    console.log("[ScheduledTasks] Blood expiry check scheduled every 6 hours");
  },
};
