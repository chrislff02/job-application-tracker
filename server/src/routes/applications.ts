import { Router } from "express";
import prisma from "../lib/prisma";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { ApplicationStatus } from "../generated/prisma/client";

const router = Router();

const validStatuses = Object.values(ApplicationStatus);

// CREATE APPLICATION
router.post(
  "/",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const {
        company,
        position,
        status,
        appliedDate,
        location,
        salary,
        source,
        jobUrl,
        notes,
        recruiterName,
        recruiterEmail,
      } = req.body;

      if (!company || !position) {
        return res.status(400).json({
          message: "Company and position are required",
        });
      }

      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid application status",
        });
      }

      const application = await prisma.application.create({
        data: {
          userId,
          company,
          position,
          status: status ?? ApplicationStatus.SAVED,
          appliedDate: appliedDate ? new Date(appliedDate) : null,
          location: location || null,
          salary: salary || null,
          source: source || null,
          jobUrl: jobUrl || null,
          notes: notes || null,
          recruiterName: recruiterName || null,
          recruiterEmail: recruiterEmail || null,
        },
      });

      return res.status(201).json({
        message: "Application created successfully",
        application,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Something went wrong",
      });
    }
  }
);

// GET ALL APPLICATIONS FOR LOGGED-IN USER
router.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res) => {
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
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.json({
        applications,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Something went wrong",
      });
    }
  }
);

// GET ONE APPLICATION
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      const applicationId = Number(req.params.id);

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      if (Number.isNaN(applicationId)) {
        return res.status(400).json({
          message: "Invalid application id",
        });
      }

      const application = await prisma.application.findFirst({
        where: {
          id: applicationId,
          userId,
        },
      });

      if (!application) {
        return res.status(404).json({
          message: "Application not found",
        });
      }

      return res.json({
        application,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Something went wrong",
      });
    }
  }
);

// UPDATE APPLICATION
router.put(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      const applicationId = Number(req.params.id);

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      if (Number.isNaN(applicationId)) {
        return res.status(400).json({
          message: "Invalid application id",
        });
      }

      const existingApplication = await prisma.application.findFirst({
        where: {
          id: applicationId,
          userId,
        },
      });

      if (!existingApplication) {
        return res.status(404).json({
          message: "Application not found",
        });
      }

      const {
        company,
        position,
        status,
        appliedDate,
        location,
        salary,
        source,
        jobUrl,
        notes,
        recruiterName,
        recruiterEmail,
      } = req.body;

      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid application status",
        });
      }

      const application = await prisma.application.update({
        where: {
          id: applicationId,
        },
        data: {
          company,
          position,
          status,
          appliedDate:
            appliedDate === undefined
              ? undefined
              : appliedDate
                ? new Date(appliedDate)
                : null,
          location,
          salary,
          source,
          jobUrl,
          notes,
          recruiterName,
          recruiterEmail,
        },
      });

      return res.json({
        message: "Application updated successfully",
        application,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Something went wrong",
      });
    }
  }
);

// DELETE APPLICATION
router.delete(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      const applicationId = Number(req.params.id);

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      if (Number.isNaN(applicationId)) {
        return res.status(400).json({
          message: "Invalid application id",
        });
      }

      const existingApplication = await prisma.application.findFirst({
        where: {
          id: applicationId,
          userId,
        },
      });

      if (!existingApplication) {
        return res.status(404).json({
          message: "Application not found",
        });
      }

      await prisma.application.delete({
        where: {
          id: applicationId,
        },
      });

      return res.json({
        message: "Application deleted successfully",
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