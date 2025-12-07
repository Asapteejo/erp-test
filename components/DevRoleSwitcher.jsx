// src/components/DevRoleSwitcher.jsx
export const DevRoleSwitcher = () => {
  if (!import.meta.env.DEV) return null;

  const setRole = (role) => {
    localStorage.setItem("testUser", JSON.stringify({ role }));
    window.location.reload();
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 10,
        right: 10,
        padding: "10px 15px",
        background: "#222",
        color: "#fff",
        borderRadius: "8px",
        zIndex: 9999,
      }}
    >
      <strong>Dev Role:</strong>{" "}
      {["superadmin", "schooladmin", "lecturer", "student"].map((r) => (
        <button
          key={r}
          onClick={() => setRole(r)}
          style={{
            marginLeft: 6,
            padding: "4px 8px",
            borderRadius: "4px",
            border: "none",
            background: "#555",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {r}
        </button>
      ))}
    </div>
  );
};
