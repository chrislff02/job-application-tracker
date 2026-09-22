import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/api";
import "./Dashboard.css";

interface DashboardStats {
  totalApplications: number;
  applicationsThisWeek: number;
  interviews: number;
  offers: number;
  responseRate: number;
  interviewConversionRate: number;
}

interface RecentApplication {
  id: number;
  company: string;
  position: string;
  status: string;
  location: string | null;
  createdAt: string;
}

interface UpcomingInterview {
  id: number;
  type: string;
  dateTime: string;
  interviewer: string | null;
  application: {
    id: number;
    company: string;
    position: string;
  };
}

interface DashboardOverview {
  recentApplications: RecentApplication[];
  upcomingInterviews: UpcomingInterview[];
}

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchDashboard = async () => {
      try {
        setError("");

        // Dashboard stats & overview data are independent
        // so load both requests in parallel
        const [statsResponse, overviewResponse] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/dashboard/overview"),
        ]);

        if (cancelled) {
          return;
        }

        setStats(statsResponse.data);
        setOverview(overviewResponse.data);
      } catch {
        if (!cancelled) {
          setError("Unable to load dashboard");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const formatStatus = (status: string) => {
    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!stats || !overview) {
    return <p>No dashboard data available.</p>;
  }

  return (
    <div className="dashboard-page">
      <main className="dashboard-content">
        <div className="dashboard-title">
          <h2>Overview</h2>
          <p>Track your job search progress.</p>
        </div>

        <section className="stats-grid">
          <div className="stat-card">
            <span>Total Applications</span>
            <strong>{stats.totalApplications}</strong>
          </div>

          <div className="stat-card">
            <span>Added This Week</span>
            <strong>{stats.applicationsThisWeek}</strong>
          </div>

          <div className="stat-card">
            <span>In Interview Stages</span>
            <strong>{stats.interviews}</strong>
          </div>

          <div className="stat-card">
            <span>Offers</span>
            <strong>{stats.offers}</strong>
          </div>

          <div className="stat-card">
            <span>Response Rate</span>
            <strong>{stats.responseRate}%</strong>
          </div>

          <div className="stat-card">
            <span>Interview Conversion Rate</span>
            <strong>{stats.interviewConversionRate}%</strong>
          </div>
        </section>

        <section className="dashboard-overview-grid">
          <div className="dashboard-overview-card">
            <div className="dashboard-section-header">
              <div>
                <h3>Recent Applications</h3>
                <p>Your latest tracked applications.</p>
              </div>

              <Link to="/applications">View All</Link>
            </div>

            {overview.recentApplications.length === 0 ? (
              <div className="dashboard-empty-state">No applications yet.</div>
            ) : (
              <div className="recent-applications-list">
                {overview.recentApplications.map((application) => (
                  <Link
                    to={`/applications/${application.id}`}
                    className="recent-application-item"
                    key={application.id}
                  >
                    <div>
                      <strong>{application.company}</strong>
                      <span>{application.position}</span>
                    </div>

                    <div className="recent-application-meta">
                      <span className="dashboard-status-badge">
                        {formatStatus(application.status)}
                      </span>

                      <span>{application.location || "—"}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-overview-card">
            <div className="dashboard-section-header">
              <div>
                <h3>Upcoming Interviews</h3>
                <p>Your next scheduled interviews.</p>
              </div>
            </div>

            {overview.upcomingInterviews.length === 0 ? (
              <div className="dashboard-empty-state">
                No upcoming interviews.
              </div>
            ) : (
              <div className="upcoming-interviews-list">
                {overview.upcomingInterviews.map((interview) => (
                  <Link
                    to={`/applications/${interview.application.id}`}
                    className="upcoming-interview-item"
                    key={interview.id}
                  >
                    <div>
                      <strong>{interview.type}</strong>

                      <span>
                        {interview.application.company} ·{" "}
                        {interview.application.position}
                      </span>
                    </div>

                    <div className="upcoming-interview-meta">
                      <span>
                        {new Date(interview.dateTime).toLocaleString()}
                      </span>

                      <span>
                        {interview.interviewer || "Interviewer not added"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
