import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export function PublicRoute({ children }) {
  const token = useSelector((state) => state.auth.token);
  const passwordSet = useSelector((state) => state.auth.user?.passwordSet);

  if (!token) {
    return children;
  }

  return <Navigate to={passwordSet ? "/dashboard" : "/set-password"} replace />;
}
