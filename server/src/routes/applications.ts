import { Router } from "express";
import prisma from "../lib/prisma";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { ApplicationStatus } from "../generated/prisma/client";

const router = Router();

const validStatuses = Object.values(ApplicationStatus);

const allowedSortFields = [
  "company",
  "position",
  "appliedDate",
  "createdAt",
  "updatedAt",
];

// Convert optional text fields into clean database values
// Empty strings = null, undefined = "leave unchanged"
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

// Parse optional dates & reject invalid date strings
function parseOptionalDate(value: unknown) {
  if (value === undefined) {
    return {
      valid: true,
      value: undefined,
    };
  }

  if (value === null || value === "") {
    return {
      valid: true,
      value: null,
    };
  }

  if (typeof value !== "string") {
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

// Convert pagination query parameters to positive Ints
function parsePositiveInteger(value: unknown, fallback: number, max?: number) {
  if (typeof value !== "string") {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  if (max !== undefined) {
    return Math.min(parsedValue, max);
  }

  return parsedValue;
}

// Create App
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

    if (
      typeof company !== "string" ||
      typeof position !== "string" ||
      !company.trim() ||
      !position.trim()
    ) {
      return res.status(400).json({
        message: "Company and position are required",
      });
    }

    if (
      status !== undefined &&
      !validStatuses.includes(status as ApplicationStatus)
    ) {
      return res.status(400).json({
        message: "Invalid application status",
      });
    }

    const parsedAppliedDate = parseOptionalDate(appliedDate);

    if (!parsedAppliedDate.valid) {
      return res.status(400).json({
        message: "Invalid applied date",
      });
    }

    // Create application & initial activity together
    // If either operation fails = no change is committed
    const application = await prisma.$transaction(async (tx) => {
      const createdApplication = await tx.application.create({
        data: {
          userId,
          company: company.trim(),
          position: position.trim(),
          status: status ?? ApplicationStatus.SAVED,
          appliedDate: parsedAppliedDate.value ?? null,
          location: normalizeOptionalString(location) ?? null,
          salary: normalizeOptionalString(salary) ?? null,
          source: normalizeOptionalString(source) ?? null,
          jobUrl: normalizeOptionalString(jobUrl) ?? null,
          notes: normalizeOptionalString(notes) ?? null,
          recruiterName: normalizeOptionalString(recruiterName) ?? null,
          recruiterEmail: normalizeOptionalString(recruiterEmail) ?? null,
        },
      });

      await tx.applicationActivity.create({
        data: {
          applicationId: createdApplication.id,
          type: "APPLICATION_CREATED",
          description: `Application created for ${createdApplication.company} - ${createdApplication.position}`,
        },
      });

      return createdApplication;
    });

    return res.status(201).json({
      message: "Application created successfully",
      application,
    });
  } catch (error) {
    console.error("Create application error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

// Get all applications for logged-in user
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

    // Limit page size to prevent a single request from retrieving
    // an unneeded large # of application records
    const pageNumber = parsePositiveInteger(page, 1);
    const limitNumber = parsePositiveInteger(limit, 10, 50);

    const skip = (pageNumber - 1) * limitNumber;

    const sortField =
      typeof sort === "string" && allowedSortFields.includes(sort)
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

    const trimmedSearch = typeof search === "string" ? search.trim() : "";

    const trimmedSource = typeof source === "string" ? source.trim() : "";

    // Every query = scoped to authenticated user so one user
    // can never get another user's applications
    const where = {
      userId,

      ...(status && typeof status === "string"
        ? {
            status: status as ApplicationStatus,
          }
        : {}),

      ...(trimmedSource
        ? {
            source: {
              equals: trimmedSource,
              mode: "insensitive" as const,
            },
          }
        : {}),

      ...(trimmedSearch
        ? {
            OR: [
              {
                company: {
                  contains: trimmedSearch,
                  mode: "insensitive" as const,
                },
              },
              {
                position: {
                  contains: trimmedSearch,
                  mode: "insensitive" as const,
                },
              },
              {
                location: {
                  contains: trimmedSearch,
                  mode: "insensitive" as const,
                },
              },
              {
                source: {
                  contains: trimmedSearch,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    // Fetch current page & total count in parallel because
    // neither database query depends on the other
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
    console.error("Get applications error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

// Get One App
router.get("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const applicationId = Number(req.params.id);

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

    // Include userId in lookup so users can only access
    // applications that belong to them
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
    console.error("Get application error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

// Update App
router.put("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const applicationId = Number(req.params.id);

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

    // This route reps a full app edit, so the 2
    // required application fields must remain populated
    if (
      typeof company !== "string" ||
      typeof position !== "string" ||
      !company.trim() ||
      !position.trim()
    ) {
      return res.status(400).json({
        message: "Company and position are required",
      });
    }

    if (
      status !== undefined &&
      !validStatuses.includes(status as ApplicationStatus)
    ) {
      return res.status(400).json({
        message: "Invalid application status",
      });
    }

    const parsedAppliedDate = parseOptionalDate(appliedDate);

    if (!parsedAppliedDate.valid) {
      return res.status(400).json({
        message: "Invalid applied date",
      });
    }

    // Keep app update & its activity records atomic
    const application = await prisma.$transaction(async (tx) => {
      const updatedApplication = await tx.application.update({
        where: {
          id: applicationId,
        },
        data: {
          company: company.trim(),
          position: position.trim(),
          status,
          appliedDate: parsedAppliedDate.value,
          location: normalizeOptionalString(location),
          salary: normalizeOptionalString(salary),
          source: normalizeOptionalString(source),
          jobUrl: normalizeOptionalString(jobUrl),
          notes: normalizeOptionalString(notes),
          recruiterName: normalizeOptionalString(recruiterName),
          recruiterEmail: normalizeOptionalString(recruiterEmail),
        },
      });

      await tx.applicationActivity.create({
        data: {
          applicationId: updatedApplication.id,
          type: "APPLICATION_UPDATED",
          description: "Application details updated",
        },
      });

      // Record status changes separately so activity timeline
      // shows movement through the application pipeline
      if (status && existingApplication.status !== updatedApplication.status) {
        await tx.applicationActivity.create({
          data: {
            applicationId: updatedApplication.id,
            type: "STATUS_CHANGED",
            description: `Status changed from ${existingApplication.status} to ${updatedApplication.status}`,
          },
        });
      }

      return updatedApplication;
    });

    return res.json({
      message: "Application updated successfully",
      application,
    });
  } catch (error) {
    console.error("Update application error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

// Delete App
router.delete("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const applicationId = Number(req.params.id);

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

    // Check ownership before deleting so users cannot delete
    // apps that belong to another
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
    console.error("Delete application error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

// Update App Status
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

      if (!Number.isInteger(applicationId) || applicationId < 1) {
        return res.status(400).json({
          message: "Invalid application id",
        });
      }

      if (
        typeof status !== "string" ||
        !validStatuses.includes(status as ApplicationStatus)
      ) {
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

      // Updating status & creating its activity entry should
      // succeed/fail together
      const application = await prisma.$transaction(async (tx) => {
        const updatedApplication = await tx.application.update({
          where: {
            id: applicationId,
          },
          data: {
            status: status as ApplicationStatus,
          },
        });

        if (existingApplication.status !== updatedApplication.status) {
          await tx.applicationActivity.create({
            data: {
              applicationId: updatedApplication.id,
              type: "STATUS_CHANGED",
              description: `Status changed from ${existingApplication.status} to ${updatedApplication.status}`,
            },
          });
        }

        return updatedApplication;
      });

      return res.json({
        message: "Application status updated successfully",
        application,
      });
    } catch (error) {
      console.error("Update application status error:", error);

      return res.status(500).json({
        message: "Something went wrong",
      });
    }
  },
);

// Get App Activity
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

      if (!Number.isInteger(applicationId) || applicationId < 1) {
        return res.status(400).json({
          message: "Invalid application id",
        });
      }

      // Verify ownership before showing an app's timeline
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
      console.error("Get application activity error:", error);

      return res.status(500).json({
        message: "Something went wrong",
      });
    }
  },
);

export default router;
