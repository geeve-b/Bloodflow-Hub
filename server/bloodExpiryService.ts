import { storage } from "./storage";
import { sendBloodExpiryAlertEmail } from "./email";
import { db } from "./db";
import { ObjectId } from "mongodb";

export interface ExpiryAlertDetails {
  daysRemaining: number;
  alertLevel: "critical" | "warning" | "info";
  bloodType: string;
  quantity: number;
  hospitalName: string;
  expiryDate: Date;
}

/**
 * Blood Expiry Alert Service
 * Handles detection, creation, and notification of blood unit expiry alerts
 */
export class BloodExpiryService {
  private readonly CRITICAL_THRESHOLD = 1; // 1 day or less
  private readonly WARNING_THRESHOLD = 3;  // 3 days or less
  private readonly INFO_THRESHOLD = 7;     // 7 days or less

  /**
   * Check for expiring blood units and create alerts
   * Should be called periodically (e.g., every hour or daily)
   */
  async checkAndCreateAlerts(): Promise<{
    alertsCreated: number;
    alertsUpdated: number;
    emailsSent: number;
  }> {
    try {
      console.log("[BloodExpiryService] Starting expiry check...");

      // Get all expiring inventory
      const expiringAlerts = await storage.checkAndCreateExpiryAlerts();

      console.log(`[BloodExpiryService] Found ${expiringAlerts.length} expiring units`);

      let emailsSent = 0;

      // Send notifications for newly created alerts
      for (const alert of expiringAlerts) {
        const sent = await this.sendAlertNotifications(alert);
        emailsSent += sent;
      }

      return {
        alertsCreated: expiringAlerts.length,
        alertsUpdated: 0,
        emailsSent,
      };
    } catch (error) {
      console.error("[BloodExpiryService] Error in checkAndCreateAlerts:", error);
      throw error;
    }
  }

  /**
   * Send alert notifications to hospital staff
   */
  async sendAlertNotifications(alert: any): Promise<number> {
    try {
      const hospitalId = alert.hospitalId;

      // Get all staff members for this hospital
      const staffMembers = await db
        .collection("staff")
        .find({ hospitalName: alert.hospitalName })
        .toArray();

      if (staffMembers.length === 0) {
        console.log(
          `[BloodExpiryService] No staff found for hospital: ${alert.hospitalName}`
        );
        return 0;
      }

      const emailsSent: Array<{ email: string; staffName: string; sentAt: Date }> = [];
      let successCount = 0;

      for (const staff of staffMembers) {
        try {
          const staffName = `${staff.firstName} ${staff.lastName}`;
          const email = staff.email;

          // Send email notification
          await sendBloodExpiryAlertEmail({
            email,
            staffName,
            alertLevel: alert.alertLevel,
            bloodType: alert.bloodType,
            quantity: alert.quantity,
            daysRemaining: alert.daysRemaining,
            expiryDate: alert.expiryDate,
            hospitalName: alert.hospitalName,
          });

          emailsSent.push({
            email,
            staffName,
            sentAt: new Date(),
          });
          successCount++;

          console.log(
            `[BloodExpiryService] Alert email sent to ${email} for ${alert.bloodType}`
          );
        } catch (error) {
          console.error(
            `[BloodExpiryService] Failed to send email to ${staff.email}:`,
            error
          );
        }
      }

      // Update alert with sent emails
      if (emailsSent.length > 0) {
        await storage.updateBloodExpiryAlert(alert._id, {
          emailsSent,
        });
      }

      return successCount;
    } catch (error) {
      console.error("[BloodExpiryService] Error sending notifications:", error);
      return 0;
    }
  }

  /**
   * Get dashboard summary of all active expiry alerts
   */
  async getAlertSummary(): Promise<{
    criticalAlerts: number;
    warningAlerts: number;
    infoAlerts: number;
    totalAlerts: number;
    affectedBloodTypes: string[];
    affectedHospitals: string[];
  }> {
    try {
      const alerts = await storage.getActiveBloodExpiryAlerts(false);

      const criticalAlerts = alerts.filter((a) => a.alertLevel === "critical").length;
      const warningAlerts = alerts.filter((a) => a.alertLevel === "warning").length;
      const infoAlerts = alerts.filter((a) => a.alertLevel === "info").length;

      const affectedBloodTypes = Array.from(new Set(alerts.map((a) => a.bloodType)));
      const affectedHospitals = Array.from(new Set(alerts.map((a) => a.hospitalName)));

      return {
        criticalAlerts,
        warningAlerts,
        infoAlerts,
        totalAlerts: alerts.length,
        affectedBloodTypes,
        affectedHospitals,
      };
    } catch (error) {
      console.error("[BloodExpiryService] Error getting alert summary:", error);
      throw error;
    }
  }

  /**
   * Get detailed alerts by hospital
   */
  async getHospitalAlerts(hospitalId: string): Promise<any[]> {
    try {
      return await storage.getBloodExpiryAlertsByHospital(hospitalId);
    } catch (error) {
      console.error(
        "[BloodExpiryService] Error getting hospital alerts:",
        error
      );
      throw error;
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    alertId: string,
    userId: string,
    notes?: string
  ): Promise<any> {
    try {
      return await storage.acknowledgeBloodExpiryAlert(alertId, userId, notes);
    } catch (error) {
      console.error("[BloodExpiryService] Error acknowledging alert:", error);
      throw error;
    }
  }

  /**
   * Resolve an alert (mark as handled)
   */
  async resolveAlert(
    alertId: string,
    userId: string,
    notes?: string
  ): Promise<any> {
    try {
      return await storage.resolveBloodExpiryAlert(alertId, userId, notes);
    } catch (error) {
      console.error("[BloodExpiryService] Error resolving alert:", error);
      throw error;
    }
  }

  /**
   * Calculate remaining days for an inventory item
   */
  calculateDaysRemaining(expiryDate: Date): number {
    const now = new Date();
    return Math.ceil(
      (new Date(expiryDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );
  }

  /**
   * Determine alert level based on days remaining
   */
  getAlertLevel(daysRemaining: number): "critical" | "warning" | "info" {
    if (daysRemaining <= this.CRITICAL_THRESHOLD) return "critical";
    if (daysRemaining <= this.WARNING_THRESHOLD) return "warning";
    if (daysRemaining <= this.INFO_THRESHOLD) return "info";
    return "info";
  }

  /**
   * Get alert severity color for UI
   */
  getAlertColor(alertLevel: string): string {
    switch (alertLevel) {
      case "critical":
        return "bg-red-100 border-red-300 text-red-800";
      case "warning":
        return "bg-yellow-100 border-yellow-300 text-yellow-800";
      case "info":
        return "bg-blue-100 border-blue-300 text-blue-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800";
    }
  }

  /**
   * Get alert icon for UI
   */
  getAlertIcon(alertLevel: string): string {
    switch (alertLevel) {
      case "critical":
        return "🚨";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "📋";
    }
  }
}

export const bloodExpiryService = new BloodExpiryService();
