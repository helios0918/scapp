import { createBrowserRouter, Link, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { PublicRoute } from "@/components/guards/public-route";
import { ProtectedRoute } from "@/components/guards/protected-route";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { LoginPage } from "@/pages/auth/login-page";
import { RegisterPage } from "@/pages/auth/register-page";
import { SetPasswordPage } from "@/pages/auth/set-password-page";
import { TfaOnboardingPage } from "@/pages/auth/tfa-onboarding-page";
import { OAuthCallbackPage } from "@/pages/auth/oauth-callback-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { ProfilePage } from "@/pages/profile-page";
import { RoomPage } from "@/pages/room-page";

function HomeRedirect() {
  const token = useSelector((state) => state.auth.token);
  const passwordSet = useSelector((state) => state.auth.user?.passwordSet);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={passwordSet ? "/dashboard" : "/set-password"} replace />;
}

function NotFoundPage() {
  return (
    <AuthShell centered title="SCAPP." subtitle="Page not found.">
      <div className="space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          404
        </p>
        <p className="text-sm text-muted-foreground">
          The page you are looking for does not exist.
        </p>
        <Button asChild className="h-10 w-full rounded-xl">
          <Link to="/dashboard">Return to dashboard</Link>
        </Button>
      </div>
    </AuthShell>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeRedirect />,
  },
  {
    path: "/login",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <PublicRoute>
        <RegisterPage />
      </PublicRoute>
    ),
  },
  {
    path: "/oauth2/callback",
    element: <OAuthCallbackPage />,
  },
  {
    path: "/set-password",
    element: (
      <ProtectedRoute requirePasswordSet={false}>
        <SetPasswordPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/setup-2fa",
    element: (
      <ProtectedRoute>
        <TfaOnboardingPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/room/:roomCode",
    element: (
      <ProtectedRoute>
        <RoomPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
