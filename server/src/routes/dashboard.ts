import { Router } from "express";
import prisma from "../lib/prisma";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { ApplicationStatus } from "../generated/prisma/client";

const router = Router();

// Stats
router.get("/stats", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);

    const day = startOfWeek.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);

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

    const responseStatuses = new Set<ApplicationStatus>([
      ApplicationStatus.ASSESSMENT,
      ApplicationStatus.PHONE_SCREEN,
      ApplicationStatus.INTERVIEW,
      ApplicationStatus.FINAL_INTERVIEW,
      ApplicationStatus.OFFER,
      ApplicationStatus.REJECTED,
    ]);

    const interviewStatuses = new Set<ApplicationStatus>([
      ApplicationStatus.PHONE_SCREEN,
      ApplicationStatus.INTERVIEW,
      ApplicationStatus.FINAL_INTERVIEW,
      ApplicationStatus.OFFER,
    ]);

    const respondedApplications = applications.filter((application) =>
      responseStatuses.has(application.status),
    ).length;

    const interviewApplications = applications.filter((application) =>
      interviewStatuses.has(application.status),
    ).length;

    const responseRate =
      totalApplications === 0
        ? 0
        : Number(
            ((respondedApplications / totalApplications) * 100).toFixed(1),
          );

    const interviewConversionRate =
      totalApplications === 0
        ? 0
        : Number(
            ((interviewApplications / totalApplications) * 100).toFixed(1),
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
    console.error(error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

// DASHBOARD OVERVIEW
router.get("/overview", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const now = new Date();

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
    console.error(error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

// ANALYTICS
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

    // Status distribution
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

    // Applications over time
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

    // Application sources
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

    // Rates
    const interviewStatuses = new Set<ApplicationStatus>([
      ApplicationStatus.PHONE_SCREEN,
      ApplicationStatus.INTERVIEW,
      ApplicationStatus.FINAL_INTERVIEW,
      ApplicationStatus.OFFER,
    ]);

    const interviewCount = applications.filter((application) =>
      interviewStatuses.has(application.status),
    ).length;

    const rejectionCount = applications.filter(
      (application) => application.status === ApplicationStatus.REJECTED,
    ).length;

    const offerCount = applications.filter(
      (application) => application.status === ApplicationStatus.OFFER,
    ).length;

    const interviewRate =
      totalApplications === 0
        ? 0
        : Number(((interviewCount / totalApplications) * 100).toFixed(1));

    const rejectionRate =
      totalApplications === 0
        ? 0
        : Number(((rejectionCount / totalApplications) * 100).toFixed(1));

    const offerRate =
      totalApplications === 0
        ? 0
        : Number(((offerCount / totalApplications) * 100).toFixed(1));

    // Average response time
    // For now, this uses the time from appliedDate to the
    // first recorded non-initial activity that looks like a response.
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
    console.error(error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

export default router;
