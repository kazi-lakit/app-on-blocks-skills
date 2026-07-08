import { Link } from "react-router-dom";
import { useCurrentUser } from "../auth/use-session";
import { LoginButton } from "../auth/login-button";

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
            <Link to="/events">Events</Link>
            {user ? (
              <>
                <Link to="/events/new">Create event</Link>
                <Link to="/tickets">My tickets</Link>
              </>
            ) : null}
          </nav>
          {user ? (
            <Link to="/events" className="nav__cta">
              Browse events
            </Link>
          ) : (
            <LoginButton />
          )}
        </div>
      </header>

      <main className="page">
        <section className="hero">
          <div className="hero__halo" aria-hidden="true" />
          <div className="hero__content">
            <span className="hero__eyebrow">
              <span className="hero__eyebrow-dot" />
              Event ticketing · Built on SELISE Blocks
            </span>
            <h1 className="hero__title">
              Every event,
              <br />
              <span className="hero__title-accent">one tap away.</span>
            </h1>
            <p className="hero__lede">
              Discover concerts, conferences, workshops and more — pick your
              seat, pick your price, and you're in. StagePass makes ticketing
              frictionless.
            </p>
            <div className="hero__actions">
              <Link to="/events" className="btn-primary">
                Browse events →
              </Link>
              {user ? (
                <Link to="/events/new" className="btn-ghost">
                  Create an event
                </Link>
              ) : (
                <LoginButton />
              )}
            </div>
            <ul className="hero__pills">
              <li>
                <span className="dot dot--green" /> Secure sign-in
              </li>
              <li>
                <span className="dot dot--blue" /> Multi-tier ticketing
              </li>
              <li>
                <span className="dot dot--pink" /> Real-time availability
              </li>
            </ul>
          </div>
        </section>

        <section className="features" id="features">
          <article className="feature-card">
            <div className="feature-card__icon" aria-hidden="true">
              🎟
            </div>
            <h3>Multi-tier ticketing</h3>
            <p>
              VIP, Regular, Student — set seat allocations and prices per
              ticket type, then watch availability update in real time.
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-card__icon" aria-hidden="true">
              🗓
            </div>
            <h3>Rich event details</h3>
            <p>
              Date, location, category, cover image — everything attendees
              need to decide, in one clean page.
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-card__icon" aria-hidden="true">
              ⚡
            </div>
            <h3>Sold-out handling</h3>
            <p>
              Per-type and event-level sold-out states appear automatically, so
              no one wastes time on a full house.
            </p>
          </article>
        </section>

        <footer className="page__footer">
          <span>© {new Date().getFullYear()} StagePass</span>
          <span className="page__footer-sep">·</span>
          <span>Powered by SELISE Blocks</span>
        </footer>
      </main>
    </>
  );
}