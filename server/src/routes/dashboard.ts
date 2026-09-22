import { Router } from "express";
import prisma from "../lib/prisma";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { ApplicationStatus } from "../generated/prisma/client";

const router = Router();

const RESPONSE_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.ASSESSMENT,
  ApplicationStatus.PHONE_SCREEN,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.FINAL_INTERVIEW,
  ApplicationStatus.OFFER,
  ApplicationStatus.REJECTED,
]);

const INTERVIEW_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.PHONE_SCREEN,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.FINAL_INTERVIEW,
  ApplicationStatus.OFFER,
]);

function calculatePercentage(count: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Number(((count / total) * 100).toFixed(1));
}

// Dashboard Stats
router.get("/stats", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // Calculate Monday at midnight for current local server week
    const startOfWeek = new Date();

    startOfWeek.setHours(0, 0, 0, 0);

    const currentDay = startOfWeek.getDay();
    const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;

    startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday);

    // These queries are independent, so run them in parallel
    const [
      totalApplications,
      applicationsThisWeek,
      interviewStageCount,
      offers,
      applications,
    ] = await Promise.all([
      prisma.application.count({
        where: {
          userId,
        },
      }),

      prisma.application.count({
        where: {
          userId,
          createdAt: {
            gte: startOfWeek,
          },
        },
      }),

      prisma.application.count({
        where: {
          userId,
          status: {
            in: [
              ApplicationStatus.PHONE_SCREEN,
              ApplicationStatus.INTERVIEW,
              ApplicationStatus.FINAL_INTERVIEW,
            ],
          },
        },
      }),

      prisma.application.count({
        where: {
          userId,
          status: ApplicationStatus.OFFER,
        },
      }),

      prisma.application.findMany({
        where: {
          userId,
        },
        select: {
          status: true,
        },
      }),
    ]);

    // These describe apps based on their current status
    // rather than their complete status history
    const respondedApplications = applications.filter((application) =>
      RESPONSE_STATUSES.has(application.status),
    ).length;

    const interviewApplications = applications.filter((application) =>
      INTERVIEW_STATUSES.has(application.status),
    ).length;

    const responseRate = calculatePercentage(
      respondedApplications,
      totalApplications,
    );

    const interviewConversionRate = calculatePercentage(
      interviewApplications,
      totalApplications,
    );

    return res.json({
      totalApplications,
      applicationsThisWeek,
      interviews: interviewStageCount,
      offers,
      responseRate,
      interviewConversionRate,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

// Dashboard Overview
router.get("/overview", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const now = new Date();

    // Load the 2 dashboard sections together so that neither
    // query depends on the result of the other
    const [recentApplications, upcomingInterviews] = await Promise.all([
      prisma.application.findMany({
        where: {
          userId,
        },
        select: {
          id: true,
          company: true,
          position: true,
          status: true,
          location: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),

      prisma.interview.findMany({
        where: {
          application: {
            userId,
          },
          dateTime: {
            gte: now,
          },
        },
        select: {
          id: true,
          type: true,
          dateTime: true,
          interviewer: true,
          application: {
            select: {
              id: true,
              company: true,
              position: true,
            },
          },
        },
        orderBy: {
          dateTime: "asc",
        },
        take: 5,
      }),
    ]);

    return res.json({
      recentApplications,
      upcomingInterviews,
    });
  } catch (error) {
    console.error("Get dashboard overview error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

// Analytics
router.get("/analytics", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const applications = await prisma.application.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        status: true,
        source: true,
        createdAt: true,
        appliedDate: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const totalApplications = applications.length;

    // Count how many apps currently belong to each status
    const statusCounts = new Map<ApplicationStatus, number>();

    for (const application of applications) {
      statusCounts.set(
        application.status,
        (statusCounts.get(application.status) ?? 0) + 1,
      );
    }

    const statusDistribution = Array.from(statusCounts.entries()).map(
      ([status, count]) => ({
        status,
        count,
      }),
    );

    // Group apps by date they were added to the tracker
    const applicationsByDate = new Map<string, number>();

    for (const application of applications) {
      const date = application.createdAt.toISOString().split("T")[0];

      applicationsByDate.set(date, (applicationsByDate.get(date) ?? 0) + 1);
    }

    const applicationsOverTime = Array.from(applicationsByDate.entries()).map(
      ([date, count]) => ({
        date,
        count,
      }),
    );

    // Group appss by source, Missing sources are displayed
    // under "Unknown" instead of being excluded
    const sourceCounts = new Map<string, number>();

    for (const application of applications) {
      const source = application.source || "Unknown";

      sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
    }

    const applicationSources = Array.from(sourceCounts.entries()).map(
      ([source, count]) => ({
        source,
        count,
      }),
    );

    // These rates use each app's current status
    const interviewCount = applications.filter((application) =>
      INTERVIEW_STATUSES.has(application.status),
    ).length;

    const rejectionCount = applications.filter(
      (application) => application.status === ApplicationStatus.REJECTED,
    ).length;

    const offerCount = applications.filter(
      (application) => application.status === ApplicationStatus.OFFER,
    ).length;

    const interviewRate = calculatePercentage(
      interviewCount,
      totalApplications,
    );

    const rejectionRate = calculatePercentage(
      rejectionCount,
      totalApplications,
    );

    const offerRate = calculatePercentage(offerCount, totalApplications);

    // Approximate response time using earliest relevant activity
    // recorded after the app's applied date
    //
    // STATUS_CHANGED is a proxy for an employer response because
    // activity records currently don't store destination status
    // as a separate structured field
    const responseActivities = await prisma.applicationActivity.findMany({
      where: {
        application: {
          userId,
        },
        type: {
          in: ["STATUS_CHANGED", "INTERVIEW_CREATED"],
        },
      },
      select: {
        applicationId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Keep only earliest possible response activity for
    // each app
    const firstResponseByApplication = new Map<number, Date>();

    for (const activity of responseActivities) {
      if (!firstResponseByApplication.has(activity.applicationId)) {
        firstResponseByApplication.set(
          activity.applicationId,
          activity.createdAt,
        );
      }
    }

    const responseTimesInDays: number[] = [];

    for (const application of applications) {
      if (!application.appliedDate) {
        continue;
      }

      const firstResponse = firstResponseByApplication.get(application.id);

      if (!firstResponse) {
        continue;
      }

      const differenceMs =
        firstResponse.getTime() - application.appliedDate.getTime();

      // Ignore impossible negative response times, could happen
      // if app's applied date is edited after activity exists
      if (differenceMs >= 0) {
        responseTimesInDays.push(differenceMs / (1000 * 60 * 60 * 24));
      }
    }

    const averageResponseTimeDays =
      responseTimesInDays.length === 0
        ? 0
        : Number(
            (
              responseTimesInDays.reduce((sum, days) => sum + days, 0) /
              responseTimesInDays.length
            ).toFixed(1),
          );

    return res.json({
      applicationsOverTime,
      applicationSources,
      statusDistribution,
      interviewRate,
      rejectionRate,
      offerRate,
      averageResponseTimeDays,
    });
  } catch (error) {
    console.error("Get analytics error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

export default router;
