import { Navigate, Outlet } from "react-router-dom";

interface TokenPayload {
  exp?: number;
}

function isTokenExpired(token: string) {
  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return true;
    }

    const payloadPart = parts[1].replace(/-/g, "+").replace(/_/g, "/");

    const paddedPayload = payloadPart.padEnd(
      Math.ceil(payloadPart.length / 4) * 4,
      "=",
    );

    const payload: TokenPayload = JSON.parse(atob(paddedPayload));

    if (typeof payload.exp !== "number") {
      return false;
    }

    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function ProtectedRoute() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (isTokenExpired(token)) {
    localStorage.removeItem("token");

    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
