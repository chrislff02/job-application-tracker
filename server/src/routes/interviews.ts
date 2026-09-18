import { Router } from "express";
import prisma from "../lib/prisma";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

// CREATE INTERVIEW FOR AN APPLICATION
router.post(
  "/applications/:applicationId/interviews",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      const applicationId = Number(req.params.applicationId);

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

      const { type, dateTime, interviewer, notes } = req.body;

      if (!type || !dateTime) {
        return res.status(400).json({
          message: "Interview type and date/time are required",
        });
      }

      const interview = await prisma.interview.create({
        data: {
          applicationId,
          type,
          dateTime: new Date(dateTime),
          interviewer: interviewer || null,
          notes: notes || null,
        },
      });

      await prisma.applicationActivity.create({
        data: {
          applicationId,
          type: "INTERVIEW_CREATED",
          description: `${interview.type} interview added`,
        },
      });

      return res.status(201).json({
        message: "Interview created successfully",
        interview,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Something went wrong",
      });
    }
  },
);

// GET ALL INTERVIEWS FOR ONE APPLICATION
router.get(
  "/applications/:applicationId/interviews",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      const applicationId = Number(req.params.applicationId);

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

      const interviews = await prisma.interview.findMany({
        where: {
          applicationId,
        },
        orderBy: {
          dateTime: "asc",
        },
      });

      return res.json({
        interviews,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Something went wrong",
      });
    }
  },
);

// UPDATE INTERVIEW
router.put(
  "/interviews/:id",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      const interviewId = Number(req.params.id);

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      if (Number.isNaN(interviewId)) {
        return res.status(400).json({
          message: "Invalid interview id",
        });
      }

      const existingInterview = await prisma.interview.findFirst({
        where: {
          id: interviewId,
          application: {
            userId,
          },
        },
      });

      if (!existingInterview) {
        return res.status(404).json({
          message: "Interview not found",
        });
      }

      const { type, dateTime, interviewer, notes } = req.body;

      const interview = await prisma.interview.update({
        where: {
          id: interviewId,
        },
        data: {
          type,
          dateTime:
            dateTime === undefined
              ? undefined
              : new Date(dateTime),
          interviewer,
          notes,
        },
      });

      await prisma.applicationActivity.create({
        data: {
          applicationId: interview.applicationId,
          type: "INTERVIEW_UPDATED",
          description: `${interview.type} interview updated`,
        },
      });

      return res.json({
        message: "Interview updated successfully",
        interview,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Something went wrong",
      });
    }
  },
);

// DELETE INTERVIEW
router.delete(
  "/interviews/:id",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      const interviewId = Number(req.params.id);

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      if (Number.isNaN(interviewId)) {
        return res.status(400).json({
          message: "Invalid interview id",
        });
      }

      const existingInterview = await prisma.interview.findFirst({
        where: {
          id: interviewId,
          application: {
            userId,
          },
        },
      });

      if (!existingInterview) {
        return res.status(404).json({
          message: "Interview not found",
        });
      }

      await prisma.interview.delete({
        where: {
          id: interviewId,
        },
      });

      await prisma.applicationActivity.create({
        data: {
          applicationId: existingInterview.applicationId,
          type: "INTERVIEW_DELETED",
          description: `${existingInterview.type} interview deleted`,
        },
      });

      return res.json({
        message: "Interview deleted successfully",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Something went wrong",
      });
    }
  },
);

export default router;