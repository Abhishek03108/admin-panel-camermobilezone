import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import Loader from "../common/Loader.jsx";

export default function ProtectedRoute({ children }) {
  const { admin, isLoading } = useAuth();

  if (isLoading) return <Loader full label="Checking your session…" />;
  if (!admin) return <Navigate to="/login" replace />;

  return children;
}
