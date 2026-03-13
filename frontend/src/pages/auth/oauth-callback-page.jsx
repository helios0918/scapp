import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchMe, setCredentials } from "@/features/auth/auth-slice";
import { AuthShell } from "@/components/layout/auth-shell";

export function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function completeOAuth() {
      const token = params.get("token");
      const username = params.get("username");
      const email = params.get("email");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      dispatch(
        setCredentials({
          token,
          user: {
            username,
            email,
            passwordSet: false,
          },
        }),
      );

      try {
        const result = await dispatch(fetchMe()).unwrap();
        if (!isMounted) {
          return;
        }
        navigate(result.passwordSet ? "/dashboard" : "/set-password", {
          replace: true,
        });
      } catch {
        if (!isMounted) {
          return;
        }
        navigate("/set-password", { replace: true });
      }
    }

    completeOAuth();

    return () => {
      isMounted = false;
    };
  }, [dispatch, navigate, params]);

  return (
    <AuthShell
      centered
      title="SCAPP."
      subtitle="Completing your Google sign in."
    >
      <div className="space-y-2 text-center text-sm text-muted-foreground">
        <p>We are validating your token and syncing profile data.</p>
        <p>Please wait...</p>
      </div>
    </AuthShell>
  );
}
