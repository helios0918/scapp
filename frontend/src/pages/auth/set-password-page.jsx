import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchMe, logout, setPassword } from "@/features/auth/auth-slice";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SetPasswordPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const authStatus = useSelector((state) => state.auth.status);
  const authError = useSelector((state) => state.auth.error);
  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [localError, setLocalError] = useState("");

  const loading = authStatus === "loading";

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError("");

    // 1. Client-side Validation
    if (form.newPassword.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    try {
      // 2. Dispatch setPassword with the specific field required by your API
      await dispatch(
        setPassword({
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        }),
      ).unwrap();

      // 3. Re-fetch user data to ensure the session/state is updated
      const updated = await dispatch(fetchMe()).unwrap();
      const tfaEnabled =
        updated?.isTfaEnabled !== undefined
          ? updated.isTfaEnabled
          : updated?.tfaEnabled;

      // 4. Redirect to 2FA setup for new users, otherwise go to dashboard
      navigate(tfaEnabled ? "/dashboard" : "/setup-2fa", { replace: true });
    } catch (err) {
      // Errors are caught here if unwrap() fails,
      // but UI will display authError from Redux state.
    }
  }

  return (
    <AuthShell
      centered
      title="SCAPP."
      subtitle={`Set your password before entering arcs${
        user?.email ? ` (${user.email})` : ""
      }.`}
      footer={
        <Button
          className="h-auto p-0 text-sm text-muted-foreground hover:text-black hover:underline hover:bg-transparent"
          type="button"
          variant="ghost"
          onClick={() => {
            dispatch(logout());
            navigate("/login", { replace: true });
          }}
        >
          Sign in with another account
        </Button>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input
            className="hover:border-black"
            id="new-password"
            type="password"
            placeholder="At least 6 characters"
            value={form.newPassword}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, newPassword: event.target.value }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            className="hover:border-black"
            id="confirm-password"
            type="password"
            placeholder="Repeat your password"
            value={form.confirmPassword}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                confirmPassword: event.target.value,
              }))
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
            "Saving..."
          ) : (
            <div className="flex items-center justify-center">
              <span className="transform transition-transform duration-300 group-hover:-translate-x-3">
                Set password
              </span>
              <span className="absolute right-1/3 translate-x-10 opacity-0 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-100">
                →
              </span>
            </div>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
