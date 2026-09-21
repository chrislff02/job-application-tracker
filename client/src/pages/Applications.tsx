import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import ApplicationForm from "../components/ApplicationForm";
import "./Applications.css";

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

interface ApplicationFormValues {
  company: string;
  position: string;
  status: string;
  appliedDate: string;
  location: string;
  salary: string;
  source: string;
  jobUrl: string;
  notes: string;
  recruiterName: string;
  recruiterEmail: string;
}

const emptyForm: ApplicationFormValues = {
  company: "",
  position: "",
  status: "SAVED",
  appliedDate: "",
  location: "",
  salary: "",
  source: "",
  jobUrl: "",
  notes: "",
  recruiterName: "",
  recruiterEmail: "",
};

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

  // Add application
  const [showForm, setShowForm] = useState(false);
  const [addForm, setAddForm] = useState<ApplicationFormValues>(emptyForm);

  // Edit application
  const [editingApplication, setEditingApplication] =
    useState<Application | null>(null);

  const [editForm, setEditForm] = useState<ApplicationFormValues>(emptyForm);

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

  const updateAddForm = (field: keyof ApplicationFormValues, value: string) => {
    setAddForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const updateEditForm = (
    field: keyof ApplicationFormValues,
    value: string,
  ) => {
    setEditForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleAddApplication = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    try {
      setError("");

      await api.post("/applications", {
        company: addForm.company,
        position: addForm.position,
        status: addForm.status,
        appliedDate: addForm.appliedDate || null,
        location: addForm.location || null,
        salary: addForm.salary || null,
        source: addForm.source || null,
        jobUrl: addForm.jobUrl || null,
        notes: addForm.notes || null,
        recruiterName: addForm.recruiterName || null,
        recruiterEmail: addForm.recruiterEmail || null,
      });

      setAddForm(emptyForm);
      setShowForm(false);

      await fetchApplications();
    } catch {
      setError("Unable to add application");
    }
  };

  const startEditing = (application: Application) => {
    setEditingApplication(application);

    setEditForm({
      company: application.company,
      position: application.position,
      status: application.status,
      appliedDate: application.appliedDate
        ? application.appliedDate.slice(0, 10)
        : "",
      location: application.location || "",
      salary: application.salary || "",
      source: application.source || "",
      jobUrl: application.jobUrl || "",
      notes: application.notes || "",
      recruiterName: application.recruiterName || "",
      recruiterEmail: application.recruiterEmail || "",
    });

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
        company: editForm.company,
        position: editForm.position,
        status: editForm.status,
        appliedDate: editForm.appliedDate || null,
        location: editForm.location || null,
        salary: editForm.salary || null,
        source: editForm.source || null,
        jobUrl: editForm.jobUrl || null,
        notes: editForm.notes || null,
        recruiterName: editForm.recruiterName || null,
        recruiterEmail: editForm.recruiterEmail || null,
      });

      setEditingApplication(null);
      setEditForm(emptyForm);

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

  const formatStatus = (statusValue: string) => {
    return statusValue
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
            type="button"
            onClick={() => {
              setEditingApplication(null);
              setEditForm(emptyForm);
              setAddForm(emptyForm);
              setShowForm(true);
              setError("");
            }}
          >
            + Add Application
          </button>
        </div>

        {showForm && (
          <ApplicationForm
            values={addForm}
            onChange={updateAddForm}
            onSubmit={handleAddApplication}
            onCancel={() => {
              setShowForm(false);
              setAddForm(emptyForm);
              setError("");
            }}
            submitLabel="Save Application"
          />
        )}

        {editingApplication && (
          <ApplicationForm
            values={editForm}
            onChange={updateEditForm}
            onSubmit={handleUpdateApplication}
            onCancel={() => {
              setEditingApplication(null);
              setEditForm(emptyForm);
              setError("");
            }}
            submitLabel="Save Changes"
          />
        )}

        {error && <p>{error}</p>}

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
            <option value="Referral">Referral</option>
            <option value="Recruiter">Recruiter</option>
            <option value="Other">Other</option>
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
                      <span className="status-badge">
                        {formatStatus(application.status)}
                      </span>
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
