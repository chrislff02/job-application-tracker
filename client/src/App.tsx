import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import Applications from "./pages/Applications";
import ApplicationDetails from "./pages/ApplicationDetails";
import Pipeline from "./pages/Pipeline";
import Analytics from "./pages/Analytics";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/applications/:id" element={<ApplicationDetails />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>
    </Routes>
  );
}

export default App;
