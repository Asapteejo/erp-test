import React from "react";
import toast from "react-hot-toast";

export const DevBanner = ({ role, onSwitch }) => {
  const env = import.meta.env.MODE?.toUpperCase() || "UNKNOWN";
  const devActive = import.meta.env.VITE_USE_DEV_USER === "true";

  if (!devActive) return null;

  const handleSwitch = (newRole) => {
    onSwitch(newRole);
    toast.success(`Switched to ${newRole}`);
    setTimeout(() => window.location.reload(), 400);
  };

  return (
    <div className="fixed top-0 left-0 w-full bg-yellow-400 text-black text-sm py-2 px-4 flex justify-between items-center shadow-lg z-50">
      <span>
        🧪 Dev Mode Active ({env}) — Acting as{" "}
        <strong className="uppercase">{role || "UNKNOWN"}</strong>
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => handleSwitch("SUPERADMIN")}
          className="px-2 py-1 bg-white text-black rounded hover:bg-gray-100 text-xs font-semibold"
        >
          SuperAdmin
        </button>
        <button
          onClick={() => handleSwitch("SCHOOL_ADMIN")}
          className="px-2 py-1 bg-white text-black rounded hover:bg-gray-100 text-xs font-semibold"
        >
          SchoolAdmin
        </button>
        <button
          onClick={() => {
            localStorage.removeItem("devUser");
            toast("Signed out dev user");
            setTimeout(() => window.location.reload(), 400);
          }}
          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-semibold"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};
