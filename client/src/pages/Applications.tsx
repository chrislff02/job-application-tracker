import { useEffect, useState } from "react";
import api from "../api/api";
import "./Applications.css";
import { Link } from "react-router-dom";

interface Application {
  id: number;
  company: string;
  position: string;
  status: string;
  appliedDate: string | null;
  location: string | null;
  salary: string | null;
  source: string | null;
}

function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  // Add application form
  const [showForm, setShowForm] = useState(false);
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [newStatus, setNewStatus] = useState("SAVED");
  const [appliedDate, setAppliedDate] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [newSource, setNewSource] = useState("");

  // Edit application form
  const [editingApplication, setEditingApplication] =
    useState<Application | null>(null);

  const [editCompany, setEditCompany] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editAppliedDate, setEditAppliedDate] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editSalary, setEditSalary] = useState("");
  const [editSource, setEditSource] = useState("");

  const fetchApplications = async () => {
    try {
      setError("");

      const response = await api.get("/applications", {
        params: {
          search: search || undefined,
          status: status || undefined,
          source: source || undefined,
          sort,
          order,
        },
      });

      setApplications(response.data.applications);
    } catch {
      setError("Unable to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [search, status, source, sort, order]);

  const handleAddApplication = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    try {
      setError("");

      await api.post("/applications", {
        company,
        position,
        status: newStatus,
        appliedDate: appliedDate || null,
        location: location || null,
        salary: salary || null,
        source: newSource || null,
      });

      setCompany("");
      setPosition("");
      setNewStatus("SAVED");
      setAppliedDate("");
      setLocation("");
      setSalary("");
      setNewSource("");

      setShowForm(false);

      await fetchApplications();
    } catch {
      setError("Unable to add application");
    }
  };

  const startEditing = (application: Application) => {
    setEditingApplication(application);

    setEditCompany(application.company);
    setEditPosition(application.position);
    setEditStatus(application.status);

    setEditAppliedDate(
      application.appliedDate ? application.appliedDate.slice(0, 10) : "",
    );

    setEditLocation(application.location || "");
    setEditSalary(application.salary || "");
    setEditSource(application.source || "");

    setShowForm(false);
  };

  const handleUpdateApplication = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!editingApplication) {
      return;
    }

    try {
      setError("");

      await api.put(`/applications/${editingApplication.id}`, {
        company: editCompany,
        position: editPosition,
        status: editStatus,
        appliedDate: editAppliedDate || null,
        location: editLocation || null,
        salary: editSalary || null,
        source: editSource || null,
      });

      setEditingApplication(null);

      await fetchApplications();
    } catch {
      setError("Unable to update application");
    }
  };

  const handleDeleteApplication = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this application?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(`/applications/${id}`);

      await fetchApplications();
    } catch {
      setError("Unable to delete application");
    }
  };

  if (loading) {
    return <p>Loading applications...</p>;
  }

  return (
    <div className="applications-page">
      <div className="applications-container">
        <div className="applications-header">
          <h1>Applications</h1>

          <button
            className="add-application-button"
            onClick={() => {
              setEditingApplication(null);
              setShowForm(true);
            }}
          >
            + Add Application
          </button>
        </div>

        {/* ADD APPLICATION FORM */}
        {showForm && (
          <form
            className="add-application-form"
            onSubmit={handleAddApplication}
          >
            <input
              type="text"
              placeholder="Company"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Position"
              value={position}
              onChange={(event) => setPosition(event.target.value)}
              required
            />

            <select
              value={newStatus}
              onChange={(event) => setNewStatus(event.target.value)}
            >
              <option value="SAVED">Saved</option>
              <option value="APPLIED">Applied</option>
              <option value="ASSESSMENT">Assessment</option>
              <option value="PHONE_SCREEN">Phone Screen</option>
              <option value="INTERVIEW">Interview</option>
              <option value="FINAL_INTERVIEW">Final Interview</option>
              <option value="OFFER">Offer</option>
              <option value="REJECTED">Rejected</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>

            <input
              type="date"
              value={appliedDate}
              onChange={(event) => setAppliedDate(event.target.value)}
            />

            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />

            <input
              type="text"
              placeholder="Salary"
              value={salary}
              onChange={(event) => setSalary(event.target.value)}
            />

            <input
              type="text"
              placeholder="Source"
              value={newSource}
              onChange={(event) => setNewSource(event.target.value)}
            />

            <div className="form-actions">
              <button type="submit">Save Application</button>

              <button type="button" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* EDIT APPLICATION FORM */}
        {editingApplication && (
          <form
            className="add-application-form"
            onSubmit={handleUpdateApplication}
          >
            <input
              type="text"
              value={editCompany}
              onChange={(event) => setEditCompany(event.target.value)}
              required
            />

            <input
              type="text"
              value={editPosition}
              onChange={(event) => setEditPosition(event.target.value)}
              required
            />

            <select
              value={editStatus}
              onChange={(event) => setEditStatus(event.target.value)}
            >
              <option value="SAVED">Saved</option>
              <option value="APPLIED">Applied</option>
              <option value="ASSESSMENT">Assessment</option>
              <option value="PHONE_SCREEN">Phone Screen</option>
              <option value="INTERVIEW">Interview</option>
              <option value="FINAL_INTERVIEW">Final Interview</option>
              <option value="OFFER">Offer</option>
              <option value="REJECTED">Rejected</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>

            <input
              type="date"
              value={editAppliedDate}
              onChange={(event) => setEditAppliedDate(event.target.value)}
            />

            <input
              type="text"
              placeholder="Location"
              value={editLocation}
              onChange={(event) => setEditLocation(event.target.value)}
            />

            <input
              type="text"
              placeholder="Salary"
              value={editSalary}
              onChange={(event) => setEditSalary(event.target.value)}
            />

            <input
              type="text"
              placeholder="Source"
              value={editSource}
              onChange={(event) => setEditSource(event.target.value)}
            />

            <div className="form-actions">
              <button type="submit">Save Changes</button>

              <button type="button" onClick={() => setEditingApplication(null)}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {error && <p>{error}</p>}

        {/* SEARCH / FILTER / SORT */}
        <div className="application-controls">
          <input
            type="text"
            placeholder="Search applications..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="SAVED">Saved</option>
            <option value="APPLIED">Applied</option>
            <option value="ASSESSMENT">Assessment</option>
            <option value="PHONE_SCREEN">Phone Screen</option>
            <option value="INTERVIEW">Interview</option>
            <option value="FINAL_INTERVIEW">Final Interview</option>
            <option value="OFFER">Offer</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>

          <select
            value={source}
            onChange={(event) => setSource(event.target.value)}
          >
            <option value="">All Sources</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Indeed">Indeed</option>
            <option value="Company Website">Company Website</option>
          </select>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="createdAt">Date Added</option>
            <option value="company">Company</option>
            <option value="position">Position</option>
            <option value="appliedDate">Applied Date</option>
          </select>

          <select
            value={order}
            onChange={(event) => setOrder(event.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        {/* APPLICATION TABLE */}
        <div className="applications-table-wrapper">
          {applications.length === 0 ? (
            <div className="empty-state">No applications found.</div>
          ) : (
            <table className="applications-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th>Applied Date</th>
                  <th>Location</th>
                  <th>Salary</th>
                  <th>Source</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <Link to={`/applications/${application.id}`}>
                        {application.company}
                      </Link>
                    </td>

                    <td>
                      <Link to={`/applications/${application.id}`}>
                        {application.position}
                      </Link>
                    </td>

                    <td>
                      <span className="status-badge">{application.status}</span>
                    </td>

                    <td>
                      {application.appliedDate
                        ? new Date(application.appliedDate).toLocaleDateString(
                            "en-US",
                            {
                              timeZone: "UTC",
                            },
                          )
                        : "—"}
                    </td>

                    <td>{application.location || "—"}</td>

                    <td>{application.salary || "—"}</td>

                    <td>{application.source || "—"}</td>

                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          onClick={() => startEditing(application)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteApplication(application.id)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Applications;
