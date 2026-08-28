import { createContext, useContext, useState } from "react";

const RoleContext = createContext(null);

function readStored() {
  try { return localStorage.getItem("ep_role"); } catch { return null; }
}
function writeStored(r) {
  try { localStorage.setItem("ep_role", r); } catch { /* storage may be partitioned */ }
}

export function RoleProvider({ children }) {
  const [role, setRoleState] = useState(() => readStored() || null);

  const setRole = (r) => { writeStored(r); setRoleState(r); };
  const clearRole = () => { try { localStorage.removeItem("ep_role"); } catch {} setRoleState(null); };

  return (
    <RoleContext.Provider value={{ role, setRole, clearRole, isSeller: role === "seller", isBuyer: role === "buyer" }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
