import { useState, useEffect } from "react";

interface User {
  fullName: string;
  role: "admin" | "vendor" | "user";
  userId: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fullName = localStorage.getItem("fullName");
    const role = localStorage.getItem("role");
    const userId = localStorage.getItem("userId");

    if (fullName && role && userId) {
      setUser({
        fullName,
        role: role as User["role"],
        userId
      });
    }

    setLoading(false);
  }, []);

  return { user, loading };
}
