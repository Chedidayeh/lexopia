import { inngest } from "@/src/lib/inngest/client";
import { INNGEST_EVENTS } from "@/src/lib/inngest/events";
import { prisma } from "@/src/lib/prisma";
import { sendParentReadingReminderEmail } from "@/src/lib/notifications/parent-generation-notifications";

function getDaysThreshold(storiesPerWeek: number): number {
  if (storiesPerWeek >= 7) return 1; // Daily readers - remind after 1 day
  if (storiesPerWeek >= 3) return 2; // 3x/week - remind after 2 days
  return 5; // 1x/week - remind after 5 days
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const readingReminderFunction = inngest.createFunction(
  {
    id: "reading-reminder-check",
    retries: 2,
    triggers: [
      {
        cron: "0 9 * * *", // 9 AM UTC daily
      },
    ],
  },
  async ({ runId }) => {
    const now = new Date();
    const startOfWeek = getStartOfWeek(now);

    // Get all children with notifications enabled
    const children = await prisma.child.findMany({
      where: {
        activateNotifications: true,
        onboardingCompletedAt: { not: null }, // Only onboarded children
      },
      select: {
        id: true,
        name: true,
        storiesPerWeek: true,
        dailyActivity: {
          select: {
            lastActiveAt: true,
            lastReminderSentAt: true,
          },
        },
      },
    });

    const remindersSent: string[] = [];

    for (const child of children) {
      const { id: childId, storiesPerWeek, dailyActivity } = child;
      const lastActiveAt = dailyActivity?.lastActiveAt;
      const lastReminderSentAt = dailyActivity?.lastReminderSentAt;

      // Calculate days since last activity
      const daysSinceLastActivity = lastActiveAt
        ? Math.floor((now.getTime() - lastActiveAt.getTime()) / (1000 * 60 * 60 * 24))
        : Infinity; // Never read

      // Get threshold based on stories per week
      const threshold = getDaysThreshold(storiesPerWeek);

      // Check if reminder already sent this week
      const reminderSentThisWeek = lastReminderSentAt
        ? getStartOfWeek(lastReminderSentAt).getTime() === startOfWeek.getTime()
        : false;

      // Send reminder if:
      // 1. Days since last activity exceeds threshold
      // 2. No reminder sent this week
      if (daysSinceLastActivity >= threshold && !reminderSentThisWeek) {
        const result = await sendParentReadingReminderEmail(childId);

        if (result.success) {
          // Update last reminder timestamp
          await prisma.childDailyActivity.update({
            where: { childId },
            data: { lastReminderSentAt: now },
          });
          remindersSent.push(childId);
        }
      }
    }

    return {
      success: true,
      childrenChecked: children.length,
      remindersSent: remindersSent.length,
      reminderChildIds: remindersSent,
    };
  },
);
