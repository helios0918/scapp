import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/layout/auth-shell";
import { TwoFactorSetup } from "@/components/layout/two-factor-setup";
import { Button } from "@/components/ui/button";
import { fetchMe } from "@/features/auth/auth-slice";

export function TfaOnboardingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isEnabled = Boolean(user?.isTfaEnabled);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) {
      dispatch(fetchMe());
    }
  }, [dispatch, user]);

  async function handleEnabled() {
    setMessage("");
    try {
      await dispatch(fetchMe()).unwrap();
      setMessage("Authenticator enabled.");
    } catch {
      setMessage("Authenticator enabled.");
    }
  }

  return (
    <AuthShell
      centered
      title="SCAPP."
      subtitle="Add an extra layer of security for your account."
      footer={
        <div className="text-center text-sm text-muted-foreground">
          You can enable or disable this later in your profile settings.
        </div>
      }
    >
      <div className="space-y-6">
        {isEnabled ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <ShieldCheck className="h-5 w-5" />
              Authenticator Active
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              Your account is protected with 2FA.
            </p>
          </div>
        ) : (
          <TwoFactorSetup isEnabled={isEnabled} onEnabled={handleEnabled} />
        )}

        {message ? <p className="text-sm text-blue-700">{message}</p> : null}

        <div className="flex flex-col gap-2">
          {!isEnabled && (
            <Button
              className="rounded-xl"
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard", { replace: true })}
            >
              Skip for now
            </Button>
          )}
        </div>
      </div>
    </AuthShell>
  );
}
