import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gql, type ActionResponse, type GqlResult } from "../data/gateway";
import { useCurrentUser } from "../auth/use-session";
import { EVENT_FIELDS, type Event } from "./api";
import type { TicketType } from "./ticket-types";

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

export function EventDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const qc = useQueryClient();

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
    return (
      <div className="events__state">
        <div className="spinner spinner--inline" aria-hidden="true" />
        <span>Loading event…</span>
      </div>
    );
  }

  if (eventQuery.error || !event) {
    return (
      <div className="alert alert--error">
        Event not found.{" "}
        <Link to="/events" className="link">
          Back to events
        </Link>
      </div>
    );
  }

  return (
    <section className="event-detail">
      <div className="event-detail__cover">
        {event.ImageUrl ? (
          <img src={event.ImageUrl} alt={event.Name} />
        ) : (
          <div className="event-detail__cover-placeholder">
            <span>StagePass</span>
          </div>
        )}
      </div>
      <div className="event-detail__grid">
        <div className="event-detail__main">
          <Link to="/events" className="event-detail__back">
            ← All events
          </Link>
          <span className="tag tag--lg">{event.Category ?? "Other"}</span>
          <h1 className="event-detail__title">{event.Name}</h1>
          <ul className="event-detail__meta">
            <li>
              <strong>When</strong>
              <span>{formatDate(event.EventDate)}</span>
            </li>
            <li>
              <strong>Where</strong>
              <span>{event.Location}</span>
            </li>
            <li>
              <strong>Capacity</strong>
              <span>
                {totals.allocated > 0
                  ? `${totals.remaining} of ${totals.allocated} seats remaining`
                  : `${event.MaxSeats ?? 0} seats`}
              </span>
            </li>
            <li>
              <strong>Organizer</strong>
              <span>{event.CreatedByName || "StagePass community"}</span>
            </li>
          </ul>
          {event.Description ? (
            <div className="event-detail__about">
              <h2>About this event</h2>
              <p>{event.Description}</p>
            </div>
          ) : null}

          {user && event.CreatedBy === user.userId ? (
            <div className="event-detail__owner-actions">
              <Link
                to={`/events/${event.ItemId}/edit`}
                className="btn-primary"
              >
                Edit event
              </Link>
            </div>
          ) : null}
        </div>

        <aside className="event-detail__aside">
          <div className="ticket-card">
            <h2 className="ticket-card__title">Choose your ticket</h2>
            {ticketTypesQuery.isPending ? (
              <div className="events__state">
                <div className="spinner spinner--inline" aria-hidden="true" />
                <span>Loading tickets…</span>
              </div>
            ) : ticketTypes.length === 0 ? (
              <p className="ticket-card__empty">
                No ticket types have been added yet.
              </p>
            ) : (
              <div className="ticket-card__list">
                {ticketTypes.map((t) => {
                  const remaining = Math.max(
                    0,
                    (t.SeatAllocation ?? 0) - (t.SoldCount ?? 0)
                  );
                  const soldOut = remaining <= 0;
                  const isSelected = selectedId === t.ItemId;
                  return (
                    <button
                      key={t.ItemId}
                      type="button"
                      disabled={soldOut}
                      className={`ticket-option ${isSelected ? "ticket-option--active" : ""} ${
                        soldOut ? "ticket-option--sold" : ""
                      }`}
                      onClick={() => {
                        setSelectedId(t.ItemId);
                        setQuantity(1);
                      }}
                    >
                      <div className="ticket-option__head">
                        <span className="ticket-option__name">{t.Name}</span>
                        <span className="ticket-option__price">
                          ${t.Price.toFixed(2)}
                        </span>
                      </div>
                      <div className="ticket-option__foot">
                        {soldOut ? (
                          <span className="badge badge--sold">Sold out</span>
                        ) : (
                          <span className="badge">{remaining} left</span>
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
                  Quantity
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
                  <span>Total</span>
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
                  ? "Processing…"
                  : selected
                  ? `Buy ${quantity} ticket${quantity > 1 ? "s" : ""}`
                  : "Select a ticket"}
              </button>
            ) : (
              <Link to="/" className="btn-primary ticket-card__cta">
                Sign in to buy tickets
              </Link>
            )}
            <p className="ticket-card__fine">
              Mock checkout — no payment is taken.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}