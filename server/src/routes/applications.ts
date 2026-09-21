import { Router } from "express";
import prisma from "../lib/prisma";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { ApplicationStatus } from "../generated/prisma/client";

const router = Router();

const validStatuses = Object.values(ApplicationStatus);

// CREATE APPLICATION
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
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

    await prisma.applicationActivity.create({
      data: {
        applicationId: application.id,
        type: "APPLICATION_CREATED",
        description: `Application created for ${application.company} - ${application.position}`,
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
});

// GET ALL APPLICATIONS FOR LOGGED-IN USER
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const {
      search,
      status,
      source,
      sort = "createdAt",
      order = "desc",
      page = "1",
      limit = "10",
    } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(50, Math.max(1, Number(limit) || 10));

    const skip = (pageNumber - 1) * limitNumber;

    const sortField =
      sort === "company" ||
      sort === "position" ||
      sort === "appliedDate" ||
      sort === "createdAt" ||
      sort === "updatedAt"
        ? sort
        : "createdAt";

    const sortOrder = order === "asc" ? "asc" : "desc";

    if (
      status &&
      typeof status === "string" &&
      !validStatuses.includes(status as ApplicationStatus)
    ) {
      return res.status(400).json({
        message: "Invalid application status",
      });
    }

    const where = {
      userId,

      ...(status && typeof status === "string"
        ? {
            status: status as ApplicationStatus,
          }
        : {}),

      ...(source && typeof source === "string"
        ? {
            source: {
              equals: source,
              mode: "insensitive" as const,
            },
          }
        : {}),

      ...(search && typeof search === "string"
        ? {
            OR: [
              {
                company: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                position: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                location: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                source: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const [applications, totalApplications] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy: {
          [sortField]: sortOrder,
        },
        skip,
        take: limitNumber,
      }),

      prisma.application.count({
        where,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalApplications / limitNumber));

    return res.json({
      applications,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        totalApplications,
        totalPages,
        hasPreviousPage: pageNumber > 1,
        hasNextPage: pageNumber < totalPages,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

// GET ONE APPLICATION
router.get("/:id", authenticateToken, async (req: AuthRequest, res) => {
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
});

// UPDATE APPLICATION
router.put("/:id", authenticateToken, async (req: AuthRequest, res) => {
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

    // Log normal application edit
    await prisma.applicationActivity.create({
      data: {
        applicationId: application.id,
        type: "APPLICATION_UPDATED",
        description: "Application details updated",
      },
    });

    // If the edit also changed the status, log that separately
    if (status && existingApplication.status !== application.status) {
      await prisma.applicationActivity.create({
        data: {
          applicationId: application.id,
          type: "STATUS_CHANGED",
          description: `Status changed from ${existingApplication.status} to ${application.status}`,
        },
      });
    }

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
});

// DELETE APPLICATION
router.delete("/:id", authenticateToken, async (req: AuthRequest, res) => {
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
});

// UPDATE APPLICATION STATUS
router.patch(
  "/:id/status",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      const applicationId = Number(req.params.id);
      const { status } = req.body;

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

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid application status",
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

      const application = await prisma.application.update({
        where: {
          id: applicationId,
        },
        data: {
          status,
        },
      });

      // Only record activity if the status actually changed
      if (existingApplication.status !== application.status) {
        await prisma.applicationActivity.create({
          data: {
            applicationId: application.id,
            type: "STATUS_CHANGED",
            description: `Status changed from ${existingApplication.status} to ${application.status}`,
          },
        });
      }

      return res.json({
        message: "Application status updated successfully",
        application,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Something went wrong",
      });
    }
  },
);

// GET APPLICATION ACTIVITY
router.get(
  "/:id/activities",
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

      const activities = await prisma.applicationActivity.findMany({
        where: {
          applicationId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.json({
        activities,
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
