import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCurrentUser, useSignOut } from "../auth/use-session";
import { startLogin } from "../auth/sso";
import { LanguageSwitcher, useT } from "../i18n";
import { PageBackdrop } from "../../components/page-backdrop";

function LogoMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <path d="M12 2 L20 7 L20 17 L12 22 L4 17 L4 7 Z" />
        <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
        <path d="M12 2 L12 9.5" />
      </svg>
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
      <PageBackdrop />
      <div className="site">
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
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive || location.pathname === "/events" ? "is-active" : ""
                }
              >
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
                            location.pathname !== "/events" &&
                            location.pathname !== "/"
                          ) {
                            navigate("/", { replace: true });
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
                  className="nav__signin"
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
      </div>
    </>
  );
}
