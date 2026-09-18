import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import "./Pipeline.css";

interface Application {
  id: number;
  company: string;
  position: string;
  status: string;
  appliedDate: string | null;
  location: string | null;
}

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
];

const formatStatus = (status: string) => {
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
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  const [draggedApplicationId, setDraggedApplicationId] = useState<
    number | null
  >(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setError("");

        const response = await api.get("/applications");

        setApplications(response.data.applications);
      } catch {
        setError("Unable to load pipeline");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const handleDrop = async (newStatus: string) => {
    if (draggedApplicationId === null) {
      return;
    }

    const application = applications.find(
      (item) => item.id === draggedApplicationId,
    );

    if (!application) {
      setDraggedApplicationId(null);
      return;
    }

    if (application.status === newStatus) {
      setDraggedApplicationId(null);
      return;
    }

    try {
      setError("");

      await api.patch(`/applications/${draggedApplicationId}/status`, {
        status: newStatus,
      });

      setApplications((currentApplications) =>
        currentApplications.map((item) =>
          item.id === draggedApplicationId
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
      setDraggedApplicationId(null);
    }
  };

  if (loading) {
    return <p>Loading pipeline...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="pipeline-page">
      <div className="pipeline-container">
        <div className="pipeline-header">
          <div>
            <h1>Pipeline</h1>
            <p>Track applications through each stage.</p>
          </div>

          <Link to="/applications">Back to Applications</Link>
        </div>

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
                  handleDrop(status);
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
                        draggable
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
