import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/api";
import "./ApplicationDetails.css";

interface Application {
  id: number;
  company: string;
  position: string;
  status: string;
  appliedDate: string | null;
  location: string | null;
  salary: string | null;
  source: string | null;
  jobUrl: string | null;
  notes: string | null;
  recruiterName: string | null;
  recruiterEmail: string | null;
}

interface Interview {
  id: number;
  applicationId: number;
  type: string;
  dateTime: string;
  interviewer: string | null;
  notes: string | null;
}

interface ApplicationActivity {
  id: number;
  applicationId: number;
  type: string;
  description: string;
  createdAt: string;
}

function ApplicationDetails() {
  const { id } = useParams();

  const [application, setApplication] = useState<Application | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [activities, setActivities] = useState<ApplicationActivity[]>([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");

  // Add interview
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [interviewType, setInterviewType] = useState("");
  const [interviewDateTime, setInterviewDateTime] = useState("");
  const [interviewer, setInterviewer] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");

  // Edit interview
  const [editingInterview, setEditingInterview] = useState<Interview | null>(
    null,
  );

  const [editType, setEditType] = useState("");
  const [editDateTime, setEditDateTime] = useState("");
  const [editInterviewer, setEditInterviewer] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const fetchInterviews = async () => {
    const response = await api.get(`/applications/${id}/interviews`);
    setInterviews(response.data.interviews);
  };

  const fetchActivities = async () => {
    const response = await api.get(`/applications/${id}/activities`);
    setActivities(response.data.activities);
  };

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        setPageError("");

        const [applicationResponse, interviewResponse, activityResponse] =
          await Promise.all([
            api.get(`/applications/${id}`),
            api.get(`/applications/${id}/interviews`),
            api.get(`/applications/${id}/activities`),
          ]);

        setApplication(applicationResponse.data.application);
        setInterviews(interviewResponse.data.interviews);
        setActivities(activityResponse.data.activities);
      } catch {
        setPageError("Unable to load application");
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationDetails();
  }, [id]);

  const handleAddInterview = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    try {
      setActionError("");

      await api.post(`/applications/${id}/interviews`, {
        type: interviewType,
        dateTime: interviewDateTime,
        interviewer: interviewer || null,
        notes: interviewNotes || null,
      });

      await Promise.all([fetchInterviews(), fetchActivities()]);

      setInterviewType("");
      setInterviewDateTime("");
      setInterviewer("");
      setInterviewNotes("");
      setShowInterviewForm(false);
    } catch {
      setActionError("Unable to add interview");
    }
  };

  const startEditingInterview = (interview: Interview) => {
    setEditingInterview(interview);

    setEditType(interview.type);
    setEditDateTime(interview.dateTime ? interview.dateTime.slice(0, 16) : "");
    setEditInterviewer(interview.interviewer || "");
    setEditNotes(interview.notes || "");

    setShowInterviewForm(false);
    setActionError("");
  };

  const handleUpdateInterview = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!editingInterview) {
      return;
    }

    try {
      setActionError("");

      await api.put(`/interviews/${editingInterview.id}`, {
        type: editType,
        dateTime: editDateTime,
        interviewer: editInterviewer || null,
        notes: editNotes || null,
      });

      setEditingInterview(null);

      await Promise.all([fetchInterviews(), fetchActivities()]);
    } catch {
      setActionError("Unable to update interview");
    }
  };

  const handleDeleteInterview = async (interviewId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this interview?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionError("");

      await api.delete(`/interviews/${interviewId}`);

      await Promise.all([fetchInterviews(), fetchActivities()]);
    } catch {
      setActionError("Unable to delete interview");
    }
  };

  const formatStatus = (status: string) => {
    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  if (loading) {
    return <p>Loading application...</p>;
  }

  if (pageError) {
    return <p>{pageError}</p>;
  }

  if (!application) {
    return <p>Application not found.</p>;
  }

  return (
    <div className="details-page">
      <div className="details-container">
        <Link className="back-link" to="/applications">
          ← Back to Applications
        </Link>

        <section className="application-details-card">
          <div className="application-details-header">
            <div>
              <h1>{application.company}</h1>
              <h2>{application.position}</h2>
            </div>

            <span className="details-status">
              {formatStatus(application.status)}
            </span>
          </div>

          <div className="details-grid">
            <div>
              <span>Applied Date</span>
              <strong>
                {application.appliedDate
                  ? new Date(application.appliedDate).toLocaleDateString(
                      "en-US",
                      {
                        timeZone: "UTC",
                      },
                    )
                  : "—"}
              </strong>
            </div>

            <div>
              <span>Location</span>
              <strong>{application.location || "—"}</strong>
            </div>

            <div>
              <span>Salary</span>
              <strong>{application.salary || "—"}</strong>
            </div>

            <div>
              <span>Source</span>
              <strong>{application.source || "—"}</strong>
            </div>

            <div>
              <span>Recruiter</span>
              <strong>{application.recruiterName || "—"}</strong>
            </div>

            <div>
              <span>Recruiter Email</span>

              {application.recruiterEmail ? (
                <a href={`mailto:${application.recruiterEmail}`}>
                  {application.recruiterEmail}
                </a>
              ) : (
                <strong>—</strong>
              )}
            </div>
          </div>

          <div className="details-section">
            <h3>Job Posting</h3>

            {application.jobUrl ? (
              <a href={application.jobUrl} target="_blank" rel="noreferrer">
                View Job Posting
              </a>
            ) : (
              <p>—</p>
            )}
          </div>

          <div className="details-section">
            <h3>Notes</h3>
            <p>{application.notes || "No notes added."}</p>
          </div>
        </section>

        <section className="interviews-section">
          <div className="interviews-header">
            <div>
              <h2>Interviews</h2>
              <p>Track interview rounds for this application.</p>
            </div>

            <button
              className="add-interview-button"
              type="button"
              onClick={() => {
                setEditingInterview(null);
                setShowInterviewForm(true);
                setActionError("");
              }}
            >
              + Add Interview
            </button>
          </div>

          {actionError && <p className="action-error">{actionError}</p>}

          {showInterviewForm && (
            <form className="interview-form" onSubmit={handleAddInterview}>
              <input
                type="text"
                placeholder="Interview type"
                value={interviewType}
                onChange={(event) => setInterviewType(event.target.value)}
                required
              />

              <input
                type="datetime-local"
                value={interviewDateTime}
                onChange={(event) => setInterviewDateTime(event.target.value)}
                required
              />

              <input
                type="text"
                placeholder="Interviewer"
                value={interviewer}
                onChange={(event) => setInterviewer(event.target.value)}
              />

              <textarea
                placeholder="Interview notes"
                value={interviewNotes}
                onChange={(event) => setInterviewNotes(event.target.value)}
              />

              <div className="interview-form-actions">
                <button type="submit">Save Interview</button>

                <button
                  type="button"
                  onClick={() => {
                    setShowInterviewForm(false);
                    setActionError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {editingInterview && (
            <form className="interview-form" onSubmit={handleUpdateInterview}>
              <input
                type="text"
                value={editType}
                onChange={(event) => setEditType(event.target.value)}
                required
              />

              <input
                type="datetime-local"
                value={editDateTime}
                onChange={(event) => setEditDateTime(event.target.value)}
                required
              />

              <input
                type="text"
                placeholder="Interviewer"
                value={editInterviewer}
                onChange={(event) => setEditInterviewer(event.target.value)}
              />

              <textarea
                placeholder="Interview notes"
                value={editNotes}
                onChange={(event) => setEditNotes(event.target.value)}
              />

              <div className="interview-form-actions">
                <button type="submit">Save Changes</button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingInterview(null);
                    setActionError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {interviews.length === 0 ? (
            <div className="no-interviews">No interviews scheduled.</div>
          ) : (
            <div className="interview-list">
              {interviews.map((interview) => (
                <div className="interview-card" key={interview.id}>
                  <div className="interview-card-header">
                    <div>
                      <h3>{interview.type}</h3>

                      <p>{new Date(interview.dateTime).toLocaleString()}</p>
                    </div>

                    <div className="interview-actions">
                      <button
                        type="button"
                        onClick={() => startEditingInterview(interview)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteInterview(interview.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <p>
                    <strong>Interviewer:</strong> {interview.interviewer || "—"}
                  </p>

                  <p>
                    <strong>Notes:</strong> {interview.notes || "—"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="activity-section">
          <div className="activity-header">
            <h2>Activity</h2>
            <p>History of changes for this application.</p>
          </div>

          {activities.length === 0 ? (
            <div className="no-activity">No activity recorded yet.</div>
          ) : (
            <div className="activity-list">
              {activities.map((activity) => (
                <div className="activity-item" key={activity.id}>
                  <div className="activity-marker" />

                  <div className="activity-content">
                    <p>{activity.description}</p>

                    <span>{new Date(activity.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default ApplicationDetails;
