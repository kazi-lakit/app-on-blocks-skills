import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { activateAccount } from "./activate";
import { useT } from "../i18n";
import { PageBackdrop } from "../../components/page-backdrop";

export function ActivatePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [code, setCode] = useState(params.get("code") ?? "");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const t = useT();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await activateAccount({ code, password, firstName, lastName });
      navigate("/", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageBackdrop />
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-card__surface">
            <div className="auth-card__head">
              <div className="feature-card__icon" aria-hidden="true">
                ✨
              </div>
              <h1 className="auth-card__title">{t("AUTH_ACTIVATE_TITLE")}</h1>
              <p className="auth-card__lede">{t("AUTH_ACTIVATE_LEDE")}</p>
            </div>

            <form className="form" onSubmit={onSubmit} noValidate>
          <div className="field">
            <label className="field__label" htmlFor="code">
              {t("AUTH_ACTIVATION_CODE")}
            </label>
            <input
              id="code"
              className="field__input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t("AUTH_ACTIVATION_CODE_PLACEHOLDER")}
              required
              autoComplete="one-time-code"
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field__label" htmlFor="firstName">
                {t("FIRST_NAME")}
              </label>
              <input
                id="firstName"
                className="field__input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ada"
                required
                autoComplete="given-name"
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="lastName">
                {t("LAST_NAME")}
              </label>
              <input
                id="lastName"
                className="field__input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Lovelace"
                required
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="password">
              {t("PASSWORD")}
            </label>
            <input
              id="password"
              className="field__input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("AUTH_PASSWORD_PLACEHOLDER")}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <span className="field__hint">{t("AUTH_PASSWORD_HINT")}</span>
          </div>

          {error && <div className="alert alert--error">{error}</div>}

          <button
            className="btn-primary form__submit"
            type="submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span
                  className="spinner spinner--inline"
                  aria-hidden="true"
                  style={{ width: 16, height: 16 }}
                />
                {t("BTN_ACTIVATING")}
              </>
            ) : (
              <>{t("BTN_ACTIVATE_ACCOUNT")}</>
            )}
          </button>

            <Link to="/" className="auth-card__back">
              {t("AUTH_BACK_TO_SIGN_IN")}
            </Link>
          </form>
          </div>
        </div>
      </div>
    </>
  );
}