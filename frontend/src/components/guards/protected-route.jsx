import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export function ProtectedRoute({ children, requirePasswordSet = true }) {
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requirePasswordSet && user && !user.passwordSet) {
    return <Navigate to="/set-password" replace />;
  }

  return children;
}
