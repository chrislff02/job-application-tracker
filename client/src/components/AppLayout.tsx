import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./AppLayout.css";

function AppLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove stored JWT so protected routes no longer
    // consider the user authenticated
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="app-layout">
      <header className="app-navbar">
        <div className="navbar-brand">Job Application Tracker</div>

        <nav className="navbar-links">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/applications"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Applications
          </NavLink>

          <NavLink
            to="/pipeline"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Pipeline
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Analytics
          </NavLink>
        </nav>

        <button className="logout-button" type="button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
