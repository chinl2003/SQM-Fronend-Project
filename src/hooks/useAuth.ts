import { useState, useEffect } from "react";

interface User {
  fullName: string;
  role: "admin" | "vendor" | "user";
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fullName = localStorage.getItem("fullName");
    const role = localStorage.getItem("role");

    if (fullName && role) {
      setUser({
        fullName,
        role: role as User["role"],
      });
    }

    setLoading(false);
  }, []);

  return { user, loading };
}
