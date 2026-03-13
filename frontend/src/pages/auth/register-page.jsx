import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { register } from "@/features/auth/auth-slice";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GOOGLE_AUTH_URL } from "@/lib/config.js";

export function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authStatus = useSelector((state) => state.auth.status);
  const authError = useSelector((state) => state.auth.error);
  const [form, setForm] = useState({
    username: "",
    email: "",
  });
  const [localError, setLocalError] = useState("");

  const loading = authStatus === "loading";

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError("");

    if (!form.username.trim() || !form.email.trim()) {
      setLocalError("Username and email are required.");
      return;
    }

    try {
      await dispatch(
        register({
          username: form.username.trim(),
          email: form.email.trim(),
        }),
      ).unwrap();
      navigate("/set-password", { replace: true });
    } catch {
      // Redux slice handles global error state
    }
  }

  return (
    <AuthShell
      centered
      title="SCAPP."
      subtitle="Let's get started"
      footer={
        <div className="text-center text-sm text-muted-foreground hover:text-black hover:cursor-default">
          Already have an account?{" "}
          <Link
            className="font-medium text-foreground hover:underline"
            to="/login"
          >
            Login
          </Link>
        </div>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="register-name">Username</Label>
          <Input
            className="hover:border-black"
            id="register-name"
            placeholder="scapp.user"
            value={form.username}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, username: event.target.value }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="register-email">Email</Label>
          <Input
            className="hover:border-black"
            id="register-email"
            type="email"
            placeholder="scapp.@example.com"
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
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
            "Creating..."
          ) : (
            <div className="flex items-center justify-center">
              <span className="transform transition-transform duration-300 group-hover:-translate-x-3">
                Create
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
          Create With Google
        </Button>
      </div>
    </AuthShell>
  );
}
