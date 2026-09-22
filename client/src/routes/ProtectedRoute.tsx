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

    // JWT payloads use Base64URL encoding, so convert it to
    // standard Base64 before decoding it in the browser
    const payloadPart = parts[1].replace(/-/g, "+").replace(/_/g, "/");

    const paddedPayload = payloadPart.padEnd(
      Math.ceil(payloadPart.length / 4) * 4,
      "=",
    );

    const payload: TokenPayload = JSON.parse(atob(paddedPayload));

    // Tokens created by this application always include an
    // expiration time, so a missing exp is treated as invalid
    if (typeof payload.exp !== "number") {
      return true;
    }

    return payload.exp * 1000 <= Date.now();
  } catch {
    // Malformed tokens should never grant access to protected pages
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
