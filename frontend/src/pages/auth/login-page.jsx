import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login } from "@/features/auth/auth-slice";
import { verifyLoginTfa } from "@/features/auth/auth-slice";
import { GOOGLE_AUTH_URL } from "@/lib/config";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showTfa, setShowTfa] = useState(false);
  const [tfaCode, setTfaCode] = useState("");
  const authStatus = useSelector((state) => state.auth.status);
  const authError = useSelector((state) => state.auth.error);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [localError, setLocalError] = useState("");

  const loading = authStatus === "loading";

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError("");

    if (!form.email.trim() || !form.password.trim()) {
      setLocalError("Email and password are required.");
      return;
    }

    try {
      const response = await dispatch(login(form)).unwrap();
      if (response.tfaRequired) {
        setShowTfa(true);
      } else {
        handleNavigation(response);
      }
    } catch (err) {}
  }

  async function handleTfaSubmit(event) {
    event.preventDefault();
    setLocalError("");

    try {
      const response = await dispatch(
        verifyLoginTfa({
          email: form.email,
          code: tfaCode,
        }),
      ).unwrap();
      handleNavigation(response);
    } catch (err) {
      setLocalError(err || "Invalid 2FA code.");
    }
  }

  function handleNavigation(response) {
    navigate(response.passwordSet ? "/dashboard" : "/set-password", {
      replace: true,
    });
  }

  if (showTfa) {
    return (
      <AuthShell
        centered
        title="Verification"
        subtitle="Enter the code from your authenticator app or a backup code."
        footer={
          <button
            onClick={() => setShowTfa(false)}
            className="flex items-center justify-center w-full text-sm text-muted-foreground hover:text-black transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
          </button>
        }
      >
        <form className="space-y-5" onSubmit={handleTfaSubmit}>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Security Code
            </Label>
            <Input
              autoFocus
              className="text-center font-mono text-xl tracking-[0.5em] hover:border-black"
              placeholder="000000"
              value={tfaCode}
              onChange={(e) => setTfaCode(e.target.value.trim())}
            />
          </div>

          {(localError || authError) && (
            <p className="text-sm text-red-800">{localError || authError}</p>
          )}

          <Button
            className="w-full rounded-xl"
            type="submit"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify & Log In"}
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      centered
      title="SCAPP."
      subtitle="Secure Simple SCAPP"
      footer={
        <div className="text-center text-sm text-muted-foreground hover:text-black hover:cursor-default">
          New here?{" "}
          <Link
            className="font-medium text-foreground hover:underline"
            to="/register"
          >
            Create One
          </Link>
        </div>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="login-email">Email</Label>
          <Input
            className="hover:border-black"
            id="login-email"
            autoComplete="email"
            placeholder="scapp.@example.com"
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="login-password">Password</Label>
          <Input
            className="hover:border-black"
            id="login-password"
            autoComplete="current-password"
            placeholder="**********"
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, password: event.target.value }))
            }
          />
        </div>

        {(localError || authError) && (
          <p className="text-sm text-red-800">{localError || authError}</p>
        )}

        <Button
          className="group relative h-10 w-full overflow-hidden rounded-xl transition-all duration-300"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            "Signing in..."
          ) : (
            <div className="flex items-center justify-center">
              <span className="transform transition-transform duration-300 group-hover:-translate-x-3">
                Login
              </span>
              <span className="absolute right-1/3 translate-x-10 opacity-0 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-100">
                →
              </span>
            </div>
          )}
        </Button>
      </form>

      <div className="space-y-2">
        <div className="relative text-center text-xs uppercase tracking-wider text-shadow-black">
          <span className="bg-card px-3">or</span>
          <div className="absolute left-0 top-1/2 -z-10 h-px w-full -translate-y-1/2 bg-border" />
        </div>

        <Button
          className="group h-10 w-full rounded-xl gap-3 font-semibold transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-[0.98]"
          type="button"
          variant="default"
          onClick={() => {
            window.location.href = GOOGLE_AUTH_URL;
          }}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-360"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue With Google
        </Button>
      </div>
    </AuthShell>
  );
}
