import { Link } from "react-router-dom";
import { useCurrentUser } from "../auth/use-session";
import { LoginButton } from "../auth/login-button";
import { LanguageSwitcher, useT } from "../i18n";

function LogoMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <span className="brand-mark__cube" />
      <span className="brand-mark__cube" />
      <span className="brand-mark__cube" />
      <span className="brand-mark__cube" />
    </div>
  );
}

export function HomePage() {
  const user = useCurrentUser();
  const t = useT();

  return (
    <>
      <header className="nav">
        <div className="nav__inner">
          <Link to="/" className="nav__brand">
            <LogoMark />
            <span className="nav__brand-name">
              {t("BRAND_NAME_1")}
              <span className="nav__brand-dot">{t("BRAND_NAME_2")}</span>
            </span>
          </Link>
          <nav className="nav__links">
            <Link to="/events">{t("NAV_EVENTS")}</Link>
            {user ? (
              <>
                <Link to="/events/new">{t("NAV_CREATE_EVENT")}</Link>
                <Link to="/tickets">{t("NAV_MY_TICKETS")}</Link>
              </>
            ) : null}
          </nav>
          <div className="nav__right">
            <LanguageSwitcher />
            {user ? (
              <Link to="/events" className="nav__cta">
                {t("NAV_BROWSE_EVENTS")}
              </Link>
            ) : (
              <LoginButton />
            )}
          </div>
        </div>
      </header>

      <main className="page">
        <section className="hero">
          <div className="hero__halo" aria-hidden="true" />
          <div className="hero__content">
            <span className="hero__eyebrow">
              <span className="hero__eyebrow-dot" />
              {t("HOME_EYEBROW")}
            </span>
            <h1 className="hero__title">
              {t("HOME_TITLE_LINE_1")}
              <br />
              <span className="hero__title-accent">{t("HOME_TITLE_LINE_2")}</span>
            </h1>
            <p className="hero__lede">{t("HOME_LEDE")}</p>
            <div className="hero__actions">
              <Link to="/events" className="btn-primary">
                {t("HOME_BROWSE_EVENTS")}
              </Link>
              {user ? (
                <Link to="/events/new" className="btn-ghost">
                  {t("HOME_CREATE_EVENT")}
                </Link>
              ) : (
                <LoginButton />
              )}
            </div>
            <ul className="hero__pills">
              <li>
                <span className="dot dot--green" /> {t("HOME_PILL_SIGNIN")}
              </li>
              <li>
                <span className="dot dot--blue" /> {t("HOME_PILL_MULTITIER")}
              </li>
              <li>
                <span className="dot dot--pink" /> {t("HOME_PILL_REALTIME")}
              </li>
            </ul>
          </div>
        </section>

        <section className="features" id="features">
          <article className="feature-card">
            <div className="feature-card__icon" aria-hidden="true">
              🎟
            </div>
            <h3>{t("HOME_FEATURE_MULTITIER_TITLE")}</h3>
            <p>{t("HOME_FEATURE_MULTITIER_DESC")}</p>
          </article>
          <article className="feature-card">
            <div className="feature-card__icon" aria-hidden="true">
              🗓
            </div>
            <h3>{t("HOME_FEATURE_DETAILS_TITLE")}</h3>
            <p>{t("HOME_FEATURE_DETAILS_DESC")}</p>
          </article>
          <article className="feature-card">
            <div className="feature-card__icon" aria-hidden="true">
              ⚡
            </div>
            <h3>{t("HOME_FEATURE_SOLDOUT_TITLE")}</h3>
            <p>{t("HOME_FEATURE_SOLDOUT_DESC")}</p>
          </article>
        </section>

        <footer className="page__footer">
          <span>© {new Date().getFullYear()} {t("BRAND_FALLBACK")}</span>
          <span className="page__footer-sep">·</span>
          <span>{t("FOOTER_POWERED_BY")}</span>
        </footer>
      </main>
    </>
  );
}