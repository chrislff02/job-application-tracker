import { Router } from "express";
import prisma from "../lib/prisma";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { ApplicationStatus } from "../generated/prisma/client";

const router = Router();

router.get(
  "/stats",
  authenticateToken,
  async (req: AuthRequest, res) => {
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
        responseStatuses.has(application.status)
      ).length;

      const interviewApplications = applications.filter((application) =>
        interviewStatuses.has(application.status)
      ).length;

      const responseRate =
        totalApplications === 0
          ? 0
          : Number(
              ((respondedApplications / totalApplications) * 100).toFixed(1)
            );

      const interviewConversionRate =
        totalApplications === 0
          ? 0
          : Number(
              ((interviewApplications / totalApplications) * 100).toFixed(1)
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
  }
);

export default router;