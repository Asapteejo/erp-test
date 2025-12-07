// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useClerkAuth } from "../hooks/useClerkAuth";

const DEMO_MODE = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === "true";

// Optional helper (still supported)
function getLocalDevUser() {
  const keys = ["testUser", "demoUser", "devUser"];
  for (const key of keys) {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed?.role) return parsed;
      }
    } catch {}
  }
  return null;
}

export const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, role, isSignedIn, isDev } = useClerkAuth();

  const localTestUser = DEMO_MODE ? getLocalDevUser() : null;

// --- DEV MODE BYPASS — always treat as signed in ---
if (isDev) {
  console.warn("DEV MODE → ProtectedRoute bypass active", { role });

  const activeRole = (
    localTestUser?.role || 
    role || 
    "guest"
  ).toLowerCase();

  const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

  if (normalizedAllowed.length && !normalizedAllowed.includes(activeRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Always render children/outlet in dev
  return children ? children : <Outlet />;
}

  // --- PRODUCTION MODE BELOW ---

  const activeRole = (
    localTestUser?.role ||
    role ||
    "guest"
  ).toLowerCase();

  const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

  // Not signed in and no test user
  if (!isSignedIn && !localTestUser) {
    return <Navigate to="/sign-in" replace />;
  }

  // Role not allowed
  if (normalizedAllowed.length && !normalizedAllowed.includes(activeRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
