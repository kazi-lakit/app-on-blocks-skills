import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { gql, type ActionResponse, type GqlResult } from "../data/gateway";
import { useCurrentUser } from "../auth/use-session";
import { CATEGORIES } from "./constants";
import type { Event } from "./api";
import type { TicketType } from "./ticket-types";
import { ImageUploadField } from "../files/image-upload-field";

interface TicketTypeDraft {
  id: string;
  existing: boolean;
  itemId: string | null;
  name: string;
  price: string;
  seats: string;
}

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function makeEmpty(): TicketTypeDraft {
  return {
    id: crypto.randomUUID(),
    existing: false,
    itemId: null,
    name: "General",
    price: "25",
    seats: "50",
  };
}

export function UpdateEventPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const user = useCurrentUser();

  const eventQuery = useQuery({
    queryKey: ["data", "getEvents", { id }],
    enabled: !!id,
    queryFn: () =>
      gql<{ getEvents: GqlResult<Event> }>(
        `query($w:EventFilterInput,$p:PaginationInput){
           getEvents(where:$w,paging:$p){ items { ItemId Name Description EventDate Location Category ImageUrl MaxSeats CreatedBy CreatedByName } }
         }`,
        { w: { ItemId: { eq: id } }, p: { pageNo: 1, pageSize: 1 } }
      ).then((d) => d.getEvents.items[0]),
  });

  const ticketTypesQuery = useQuery({
    queryKey: ["data", "getTicketTypes", { eventId: id }],
    enabled: !!id,
    queryFn: () =>
      gql<{ getTicketTypes: GqlResult<TicketType> }>(
        `query($w:TicketTypeFilterInput,$p:PaginationInput){
           getTicketTypes(where:$w,paging:$p){ items { ItemId EventId Name Price SeatAllocation SoldCount } }
         }`,
        { w: { EventId: { eq: id } }, p: { pageNo: 1, pageSize: 50 } }
      ).then((d) => d.getTicketTypes.items),
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<string>("Music");
  const [imageUrl, setImageUrl] = useState("");
  const [maxSeats, setMaxSeats] = useState("0");
  const [ticketTypes, setTicketTypes] = useState<TicketTypeDraft[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated || !eventQuery.data || !ticketTypesQuery.data) return;
    const e = eventQuery.data;
    setName(e.Name ?? "");
    setDescription(e.Description ?? "");
    setDate(
      e.EventDate
        ? toLocalInputValue(new Date(e.EventDate))
        : toLocalInputValue(new Date())
    );
    setLocation(e.Location ?? "");
    setCategory(e.Category ?? "Other");
    setImageUrl(e.ImageUrl ?? "");
    setMaxSeats(String(e.MaxSeats ?? 0));
    setTicketTypes(
      ticketTypesQuery.data.map((t) => ({
        id: crypto.randomUUID(),
        existing: true,
        itemId: t.ItemId,
        name: t.Name,
        price: String(t.Price),
        seats: String(t.SeatAllocation),
      }))
    );
    setHydrated(true);
  }, [eventQuery.data, ticketTypesQuery.data, hydrated]);

  if (!user) {
    return (
      <div className="alert alert--info">
        Please <Link to="/">sign in</Link> to edit events.
      </div>
    );
  }

  if (eventQuery.isPending || ticketTypesQuery.isPending) {
    return (
      <div className="events__state">
        <div className="spinner spinner--inline" aria-hidden="true" />
        <span>Loading event…</span>
      </div>
    );
  }

  if (eventQuery.error || !eventQuery.data) {
    return (
      <div className="alert alert--error">
        Event not found. <Link to="/events">Back to events</Link>
      </div>
    );
  }

  const event = eventQuery.data;
  const currentUser = user;

  if (event.CreatedBy !== currentUser.userId) {
    return (
      <div className="alert alert--error">
        You can only edit events you created.{" "}
        <Link to={`/events/${event.ItemId}`}>Back to event</Link>
      </div>
    );
  }

  const totalAllocated = ticketTypes.reduce(
    (s, t) => s + (Number(t.seats) || 0),
    0
  );

  function updateDraft(index: number, patch: Partial<TicketTypeDraft>) {
    setTicketTypes((arr) =>
      arr.map((x, i) => (i === index ? { ...x, ...patch } : x))
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !location.trim() || !date) {
      setError("Name, date, and location are required.");
      return;
    }
    const max = Number(maxSeats);
    if (!Number.isFinite(max) || max <= 0) {
      setError("Max seats must be a positive number.");
      return;
    }
    if (totalAllocated > max) {
      setError(
        `Sum of ticket-type seats (${totalAllocated}) exceeds the event max (${max}).`
      );
      return;
    }
    if (ticketTypes.length === 0) {
      setError("Add at least one ticket type.");
      return;
    }
    for (const t of ticketTypes) {
      if (!t.name.trim()) {
        setError("Every ticket type needs a name.");
        return;
      }
      const p = Number(t.price);
      const s = Number(t.seats);
      if (!Number.isFinite(p) || p < 0 || !Number.isFinite(s) || s <= 0) {
        setError("Each ticket type needs a valid price (≥0) and seat count (>0).");
        return;
      }
      if (t.existing && t.itemId) {
        const original = ticketTypesQuery.data!.find((x) => x.ItemId === t.itemId);
        if (original && s < (original.SoldCount ?? 0)) {
          setError(
            `Cannot reduce "${t.name}" below the number already sold (${original.SoldCount}).`
          );
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      // ownership-gated where: only updates if CreatedBy matches current user
      const eventWhere = {
        ItemId: { eq: event.ItemId },
        CreatedBy: { eq: currentUser.userId },
      };
      const updateRes = await gql<{ updateEvent: ActionResponse }>(
        `mutation($w:EventFilterInput,$input:EventUpdateInput!){
           updateEvent(where:$w,input:$input){ acknowledged totalImpactedData message }
         }`,
        {
          w: eventWhere,
          input: {
            Name: name.trim(),
            Description: description.trim(),
            EventDate: new Date(date).toISOString(),
            Location: location.trim(),
            Category: category,
            ImageUrl: imageUrl.trim() || "",
            MaxSeats: max,
          },
        }
      );

      if (updateRes.updateEvent.totalImpactedData === 0) {
        throw new Error(
          "Update was rejected — you can only edit events you created."
        );
      }

      // upsert ticket types
      for (const t of ticketTypes) {
        if (t.existing && t.itemId) {
          await gql<{ updateTicketType: ActionResponse }>(
            `mutation($w:TicketTypeFilterInput,$input:TicketTypeUpdateInput!){
               updateTicketType(where:$w,input:$input){ acknowledged totalImpactedData message }
             }`,
            {
              w: { ItemId: { eq: t.itemId }, EventId: { eq: event.ItemId } },
              input: {
                Name: t.name.trim(),
                Price: Number(t.price),
                SeatAllocation: Number(t.seats),
              },
            }
          );
        } else {
          await gql<{ insertTicketType: ActionResponse }>(
            `mutation($input:TicketTypeInsertInput!){
               insertTicketType(input:$input){ acknowledged itemId totalImpactedData message }
             }`,
            {
              input: {
                EventId: event.ItemId,
                Name: t.name.trim(),
                Price: Number(t.price),
                SeatAllocation: Number(t.seats),
                SoldCount: 0,
              },
            }
          );
        }
      }

      // delete removed ticket types
      for (const removedId of removedIds) {
        await gql<{ deleteTicketType: ActionResponse }>(
          `mutation($w:TicketTypeFilterInput){
             deleteTicketType(where:$w){ acknowledged totalImpactedData message }
           }`,
          { w: { ItemId: { eq: removedId }, EventId: { eq: event.ItemId } } }
        );
      }

      navigate(`/events/${event.ItemId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="create-event">
      <header className="events__header">
        <div>
          <h1 className="events__title">Edit event</h1>
          <p className="events__lede">
            Update details and ticket types. Changes go live immediately.
          </p>
        </div>
      </header>

      <form className="form create-event__form" onSubmit={onSubmit}>
        {error ? <div className="alert alert--error">{error}</div> : null}

        <div className="field">
          <label className="field__label" htmlFor="name">
            Event name
          </label>
          <input
            id="name"
            className="field__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className="field__input"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor="date">
              Date &amp; time
            </label>
            <input
              id="date"
              className="field__input"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              className="field__input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="location">
            Location
          </label>
          <input
            id="location"
            className="field__input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor="maxSeats">
              Max seats
            </label>
            <input
              id="maxSeats"
              className="field__input"
              type="number"
              min={1}
              value={maxSeats}
              onChange={(e) => setMaxSeats(e.target.value)}
            />
          </div>
          <ImageUploadField value={imageUrl} onChange={setImageUrl} />
        </div>

        <div className="ticket-types">
          <div className="ticket-types__head">
            <h2>Ticket types</h2>
            <button
              type="button"
              className="nav__cta"
              onClick={() => setTicketTypes((arr) => [...arr, makeEmpty()])}
            >
              + Add type
            </button>
          </div>
          <div className="ticket-types__list">
            {ticketTypes.map((t, idx) => (
              <div key={t.id} className="ticket-type-row">
                <div className="field">
                  <label className="field__label">Name</label>
                  <input
                    className="field__input"
                    value={t.name}
                    onChange={(e) => updateDraft(idx, { name: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label className="field__label">Price ($)</label>
                  <input
                    className="field__input"
                    type="number"
                    min={0}
                    step="0.01"
                    value={t.price}
                    onChange={(e) => updateDraft(idx, { price: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label className="field__label">Seats</label>
                  <input
                    className="field__input"
                    type="number"
                    min={1}
                    value={t.seats}
                    onChange={(e) => updateDraft(idx, { seats: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  className="ticket-type-row__remove"
                  aria-label="Remove ticket type"
                  onClick={() => {
                    if (t.existing && t.itemId) setRemovedIds((arr) => [...arr, t.itemId!]);
                    setTicketTypes((arr) => arr.filter((_, i) => i !== idx));
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <p className="field__hint">
            Total allocated across ticket types: <strong>{totalAllocated}</strong>{" "}
            / {maxSeats || 0}
          </p>
        </div>

        <div className="form__actions">
          <Link to={`/events/${event.ItemId}`} className="btn-ghost form__back">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn-primary form__submit"
            disabled={submitting}
          >
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
}