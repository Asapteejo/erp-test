// src/dev-tools/DevUserPanel.jsx — FINAL VERSION (NO MORE REDIRECT LOOPS)
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const USERS = {
  superadmin: { role: "superadmin", schoolId: null,        name: "God Mode",           isSuperadmin: true },
  admin:      { role: "ADMIN",      schoolId: "azmah-college", name: "School Admin"       },
  lecturer:   { role: "LECTURER",   schoolId: "azmah-college", name: "Dr. John"           },
  student:    { role: "STUDENT",    schoolId: "azmah-college", name: "Aisha Musa"         },
  parent:     { role: "PARENT",     schoolId: "azmah-college", name: "Mrs. Fatima"        },
};

export default function DevUserPanel() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let key = params.get("as") || "student";
    if (!USERS[key]) key = "student";

    const u = USERS[key];

    window.__DEV_USER__ = {
      id: `dev-${key}`,
      email: `${key}@dev.local`,
      firstName: u.name.split(" ")[0],
      publicMetadata: {
        role: u.role,
        schoolId: u.schoolId,
        ...(u.isSuperadmin && { isSuperadmin: true }),
      },
    };

    console.log(`DEV USER → ${u.name} (${u.role})${u.schoolId ? ` • ${u.schoolId}` : ""}`);
  }, [location.search]);

  if (!import.meta.env.DEV) return null;

  const switchUser = (key) => {
    // THIS IS THE MAGIC — no page reload, no redirect loop
    navigate(`?as=${key}`, { replace: true });
  };

  const goHome = () => {
    localStorage.clear();
    window.__DEV_USER__ = null;
    navigate("/", { replace: true });
  };

  return (
    <div className="fixed bottom-4 left-4 z-[99999] bg-black text-white rounded-2xl shadow-2xl p-5 font-mono text-sm border border-purple-500/50">
      <div className="font-bold text-green-400 mb-3">DEV USER SWITCHER</div>
      {Object.entries(USERS).map(([key, u]) => (
        <button
          key={key}
          onClick={() => switchUser(key)}
          className={`block w-full text-left px-4 py-2 rounded transition ${
            location.search.includes(`as=${key}`) ? "bg-purple-600" : "hover:bg-white/20"
          }`}
        >
          {u.name} → {u.role}
        </button>
      ))}
      <button 
        onClick={goHome}
        className="block w-full text-left text-red-400 hover:bg-red-900/30 p-2 rounded mt-3 font-bold"
      >
        Clear & Go Home
      </button>
    </div>
  );
}