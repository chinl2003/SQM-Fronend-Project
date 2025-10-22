import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "vendor" | "user";
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-center mt-10">Đang kiểm tra xác thực...</div>;

  if (requiredRole && user.role !== requiredRole || !user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
