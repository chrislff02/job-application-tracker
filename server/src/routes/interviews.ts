import { Router } from "express";
import prisma from "../lib/prisma";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

// Convert optional text fields to clean database values
// Empty strings = "null", while undefined = "leave unchanged"
function normalizeOptionalString(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue || null;
}

// Validate & convert a required date/time value
function parseRequiredDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return {
      valid: false,
      value: null,
    };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      valid: false,
      value: null,
    };
  }

  return {
    valid: true,
    value: date,
  };
}

// Create Interview For An App
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

      if (!Number.isInteger(applicationId) || applicationId < 1) {
        return res.status(400).json({
          message: "Invalid application id",
        });
      }

      // Verify the app belongs to authenticated user
      // before letting interview info to be added
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

      if (typeof type !== "string" || !type.trim()) {
        return res.status(400).json({
          message: "Interview type is required",
        });
      }

      const parsedDateTime = parseRequiredDate(dateTime);

      if (!parsedDateTime.valid || !parsedDateTime.value) {
        return res.status(400).json({
          message: "A valid interview date/time is required",
        });
      }

      // Create interview & its activity record together so
      // timeline can't become inconsistent if one fails
      const interview = await prisma.$transaction(async (tx) => {
        const createdInterview = await tx.interview.create({
          data: {
            applicationId,
            type: type.trim(),
            dateTime: parsedDateTime.value,
            interviewer: normalizeOptionalString(interviewer) ?? null,
            notes: normalizeOptionalString(notes) ?? null,
          },
        });

        await tx.applicationActivity.create({
          data: {
            applicationId,
            type: "INTERVIEW_CREATED",
            description: `${createdInterview.type} added`,
          },
        });

        return createdInterview;
      });

      return res.status(201).json({
        message: "Interview created successfully",
        interview,
      });
    } catch (error) {
      console.error("Create interview error:", error);

      return res.status(500).json({
        message: "Something went wrong",
      });
    }
  },
);

// Get All Interviews For One App
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

      if (!Number.isInteger(applicationId) || applicationId < 1) {
        return res.status(400).json({
          message: "Invalid application id",
        });
      }

      // Verify ownership before showing interview info
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
      console.error("Get interviews error:", error);

      return res.status(500).json({
        message: "Something went wrong",
      });
    }
  },
);

// Update Interview
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

      if (!Number.isInteger(interviewId) || interviewId < 1) {
        return res.status(400).json({
          message: "Invalid interview id",
        });
      }

      // Scope lookup through the parent application so users
      // can only update interviews attached to their own apps
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

      if (typeof type !== "string" || !type.trim()) {
        return res.status(400).json({
          message: "Interview type is required",
        });
      }

      const parsedDateTime = parseRequiredDate(dateTime);

      if (!parsedDateTime.valid || !parsedDateTime.value) {
        return res.status(400).json({
          message: "A valid interview date/time is required",
        });
      }

      // Update interview & activity timeline atomically
      const interview = await prisma.$transaction(async (tx) => {
        const updatedInterview = await tx.interview.update({
          where: {
            id: interviewId,
          },
          data: {
            type: type.trim(),
            dateTime: parsedDateTime.value,
            interviewer: normalizeOptionalString(interviewer),
            notes: normalizeOptionalString(notes),
          },
        });

        await tx.applicationActivity.create({
          data: {
            applicationId: updatedInterview.applicationId,
            type: "INTERVIEW_UPDATED",
            description: `${updatedInterview.type} updated`,
          },
        });

        return updatedInterview;
      });

      return res.json({
        message: "Interview updated successfully",
        interview,
      });
    } catch (error) {
      console.error("Update interview error:", error);

      return res.status(500).json({
        message: "Something went wrong",
      });
    }
  },
);

// Delete Interview
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

      if (!Number.isInteger(interviewId) || interviewId < 1) {
        return res.status(400).json({
          message: "Invalid interview id",
        });
      }

      // Verify ownership before allowing the interview to be deleted
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

      // Delete interview & record the deletion in the app
      // timeline as one transaction
      await prisma.$transaction(async (tx) => {
        await tx.interview.delete({
          where: {
            id: interviewId,
          },
        });

        await tx.applicationActivity.create({
          data: {
            applicationId: existingInterview.applicationId,
            type: "INTERVIEW_DELETED",
            description: `${existingInterview.type} deleted`,
          },
        });
      });

      return res.json({
        message: "Interview deleted successfully",
      });
    } catch (error) {
      console.error("Delete interview error:", error);

      return res.status(500).json({
        message: "Something went wrong",
      });
    }
  },
);

export default router;
