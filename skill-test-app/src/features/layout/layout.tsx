import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCurrentUser, useSignOut } from "../auth/use-session";
import { startLogin } from "../auth/sso";

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

  return (
    <>
      <header className="nav">
        <div className="nav__inner">
          <Link to="/" className="nav__brand">
            <LogoMark />
            <span className="nav__brand-name">
              Stage<span className="nav__brand-dot">Pass</span>
            </span>
          </Link>
          <nav className="nav__links">
            <NavLink to="/events" className={({ isActive }) => (isActive ? "is-active" : "")}>
              Events
            </NavLink>
            {user ? (
              <>
                <NavLink
                  to="/events/new"
                  className={({ isActive }) => (isActive ? "is-active" : "")}
                >
                  Create event
                </NavLink>
                <NavLink
                  to="/tickets"
                  className={({ isActive }) => (isActive ? "is-active" : "")}
                >
                  My tickets
                </NavLink>
              </>
            ) : null}
          </nav>
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
                Sign out
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
              Sign in
            </button>
          )}
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <footer className="page__footer">
        <span>© {new Date().getFullYear()} StagePass</span>
        <span className="page__footer-sep">·</span>
        <span>Built on SELISE Blocks</span>
      </footer>
    </>
  );
}