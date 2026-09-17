import { useEffect, useState } from "react";
import api from "../api/api";

interface DashboardStats {
  totalApplications: number;
  applicationsThisWeek: number;
  interviews: number;
  offers: number;
  responseRate: number;
  interviewConversionRate: number;
}

function Dashboard() {
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
    <div>
      <h1>Dashboard</h1>

      <div>
        <p>Total Applications: {stats.totalApplications}</p>
        <p>Applications This Week: {stats.applicationsThisWeek}</p>
        <p>Interviews: {stats.interviews}</p>
        <p>Offers: {stats.offers}</p>
        <p>Response Rate: {stats.responseRate}%</p>
        <p>Interview Conversion Rate: {stats.interviewConversionRate}%</p>
      </div>
    </div>
  );
}

export default Dashboard;
