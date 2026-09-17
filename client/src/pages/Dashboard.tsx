import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/dashboard/stats");
        setStats(response.data);
      } catch {
        setError("Unable to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!stats) {
    return <p>No dashboard data available.</p>;
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Job Application Tracker</h1>
          <p>Dashboard</p>
        </div>

        <button onClick={handleLogout}>Logout</button>
      </header>

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
            <span>Applications This Week</span>
            <strong>{stats.applicationsThisWeek}</strong>
          </div>

          <div className="stat-card">
            <span>Interviews</span>
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
      </main>
    </div>
  );
}

export default Dashboard;
