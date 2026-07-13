import type { CSSProperties } from "react";

type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
};

export function Skeleton({ className = "", style }: SkeletonProps) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={style}
      aria-hidden="true"
    />
  );
}

export function EventCardSkeleton() {
  return (
    <div className="event-card event-card--skeleton" aria-hidden="true">
      <Skeleton className="skeleton--cover" />
      <div className="event-card__body">
        <Skeleton className="skeleton--title" />
        <Skeleton className="skeleton--line skeleton--line-md" />
        <Skeleton className="skeleton--line skeleton--line-sm" />
        <Skeleton className="skeleton--badge" />
      </div>
    </div>
  );
}

export function EventCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div
      className="events__grid"
      aria-busy="true"
      aria-label="Loading events"
    >
      {Array.from({ length: count }, (_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function EventDetailSkeleton() {
  return (
    <section className="event-detail" aria-busy="true" aria-label="Loading event">
      <Skeleton className="skeleton--detail-cover" />
      <div className="event-detail__grid">
        <div className="event-detail__main">
          <Skeleton className="skeleton--line skeleton--line-sm" />
          <Skeleton className="skeleton--pill" />
          <Skeleton className="skeleton--detail-title" />
          <ul className="event-detail__meta">
            {Array.from({ length: 4 }, (_, i) => (
              <li key={i}>
                <Skeleton className="skeleton--line skeleton--line-xs" />
                <Skeleton className="skeleton--line skeleton--line-md" />
              </li>
            ))}
          </ul>
          <div className="event-detail__about">
            <Skeleton className="skeleton--line skeleton--line-sm" />
            <Skeleton className="skeleton--line" />
            <Skeleton className="skeleton--line" />
            <Skeleton className="skeleton--line skeleton--line-md" />
          </div>
        </div>
        <aside className="event-detail__aside">
          <div className="ticket-card">
            <Skeleton className="skeleton--line skeleton--line-sm" />
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="skeleton--ticket-option" />
            ))}
            <Skeleton className="skeleton--btn" />
          </div>
        </aside>
      </div>
    </section>
  );
}

export function TicketRowSkeleton() {
  return (
    <li className="ticket-row ticket-row--skeleton" aria-hidden="true">
      <div className="ticket-row__left">
        <Skeleton className="skeleton--pill" />
        <Skeleton className="skeleton--line skeleton--line-md" />
        <Skeleton className="skeleton--line skeleton--line-sm" />
      </div>
      <div className="ticket-row__right">
        <Skeleton className="skeleton--btn skeleton--btn-sm" />
        <Skeleton className="skeleton--badge" />
      </div>
    </li>
  );
}

export function TicketListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className="ticket-list" aria-busy="true" aria-label="Loading tickets">
      {Array.from({ length: count }, (_, i) => (
        <TicketRowSkeleton key={i} />
      ))}
    </ul>
  );
}

export function FormSkeleton() {
  return (
    <div className="create-event" aria-busy="true" aria-label="Loading form">
      <header className="events__header">
        <Skeleton className="skeleton--line skeleton--line-lg" />
        <Skeleton className="skeleton--line skeleton--line-md" />
      </header>
      <div className="create-event__form">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="field">
            <Skeleton className="skeleton--line skeleton--line-xs" />
            <Skeleton className="skeleton--input" />
          </div>
        ))}
        <Skeleton className="skeleton--upload" />
        <Skeleton className="skeleton--btn skeleton--btn-wide" />
      </div>
    </div>
  );
}
