// src/pages/DevTools.jsx
import React from "react";

const DevTools = () => {
  const setTestUser = (role, email) => {
    localStorage.setItem("testUser", JSON.stringify({ role, email }));
    window.location.reload();
  };

  const resetUser = () => {
    localStorage.removeItem("testUser");
    window.location.reload();
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-teal-600">
        🧪 Dev Tools – Role Switcher
      </h1>
      <p className="text-gray-600 mb-8 text-sm">
        (This page only works in DEV or DEMO mode)
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setTestUser("SUPER_ADMIN", "superadmin@test.com")}
          className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700"
        >
          Switch to SUPER_ADMIN
        </button>

        <button
          onClick={() => setTestUser("SCHOOL_ADMIN", "schooladmin@test.com")}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Switch to SCHOOL_ADMIN
        </button>

        <button
          onClick={() => setTestUser("LECTURER", "lecturer@test.com")}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
        >
          Switch to LECTURER
        </button>

        <button
          onClick={() => setTestUser("STUDENT", "student@test.com")}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
        >
          Switch to STUDENT
        </button>
      </div>

      <button
        onClick={resetUser}
        className="mt-8 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
      >
        Reset to Real Clerk User
      </button>
    </main>
  );
};

export default DevTools;
