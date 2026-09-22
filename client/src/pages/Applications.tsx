import { useCallback, useEffect, useState } from "react";
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

interface PaginationData {
  page: number;
  limit: number;
  totalApplications: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
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

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    totalApplications: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  });

  // Search, filter & sorting controls
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  // Track individual request states so buttons can provide
  // feedback & prevent duplicate submissions
  const [addingApplication, setAddingApplication] = useState(false);
  const [updatingApplication, setUpdatingApplication] = useState(false);
  const [deletingApplicationId, setDeletingApplicationId] = useState<
    number | null
  >(null);

  // Add app form state
  const [showForm, setShowForm] = useState(false);
  const [addForm, setAddForm] = useState<ApplicationFormValues>(emptyForm);

  // Edit app form state
  const [editingApplication, setEditingApplication] =
    useState<Application | null>(null);

  const [editForm, setEditForm] = useState<ApplicationFormValues>(emptyForm);

  const fetchApplications = useCallback(
    async (pageToFetch: number) => {
      const response = await api.get("/applications", {
        params: {
          search: search || undefined,
          status: status || undefined,
          source: source || undefined,
          sort,
          order,
          page: pageToFetch,
          limit: 10,
        },
      });

      return response.data;
    },
    [search, status, source, sort, order],
  );

  useEffect(() => {
    let cancelled = false;

    const loadApplications = async () => {
      try {
        /*
         * Yield once before changing state, keeps effect focused
         * on synchronizing the component with the API rather than causing
         * an immediate synchronous state update during the effect itself
         */
        await Promise.resolve();

        if (cancelled) {
          return;
        }

        setLoading(true);
        setError("");

        const data = await fetchApplications(page);

        if (cancelled) {
          return;
        }

        setApplications(data.applications);
        setPagination(data.pagination);
      } catch {
        if (!cancelled) {
          setError("Unable to load applications. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadApplications();

    // Ignore results from outdated request after dependencies change
    // or component unmounts
    return () => {
      cancelled = true;
    };
  }, [fetchApplications, page]);

  const refreshApplications = async (pageToFetch: number) => {
    try {
      setLoading(true);
      setError("");

      const data = await fetchApplications(pageToFetch);

      setApplications(data.applications);
      setPagination(data.pagination);
    } catch {
      setError("Unable to load applications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
      setAddingApplication(true);

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

      if (page !== 1) {
        setPage(1);
      } else {
        await refreshApplications(1);
      }
    } catch {
      setError("Unable to add application");
    } finally {
      setAddingApplication(false);
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
      setUpdatingApplication(true);

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

      await refreshApplications(page);
    } catch {
      setError("Unable to update application");
    } finally {
      setUpdatingApplication(false);
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
      setDeletingApplicationId(id);

      await api.delete(`/applications/${id}`);

      /*
       * If deleted record was final item on a later page,
       * move back one page instead of leaving the user on an empty page
       */
      const isLastItemOnPage = applications.length === 1 && page > 1;

      if (isLastItemOnPage) {
        setPage(page - 1);
      } else {
        await refreshApplications(page);
      }
    } catch {
      setError("Unable to delete application");
    } finally {
      setDeletingApplicationId(null);
    }
  };

  const formatStatus = (statusValue: string) => {
    return statusValue
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatAppliedDate = (appliedDate: string | null) => {
    if (!appliedDate) {
      return "—";
    }

    return new Date(appliedDate).toLocaleDateString("en-US", {
      timeZone: "UTC",
    });
  };

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
            isSubmitting={addingApplication}
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
            isSubmitting={updatingApplication}
          />
        )}

        {error && <div className="applications-error">{error}</div>}

        <div className="application-controls">
          <input
            type="text"
            placeholder="Search applications..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
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
            onChange={(event) => {
              setSource(event.target.value);
              setPage(1);
            }}
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
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
          >
            <option value="createdAt">Date Added</option>
            <option value="company">Company</option>
            <option value="position">Position</option>
            <option value="appliedDate">Applied Date</option>
          </select>

          <select
            value={order}
            onChange={(event) => {
              setOrder(event.target.value);
              setPage(1);
            }}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        <div className="applications-table-wrapper">
          {loading ? (
            <div className="applications-state">
              <div className="loading-spinner"></div>
              <p>Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="applications-state">
              <h3>
                {search || status || source
                  ? "No matching applications"
                  : "No applications yet"}
              </h3>

              <p>
                {search || status || source
                  ? "Try changing your search or filters."
                  : "Add your first job application to get started."}
              </p>
            </div>
          ) : (
            <>
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

                      <td>{formatAppliedDate(application.appliedDate)}</td>

                      <td>{application.location || "—"}</td>
                      <td>{application.salary || "—"}</td>
                      <td>{application.source || "—"}</td>

                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            disabled={deletingApplicationId === application.id}
                            onClick={() => startEditing(application)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={deletingApplicationId === application.id}
                            onClick={() =>
                              handleDeleteApplication(application.id)
                            }
                          >
                            {deletingApplicationId === application.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mobile-applications-list">
                {applications.map((application) => (
                  <div className="mobile-application-card" key={application.id}>
                    <div className="mobile-application-card-header">
                      <div>
                        <Link
                          className="mobile-application-company"
                          to={`/applications/${application.id}`}
                        >
                          {application.company}
                        </Link>

                        <Link
                          className="mobile-application-position"
                          to={`/applications/${application.id}`}
                        >
                          {application.position}
                        </Link>
                      </div>

                      <span className="status-badge">
                        {formatStatus(application.status)}
                      </span>
                    </div>

                    <div className="mobile-application-details">
                      <div className="mobile-detail-row">
                        <span className="mobile-detail-label">
                          Applied Date
                        </span>
                        <span>
                          {formatAppliedDate(application.appliedDate)}
                        </span>
                      </div>

                      <div className="mobile-detail-row">
                        <span className="mobile-detail-label">Location</span>
                        <span>{application.location || "—"}</span>
                      </div>

                      <div className="mobile-detail-row">
                        <span className="mobile-detail-label">Salary</span>
                        <span>{application.salary || "—"}</span>
                      </div>

                      <div className="mobile-detail-row">
                        <span className="mobile-detail-label">Source</span>
                        <span>{application.source || "—"}</span>
                      </div>
                    </div>

                    <div className="mobile-application-actions">
                      <button
                        type="button"
                        disabled={deletingApplicationId === application.id}
                        onClick={() => startEditing(application)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={deletingApplicationId === application.id}
                        onClick={() => handleDeleteApplication(application.id)}
                      >
                        {deletingApplicationId === application.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {pagination.totalApplications > 0 && (
          <div className="pagination">
            <button
              type="button"
              disabled={loading || !pagination.hasPreviousPage}
              onClick={() => setPage((currentPage) => currentPage - 1)}
            >
              Previous
            </button>

            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={loading || !pagination.hasNextPage}
              onClick={() => setPage((currentPage) => currentPage + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Applications;
