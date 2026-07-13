import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { finishLogin } from "./sso";
import { PageBackdrop } from "../../components/page-backdrop";

export function CallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    finishLogin(window.location.search)
      .then(() => navigate("/", { replace: true }))
      .catch((e) => setError(String(e)));
  }, [navigate]);

  return (
    <>
      <PageBackdrop />
      <div className="auth-shell">
        <div className="auth-card" role="status" aria-live="polite">
          <div className="auth-card__surface">
            <div className="auth-card__head">
              {error ? (
                <>
                  <div className="feature-card__icon" aria-hidden="true">
                    !
                  </div>
                  <h2 className="auth-card__title">Sign-in failed</h2>
                  <p className="auth-card__lede">{error}</p>
                  <Link to="/" className="btn-primary auth-card__back">
                    Back to home
                  </Link>
                </>
              ) : (
                <>
                  <div className="spinner" aria-hidden="true" />
                  <h2 className="auth-card__title">Signing you in…</h2>
                  <p className="auth-card__lede">
                    Completing the secure handshake with SELISE Blocks. This usually
                    takes just a moment.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}