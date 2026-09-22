import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/api";
import "./Pipeline.css";

const statuses = [
  "SAVED",
  "APPLIED",
  "ASSESSMENT",
  "PHONE_SCREEN",
  "INTERVIEW",
  "FINAL_INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
] as const;

type ApplicationStatus = (typeof statuses)[number];

interface Application {
  id: number;
  company: string;
  position: string;
  status: ApplicationStatus;
  appliedDate: string | null;
  location: string | null;
}

interface ApplicationsResponse {
  applications: Application[];
  pagination: {
    page: number;
    limit: number;
    totalApplications: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

const formatStatus = (status: ApplicationStatus) => {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

function Pipeline() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dragOverStatus, setDragOverStatus] =
    useState<ApplicationStatus | null>(null);

  const [draggedApplicationId, setDraggedApplicationId] = useState<
    number | null
  >(null);

  const [updatingApplicationId, setUpdatingApplicationId] = useState<
    number | null
  >(null);

  useEffect(() => {
    let cancelled = false;

    const fetchAllApplications = async () => {
      try {
        setError("");

        /*
         * The normal apps endpoint is paginated
         * The Pipeline needs every app so each status column
         * reps the user's complete app pipeline
         */
        const firstResponse = await api.get<ApplicationsResponse>(
          "/applications",
          {
            params: {
              page: 1,
              limit: 50,
            },
          },
        );

        const allApplications = [...firstResponse.data.applications];

        const totalPages = firstResponse.data.pagination.totalPages;

        // If x < 50 apps exist, fetch remaining pages
        // in parallel & combine them into 1 pipeline
        if (totalPages > 1) {
          const remainingRequests = Array.from(
            { length: totalPages - 1 },
            (_, index) =>
              api.get<ApplicationsResponse>("/applications", {
                params: {
                  page: index + 2,
                  limit: 50,
                },
              }),
          );

          const remainingResponses = await Promise.all(remainingRequests);

          for (const response of remainingResponses) {
            allApplications.push(...response.data.applications);
          }
        }

        if (!cancelled) {
          setApplications(allApplications);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load pipeline");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchAllApplications();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateApplicationStatus = async (
    applicationId: number,
    newStatus: ApplicationStatus,
  ) => {
    const application = applications.find((item) => item.id === applicationId);

    if (!application || application.status === newStatus) {
      return;
    }

    try {
      setError("");
      setUpdatingApplicationId(applicationId);

      await api.patch(`/applications/${applicationId}/status`, {
        status: newStatus,
      });

      // Update local state after backend confirms the change
      // so the card immediately moves into its new pipeline column
      setApplications((currentApplications) =>
        currentApplications.map((item) =>
          item.id === applicationId
            ? {
                ...item,
                status: newStatus,
              }
            : item,
        ),
      );
    } catch {
      setError("Unable to update application status");
    } finally {
      setUpdatingApplicationId(null);
    }
  };

  const handleDrop = async (newStatus: ApplicationStatus) => {
    if (draggedApplicationId === null) {
      return;
    }

    await updateApplicationStatus(draggedApplicationId, newStatus);

    setDraggedApplicationId(null);
  };

  if (loading) {
    return <p>Loading pipeline...</p>;
  }

  return (
    <div className="pipeline-page">
      <div className="pipeline-container">
        <div className="pipeline-header">
          <div>
            <h1>Pipeline</h1>
            <p>Track applications through each stage.</p>
          </div>
        </div>

        {error && <div className="pipeline-error">{error}</div>}

        <div className="pipeline-board">
          {statuses.map((status) => {
            const statusApplications = applications.filter(
              (application) => application.status === status,
            );

            return (
              <div
                className={`pipeline-column ${
                  dragOverStatus === status ? "pipeline-column-drag-over" : ""
                }`}
                key={status}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverStatus(status);
                }}
                onDragLeave={() => setDragOverStatus(null)}
                onDrop={() => {
                  void handleDrop(status);
                  setDragOverStatus(null);
                }}
              >
                <div className="pipeline-column-header">
                  <h2>{formatStatus(status)}</h2>
                  <span>{statusApplications.length}</span>
                </div>

                <div className="pipeline-cards">
                  {statusApplications.length === 0 ? (
                    <p className="pipeline-empty">No applications</p>
                  ) : (
                    statusApplications.map((application) => (
                      <div
                        className={`pipeline-card ${
                          draggedApplicationId === application.id
                            ? "pipeline-card-dragging"
                            : ""
                        }`}
                        key={application.id}
                        draggable={updatingApplicationId !== application.id}
                        onDragStart={() =>
                          setDraggedApplicationId(application.id)
                        }
                        onDragEnd={() => {
                          setDraggedApplicationId(null);
                          setDragOverStatus(null);
                        }}
                      >
                        <Link
                          to={`/applications/${application.id}`}
                          className="pipeline-card-link"
                        >
                          <h3>{application.company}</h3>
                          <p>{application.position}</p>
                        </Link>

                        {application.location && (
                          <span>{application.location}</span>
                        )}

                        {/*
                         * Native drag and drop is unreliable on touch
                         * devices, so mobile users get a status selector
                         */}
                        <div className="pipeline-mobile-status">
                          <label htmlFor={`status-${application.id}`}>
                            Move to
                          </label>

                          <select
                            id={`status-${application.id}`}
                            value={application.status}
                            disabled={updatingApplicationId === application.id}
                            onChange={(event) =>
                              void updateApplicationStatus(
                                application.id,
                                event.target.value as ApplicationStatus,
                              )
                            }
                          >
                            {statuses.map((statusOption) => (
                              <option key={statusOption} value={statusOption}>
                                {formatStatus(statusOption)}
                              </option>
                            ))}
                          </select>

                          {updatingApplicationId === application.id && (
                            <small>Updating...</small>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Pipeline;
