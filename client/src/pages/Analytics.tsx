import { useEffect, useState } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "../api/api";
import "./Analytics.css";

interface ApplicationsOverTime {
  date: string;
  count: number;
}

interface ApplicationSource {
  source: string;
  count: number;
}

interface StatusDistribution {
  status: string;
  count: number;
}

interface AnalyticsData {
  applicationsOverTime: ApplicationsOverTime[];
  applicationSources: ApplicationSource[];
  statusDistribution: StatusDistribution[];
  interviewRate: number;
  rejectionRate: number;
  offerRate: number;
  averageResponseTimeDays: number;
}

function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setError("");

        const response = await api.get("/dashboard/analytics");

        setAnalytics(response.data);
      } catch {
        setError("Unable to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <p>Loading analytics...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!analytics) {
    return <p>No analytics available.</p>;
  }

  const statusChartData = analytics.statusDistribution.map((item) => ({
    status: item.status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    count: item.count,
  }));

  return (
    <div className="analytics-page">
      <div className="analytics-container">
        <div className="analytics-header">
          <div>
            <h1>Analytics</h1>
            <p>Understand your job search performance.</p>
          </div>
        </div>

        <div className="analytics-stats">
          <div className="analytics-stat-card">
            <span>Interview Rate</span>
            <strong>{analytics.interviewRate}%</strong>
          </div>

          <div className="analytics-stat-card">
            <span>Rejection Rate</span>
            <strong>{analytics.rejectionRate}%</strong>
          </div>

          <div className="analytics-stat-card">
            <span>Offer Rate</span>
            <strong>{analytics.offerRate}%</strong>
          </div>

          <div className="analytics-stat-card">
            <span>Average Response Time</span>
            <strong>{analytics.averageResponseTimeDays} days</strong>
          </div>
        </div>

        <div className="analytics-grid">
          <div className="analytics-card">
            <h2>Applications Over Time</h2>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.applicationsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(`${value}T00:00:00`).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        },
                      )
                    }
                  />

                  <YAxis allowDecimals={false} />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#60a5fa"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="analytics-card">
            <h2>Application Sources</h2>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.applicationSources}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="source" />

                  <YAxis allowDecimals={false} />

                  <Tooltip />

                  <Bar dataKey="count" fill="#60a5fa" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="analytics-card status-chart-card">
          <h2>Status Distribution</h2>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="status" />

                <YAxis allowDecimals={false} domain={[0, "dataMax + 1"]} />

                <Tooltip />

                <Bar dataKey="count" fill="#60a5fa" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
