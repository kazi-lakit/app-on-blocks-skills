import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gql, type ActionResponse, type GqlResult } from "../data/gateway";
import { useCurrentUser } from "../auth/use-session";
import { EVENT_FIELDS, type Event } from "./api";
import type { TicketType } from "./ticket-types";
import { CATEGORY_KEYS, type Category } from "./constants";
import { EventDetailSkeleton, Skeleton } from "../../components/skeleton";
import { useT, useTn } from "../i18n";
import { Reveal } from "../../components/reveal";

const TICKET_TYPE_FIELDS =
  "ItemId EventId Name Price SeatAllocation SoldCount";

function formatDate(value?: string | null) {
  if (!value) return "Date TBA";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function translateCategory(value: string | null | undefined, t: (k: string) => string): string {
  if (!value) return t("EVENTS_CATEGORY_OTHER");
  const key = CATEGORY_KEYS[value as Category];
  return key ? t(key) : value;
}

export function EventDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const qc = useQueryClient();
  const t = useT();
  const tn = useTn();

  const eventQuery = useQuery({
    queryKey: ["data", "getEvents", { id }],
    enabled: !!id,
    queryFn: () =>
      gql<{ getEvents: GqlResult<Event> }>(
        `query($w:EventFilterInput,$p:PaginationInput){ getEvents(where:$w,paging:$p){ items { ${EVENT_FIELDS} } } }`,
        {
          w: { ItemId: { eq: id } },
          p: { pageNo: 1, pageSize: 1 },
        }
      ).then((d) => d.getEvents.items[0]),
  });

  const ticketTypesQuery = useQuery({
    queryKey: ["data", "getTicketTypes", { eventId: id }],
    enabled: !!id,
    queryFn: () =>
      gql<{ getTicketTypes: GqlResult<TicketType> }>(
        `query($w:TicketTypeFilterInput,$p:PaginationInput){ getTicketTypes(where:$w,paging:$p){ items { ${TICKET_TYPE_FIELDS} } } }`,
        {
          w: { EventId: { eq: id } },
          p: { pageNo: 1, pageSize: 50 },
        }
      ).then((d) => d.getTicketTypes.items),
  });

  const event = eventQuery.data;
  const ticketTypes = ticketTypesQuery.data ?? [];

  const totals = useMemo(() => {
    const allocated = ticketTypes.reduce((s, t) => s + (t.SeatAllocation ?? 0), 0);
    const sold = ticketTypes.reduce((s, t) => s + (t.SoldCount ?? 0), 0);
    return { allocated, sold, remaining: Math.max(0, allocated - sold) };
  }, [ticketTypes]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const selected = ticketTypes.find((t) => t.ItemId === selectedId) ?? null;
  const selectedRemaining = selected
    ? Math.max(0, (selected.SeatAllocation ?? 0) - (selected.SoldCount ?? 0))
    : 0;
  const selectedSoldOut = !!selected && selectedRemaining <= 0;
  const canBuy =
    !!user &&
    !!selected &&
    !selectedSoldOut &&
    quantity > 0 &&
    quantity <= selectedRemaining;

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!event || !selected || !user) throw new Error("Missing data");
      const totalPrice = (selected.Price ?? 0) * quantity;

      const purchaseRes = await gql<{ insertPurchase: ActionResponse }>(
        `mutation($input:PurchaseInsertInput!){
           insertPurchase(input:$input){ acknowledged itemId totalImpactedData message }
         }`,
        {
          input: {
            EventId: event.ItemId,
            EventName: event.Name,
            TicketTypeId: selected.ItemId,
            TicketTypeName: selected.Name,
            UserId: user.userId,
            UserName: user.displayName,
            Quantity: quantity,
            TotalPrice: totalPrice,
            Status: "confirmed",
          },
        }
      );

      const newSold = (selected.SoldCount ?? 0) + quantity;
      await gql<{ updateTicketType: ActionResponse }>(
        `mutation($w:TicketTypeFilterInput,$input:TicketTypeUpdateInput!){
           updateTicketType(where:$w,input:$input){ acknowledged totalImpactedData message }
         }`,
        {
          w: { ItemId: { eq: selected.ItemId } },
          input: { SoldCount: newSold },
        }
      );

      return purchaseRes.insertPurchase;
    },
    onSuccess: () => {
      setPurchaseError(null);
      qc.invalidateQueries({ queryKey: ["data", "getTicketTypes"] });
      qc.invalidateQueries({ queryKey: ["data", "getPurchases"] });
      qc.invalidateQueries({ queryKey: ["data", "getEvents"] });
      navigate("/tickets?just=" + id);
    },
    onError: (e) => setPurchaseError(e instanceof Error ? e.message : String(e)),
  });

  if (eventQuery.isPending) {
    return <EventDetailSkeleton />;
  }

  if (eventQuery.error || !event) {
    return (
      <div className="alert alert--error">
        {t("EVENT_NOT_FOUND")}{" "}
        <Link to="/events" className="link">
          {t("EVENT_BACK_ALL")}
        </Link>
      </div>
    );
  }

  return (
    <section className="event-detail">
      <Reveal variant="scale">
        <div className="event-detail__cover">
          {event.ImageUrl ? (
            <img src={event.ImageUrl} alt={event.Name} />
          ) : (
            <div className="event-detail__cover-placeholder">
              <span>{t("BRAND_FALLBACK")}</span>
            </div>
          )}
        </div>
      </Reveal>
      <div className="event-detail__grid">
        <div className="event-detail__main">
          <Reveal variant="up">
            <Link to="/events" className="event-detail__back">
              {t("EVENT_BACK_ALL")}
            </Link>
            <span className="tag tag--lg">{translateCategory(event.Category, t)}</span>
            <h1 className="event-detail__title">{event.Name}</h1>
          </Reveal>
          <Reveal variant="up" delay={80}>
            <ul className="event-detail__meta">
            <li>
              <strong>{t("EVENT_META_WHEN")}</strong>
              <span>{formatDate(event.EventDate)}</span>
            </li>
            <li>
              <strong>{t("EVENT_META_WHERE")}</strong>
              <span>{event.Location}</span>
            </li>
            <li>
              <strong>{t("EVENT_META_CAPACITY")}</strong>
              <span>
                {totals.allocated > 0
                  ? t("EVENT_META_CAPACITY_REMAINING", {
                      remaining: totals.remaining,
                      allocated: totals.allocated,
                    })
                  : t("EVENT_META_CAPACITY_SEATS", { count: event.MaxSeats ?? 0 })}
              </span>
            </li>
            <li>
              <strong>{t("EVENT_META_ORGANIZER")}</strong>
              <span>{event.CreatedByName || t("EVENT_META_ORGANIZER_DEFAULT")}</span>
            </li>
            </ul>
          </Reveal>
          {event.Description ? (
            <div className="event-detail__about">
              <h2>{t("EVENT_ABOUT_THIS")}</h2>
              <p>{event.Description}</p>
            </div>
          ) : null}

          {user && event.CreatedBy === user.userId ? (
            <div className="event-detail__owner-actions">
              <Link
                to={`/events/${event.ItemId}/edit`}
                className="btn-primary"
              >
                {t("BTN_EDIT_EVENT")}
              </Link>
            </div>
          ) : null}
        </div>

        <Reveal variant="right" delay={120}>
          <aside className="event-detail__aside">
            <div className="ticket-card">
            <h2 className="ticket-card__title">{t("EVENT_TICKET_TITLE")}</h2>
            {ticketTypesQuery.isPending ? (
              <div className="ticket-card__list" aria-busy="true">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="skeleton--ticket-option" />
                ))}
              </div>
            ) : ticketTypes.length === 0 ? (
              <p className="ticket-card__empty">{t("EVENT_TICKETS_EMPTY")}</p>
            ) : (
              <div className="ticket-card__list">
                {ticketTypes.map((t2) => {
                  const remaining = Math.max(
                    0,
                    (t2.SeatAllocation ?? 0) - (t2.SoldCount ?? 0)
                  );
                  const soldOut = remaining <= 0;
                  const isSelected = selectedId === t2.ItemId;
                  return (
                    <button
                      key={t2.ItemId}
                      type="button"
                      disabled={soldOut}
                      className={`ticket-option ${isSelected ? "ticket-option--active" : ""} ${
                        soldOut ? "ticket-option--sold" : ""
                      }`}
                      onClick={() => {
                        setSelectedId(t2.ItemId);
                        setQuantity(1);
                      }}
                    >
                      <div className="ticket-option__head">
                        <span className="ticket-option__name">{t2.Name}</span>
                        <span className="ticket-option__price">
                          ${t2.Price.toFixed(2)}
                        </span>
                      </div>
                      <div className="ticket-option__foot">
                        {soldOut ? (
                          <span className="badge badge--sold">{t("EVENT_SOLD_OUT_BADGE")}</span>
                        ) : (
                          <span className="badge">{t("EVENT_REMAINING_LEFT", { count: remaining })}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selected ? (
              <div className="ticket-card__qty">
                <label className="field__label" htmlFor="qty">
                  {t("EVENT_QUANTITY")}
                </label>
                <div className="ticket-card__qty-row">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    −
                  </button>
                  <input
                    id="qty"
                    className="ticket-card__qty-input"
                    type="number"
                    min={1}
                    max={selectedRemaining}
                    value={quantity}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (!Number.isFinite(n)) return;
                      setQuantity(Math.max(1, Math.min(selectedRemaining, n)));
                    }}
                  />
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() =>
                      setQuantity((q) => Math.min(selectedRemaining, q + 1))
                    }
                  >
                    +
                  </button>
                </div>
                <div className="ticket-card__summary">
                  <span>{t("EVENT_TOTAL")}</span>
                  <strong>${(selected.Price * quantity).toFixed(2)}</strong>
                </div>
              </div>
            ) : null}

            {purchaseError ? (
              <div className="alert alert--error">{purchaseError}</div>
            ) : null}

            {user ? (
              <button
                type="button"
                className="btn-primary ticket-card__cta"
                disabled={!canBuy || purchaseMutation.isPending}
                onClick={() => purchaseMutation.mutate()}
              >
                {purchaseMutation.isPending
                  ? t("BTN_PROCESSING")
                  : selected
                  ? tn("BTN_BUY_TICKET", quantity, { count: quantity })
                  : t("BTN_SELECT_TICKET")}
              </button>
            ) : (
              <Link to="/" className="btn-primary ticket-card__cta">
                {t("BTN_SIGN_IN_TO_BUY")}
              </Link>
            )}
            <p className="ticket-card__fine">{t("EVENT_FINEPRINT")}</p>
            </div>
          </aside>
        </Reveal>
      </div>
    </section>
  );
}