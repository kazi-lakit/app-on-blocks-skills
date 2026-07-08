import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { gql, type ActionResponse } from "../data/gateway";
import { useCurrentUser } from "../auth/use-session";
import { CATEGORIES } from "./constants";
import { ImageUploadField } from "../files/image-upload-field";

interface TicketTypeDraft {
  id: string;
  name: string;
  price: string;
  seats: string;
}

function makeDraft(): TicketTypeDraft {
  return { id: crypto.randomUUID(), name: "General", price: "25", seats: "50" };
}

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function CreateEventPage() {
  const navigate = useNavigate();
  const user = useCurrentUser();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() =>
    toLocalInputValue(new Date(Date.now() + 1000 * 60 * 60 * 24 * 7))
  );
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<string>("Music");
  const [imageUrl, setImageUrl] = useState("");
  const [maxSeats, setMaxSeats] = useState("100");
  const [ticketTypes, setTicketTypes] = useState<TicketTypeDraft[]>([
    makeDraft(),
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="alert alert--info">
        Please <a href="/">sign in</a> to create an event.
      </div>
    );
  }

  const currentUser = user;

  const totalAllocated = ticketTypes.reduce(
    (s, t) => s + (Number(t.seats) || 0),
    0
  );

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
        setError(
          "Each ticket type needs a valid price (≥0) and seat count (>0)."
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const eventRes = await gql<{ insertEvent: ActionResponse }>(
        `mutation($input:EventInsertInput!){
           insertEvent(input:$input){ acknowledged itemId totalImpactedData message }
         }`,
        {
          input: {
            Name: name.trim(),
            Description: description.trim(),
            EventDate: new Date(date).toISOString(),
            Location: location.trim(),
            Category: category,
            ImageUrl: imageUrl.trim() || "",
            MaxSeats: max,
            CreatedByName: currentUser.displayName,
          },
        }
      );

      const eventId = eventRes.insertEvent.itemId;
      if (!eventId) throw new Error("Event was created but no id was returned");

      for (const t of ticketTypes) {
        await gql<{ insertTicketType: ActionResponse }>(
          `mutation($input:TicketTypeInsertInput!){
             insertTicketType(input:$input){ acknowledged itemId totalImpactedData message }
           }`,
          {
            input: {
              EventId: eventId,
              Name: t.name.trim(),
              Price: Number(t.price),
              SeatAllocation: Number(t.seats),
              SoldCount: 0,
            },
          }
        );
      }

      navigate(`/events/${eventId}`);
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
          <h1 className="events__title">Create a new event</h1>
          <p className="events__lede">
            Set the basics, add ticket types, and publish to the community.
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
            placeholder="Indie Night at the Velvet Hall"
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
            placeholder="What is the vibe, who is performing, what should guests expect?"
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
            placeholder="Velvet Hall, Downtown"
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
              onClick={() => setTicketTypes((arr) => [...arr, makeDraft()])}
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
                    onChange={(e) =>
                      setTicketTypes((arr) =>
                        arr.map((x, i) =>
                          i === idx ? { ...x, name: e.target.value } : x
                        )
                      )
                    }
                    placeholder="VIP / Regular / Student…"
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
                    onChange={(e) =>
                      setTicketTypes((arr) =>
                        arr.map((x, i) =>
                          i === idx ? { ...x, price: e.target.value } : x
                        )
                      )
                    }
                  />
                </div>
                <div className="field">
                  <label className="field__label">Seats</label>
                  <input
                    className="field__input"
                    type="number"
                    min={1}
                    value={t.seats}
                    onChange={(e) =>
                      setTicketTypes((arr) =>
                        arr.map((x, i) =>
                          i === idx ? { ...x, seats: e.target.value } : x
                        )
                      )
                    }
                  />
                </div>
                <button
                  type="button"
                  className="ticket-type-row__remove"
                  aria-label="Remove ticket type"
                  onClick={() =>
                    setTicketTypes((arr) => arr.filter((_, i) => i !== idx))
                  }
                  disabled={ticketTypes.length === 1}
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

        <button
          type="submit"
          className="btn-primary form__submit"
          disabled={submitting}
        >
          {submitting ? "Publishing…" : "Publish event"}
        </button>
      </form>
    </section>
  );
}