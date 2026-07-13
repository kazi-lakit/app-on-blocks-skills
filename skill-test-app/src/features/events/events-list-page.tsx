import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { gql, type GqlResult } from "../data/gateway";
import { EVENT_FIELDS, type Event } from "./api";
import { CATEGORIES, CATEGORY_KEYS, type Category } from "./constants";
import { EventCardSkeletonGrid } from "../../components/skeleton";
import { useT } from "../i18n";
import { Reveal } from "../../components/reveal";

function formatDate(value?: string | null) {
  if (!value) return "Date TBA";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function dateParts(value?: string | null) {
  if (!value) return { month: "TBA", day: "—", time: "" };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { month: "—", day: "?", time: "" };
  return {
    month: d.toLocaleString(undefined, { month: "short" }).toUpperCase(),
    day: String(d.getDate()),
    time: d.toLocaleString(undefined, { hour: "numeric", minute: "2-digit" }),
  };
}

function placeholderIcon(category?: string | null) {
  const c = (category ?? "").toLowerCase();
  if (c === "music") return "♪";
  if (c === "sports") return "�";
  if (c === "conference") return "▣";
  if (c === "theater") return "✦";
  if (c === "workshop") return "◈";
  if (c === "festival") return "✺";
  return "◆";
}

function categoryClass(c?: string | null) {
  switch ((c ?? "").toLowerCase()) {
    case "music":
      return "tag tag--music";
    case "sports":
      return "tag tag--sports";
    case "conference":
      return "tag tag--conference";
    case "theater":
      return "tag tag--theater";
    case "workshop":
      return "tag tag--workshop";
    case "festival":
      return "tag tag--festival";
    default:
      return "tag tag--other";
  }
}

function buildWhere(
  category: Category | "All",
  search: string
): Record<string, unknown> | undefined {
  const where: Record<string, unknown> = {};
  if (category !== "All") where.Category = { eq: category };
  const q = search.trim();
  if (q) where.Name = { contains: q };
  return Object.keys(where).length === 0 ? undefined : where;
}

function translateCategory(value: string | null | undefined, t: (k: string) => string): string {
  if (!value) return t("EVENTS_CATEGORY_OTHER");
  const key = CATEGORY_KEYS[value as Category];
  return key ? t(key) : value;
}

interface EventCardProps {
  event: Event;
  remaining: number;
  allocated: number;
  sold: number;
}

function EventCard({ event, remaining, allocated, sold }: EventCardProps) {
  const t = useT();
  const ref = useRef<HTMLAnchorElement | null>(null);
  const fill = allocated > 0 ? Math.min(1, sold / allocated) : 0;
  const isSoldOut = remaining <= 0;

  return (
    <Link
      ref={ref}
      to={`/events/${event.ItemId}`}
      className="event-card"
      style={{ ["--fill" as string]: fill }}
    >
      <div
        className="event-card__cover"
        style={
          event.ImageUrl
            ? { backgroundImage: `url(${event.ImageUrl})` }
            : undefined
        }
        aria-hidden="true"
      >
        {!event.ImageUrl ? (
          <div className="event-card__placeholder">
            <div className="event-card__placeholder-cal">
              <span className="event-card__placeholder-month">
                {dateParts(event.EventDate).month}
              </span>
              <span className="event-card__placeholder-day">
                {dateParts(event.EventDate).day}
              </span>
              {dateParts(event.EventDate).time ? (
                <span className="event-card__placeholder-time">
                  {dateParts(event.EventDate).time}
                </span>
              ) : null}
            </div>
            <span className="event-card__placeholder-hint">
              {placeholderIcon(event.Category)} No cover
            </span>
          </div>
        ) : null}
        <span className={categoryClass(event.Category)}>
          {translateCategory(event.Category, t)}
        </span>
      </div>
      <div className="event-card__body">
        <h3 className="event-card__title">{event.Name}</h3>
        <p className="event-card__meta">
          <span>{formatDate(event.EventDate)}</span>
          {event.Location ? (
            <>
              <span className="event-card__meta-dot" />
              <span>{event.Location}</span>
            </>
          ) : null}
        </p>
        <div className="event-card__foot">
          {isSoldOut ? (
            <span className="badge badge--sold">{t("EVENTS_SOLD_OUT")}</span>
          ) : (
            <span className="badge">
              {t("EVENTS_SEATS_LEFT", { count: remaining })}
            </span>
          )}
          <span className="event-card__arrow" aria-hidden="true">
            →
          </span>
        </div>
        <div className="event-card__capacity" aria-hidden="true">
          <span className="event-card__capacity-fill" />
        </div>
      </div>
    </Link>
  );
}

export function EventsListPage() {
  const [category, setCategory] = useState<Category | "All">("All");
  const [search, setSearch] = useState("");
  const t = useT();

  const where = useMemo(() => buildWhere(category, search), [category, search]);

  const eventsQuery = useQuery({
    queryKey: ["data", "getEvents", { where, pageNo: 1, pageSize: 100 }],
    queryFn: () =>
      gql<{ getEvents: GqlResult<Event> }>(
        `query($w:EventFilterInput,$p:PaginationInput){
           getEvents(where:$w,paging:$p){ totalCount items { ${EVENT_FIELDS} } }
         }`,
        { w: where, p: { pageNo: 1, pageSize: 100 } }
      ).then((d) => d.getEvents),
  });

  const ticketTotalsQuery = useQuery({
    queryKey: ["data", "getTicketTypes", "totals"],
    queryFn: () =>
      gql<{ getTicketTypes: GqlResult<{ EventId: string; SeatAllocation: number; SoldCount: number }> }>(
        `query($p:PaginationInput){ getTicketTypes(paging:$p){ totalCount items { EventId SeatAllocation SoldCount } } }`,
        { p: { pageNo: 1, pageSize: 500 } }
      ).then((d) => d.getTicketTypes),
  });

  const totalsByEvent = useMemo(() => {
    const map = new Map<string, { allocated: number; sold: number }>();
    ticketTotalsQuery.data?.items.forEach((t) => {
      if (!t.EventId) return;
      const cur = map.get(t.EventId) ?? { allocated: 0, sold: 0 };
      cur.allocated += t.SeatAllocation ?? 0;
      cur.sold += t.SoldCount ?? 0;
      map.set(t.EventId, cur);
    });
    return map;
  }, [ticketTotalsQuery.data]);

  const items = useMemo(() => {
    const list = eventsQuery.data?.items ?? [];
    return [...list].sort((a, b) => {
      const da = a.EventDate ? new Date(a.EventDate).getTime() : Infinity;
      const db = b.EventDate ? new Date(b.EventDate).getTime() : Infinity;
      return da - db;
    });
  }, [eventsQuery.data]);

  return (
    <section className="events">
      <Reveal variant="up">
        <header className="events__header">
          <div>
            <h1 className="events__title">{t("EVENTS_TITLE")}</h1>
            <p className="events__lede">{t("EVENTS_LEDE")}</p>
          </div>
        </header>
      </Reveal>

      <Reveal variant="up" delay={60}>
        <div className="events__toolbar">
          <div className="events__filters" role="tablist" aria-label="Categories">
            <button
              type="button"
              className={`chip ${category === "All" ? "chip--active" : ""}`}
              onClick={() => setCategory("All")}
            >
              {t("ALL")}
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={`chip ${category === c ? "chip--active" : ""}`}
                onClick={() => setCategory(c)}
              >
                {t(CATEGORY_KEYS[c])}
              </button>
            ))}
          </div>
          <input
            className="events__search"
            type="search"
            placeholder={t("EVENTS_SEARCH_PLACEHOLDER")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Reveal>

      {eventsQuery.isPending || ticketTotalsQuery.isPending ? (
        <EventCardSkeletonGrid count={6} />
      ) : eventsQuery.error ? (
        <div className="alert alert--error">
          {t("EVENTS_LOAD_ERROR_PREFIX")} {String(eventsQuery.error)}
        </div>
      ) : items.length === 0 ? (
        <Reveal variant="up">
          <div className="events__empty">
            <h2>{t("EVENTS_EMPTY_TITLE")}</h2>
            <p>{t("EVENTS_EMPTY_DESC")}</p>
          </div>
        </Reveal>
      ) : (
        <div className="events__grid reveal--stagger is-visible">
          {items.map((e, i) => {
            const totals = totalsByEvent.get(e.ItemId);
            const allocated = totals?.allocated ?? e.MaxSeats ?? 0;
            const sold = totals?.sold ?? 0;
            const remaining = Math.max(0, allocated - sold);
            return (
              <div
                key={e.ItemId}
                style={{ ["--stagger-index" as string]: i % 6 }}
              >
                <EventCard
                  event={e}
                  remaining={remaining}
                  allocated={allocated}
                  sold={sold}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
