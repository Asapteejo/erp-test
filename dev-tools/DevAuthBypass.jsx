// src/dev-tools/DevAuthBypass.jsx — FINAL VERSION (no useLocation!)
import { useEffect } from "react";

const DEV_ROLES = {
  superadmin: { role: "superadmin", schoolId: null, userId: "dev-superadmin", name: "God Mode", isSuperadmin: true },
  admin:      { role: "ADMIN",      schoolId: "azmah-college", userId: "dev-admin-1", name: "School Admin" },
  lecturer:   { role: "LECTURER",   schoolId: "azmah-college", userId: "dev-lec-1", name: "Dr. John" },
  student:    { role: "STUDENT",    schoolId: "azmah-college", userId: "dev-student-123", name: "Aisha Musa" },
  parent:     { role: "PARENT",     schoolId: "azmah-college", userId: "dev-parent-999", name: "Mrs. Fatima" },
};

let hasSetupDevUser = false;

export default function DevAuthBypass({ children }) {
  useEffect(() => {
    if (!import.meta.env.DEV || hasSetupDevUser) return;

    const params = new URLSearchParams(window.location.search);
    let role = params.get("as") || "student";
    if (!DEV_ROLES[role]) role = "student";

    const userData = DEV_ROLES[role];

    window.Clerk = {
      user: {
        id: userData.userId,
        firstName: userData.name.split(" ")[0],
        lastName: userData.name.split(" ").slice(1).join(" ") || "",
        primaryEmailAddress: { emailAddress: `${userData.userId}@dev.local` },
        publicMetadata: {
          role: userData.role,
          schoolId: userData.schoolId,
          ...(userData.isSuperadmin && { isSuperadmin: true }),
        },
      },
      session: { user: userData },
    };

    console.log(`DEV MODE → ${userData.name} (${userData.role})`, "color: #8b5cf6; font-weight: bold;");

    // Fix URL without triggering re-render loop
    if (!params.has("as")) {
      history.replaceState(null, "", `?as=${role}`);
    }

    hasSetupDevUser = true;
  }, []);

  return children;
}