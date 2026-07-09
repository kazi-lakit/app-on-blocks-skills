import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCurrentUser, useSignOut } from "../auth/use-session";
import { startLogin } from "../auth/sso";
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

export function Layout() {
  const user = useCurrentUser();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const location = useLocation();
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
            <NavLink to="/events" className={({ isActive }) => (isActive ? "is-active" : "")}>
              {t("NAV_EVENTS")}
            </NavLink>
            {user ? (
              <>
                <NavLink
                  to="/events/new"
                  className={({ isActive }) => (isActive ? "is-active" : "")}
                >
                  {t("NAV_CREATE_EVENT")}
                </NavLink>
                <NavLink
                  to="/tickets"
                  className={({ isActive }) => (isActive ? "is-active" : "")}
                >
                  {t("NAV_MY_TICKETS")}
                </NavLink>
              </>
            ) : null}
          </nav>
          <div className="nav__right">
            <LanguageSwitcher />
            {user ? (
              <div className="nav__user">
                <span className="nav__user-name">{user.displayName}</span>
                <button
                  type="button"
                  className="nav__cta"
                  onClick={() => {
                    signOut()
                      .then(() => {
                        if (
                          location.pathname.startsWith("/events/") &&
                          location.pathname !== "/events"
                        ) {
                          navigate("/events", { replace: true });
                        }
                      })
                      .catch(() => undefined);
                  }}
                >
                  {t("ACTION_SIGN_OUT")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="nav__cta"
                onClick={() => {
                  startLogin().catch(() => navigate("/"));
                }}
              >
                {t("ACTION_SIGN_IN")}
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <footer className="page__footer">
        <span>© {new Date().getFullYear()} {t("BRAND_FALLBACK")}</span>
        <span className="page__footer-sep">·</span>
        <span>{t("FOOTER_BUILT_ON")}</span>
      </footer>
    </>
  );
}