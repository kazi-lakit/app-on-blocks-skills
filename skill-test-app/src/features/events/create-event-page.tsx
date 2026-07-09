import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { gql, type ActionResponse } from "../data/gateway";
import { useCurrentUser } from "../auth/use-session";
import { CATEGORIES, CATEGORY_KEYS } from "./constants";
import { ImageUploadField } from "../files/image-upload-field";
import { useT } from "../i18n";

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
  const t = useT();

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
        {t("PLEASE_SIGN_IN_CREATE")}
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
      setError(t("FORM_ERR_NAME_DATE_LOCATION"));
      return;
    }
    const max = Number(maxSeats);
    if (!Number.isFinite(max) || max <= 0) {
      setError(t("FORM_ERR_MAX_SEATS_POSITIVE"));
      return;
    }
    if (totalAllocated > max) {
      setError(t("FORM_ERR_SEATS_EXCEED_MAX", { allocated: totalAllocated, max }));
      return;
    }
    if (ticketTypes.length === 0) {
      setError(t("FORM_ERR_ADD_TICKET"));
      return;
    }
    for (const tt of ticketTypes) {
      if (!tt.name.trim()) {
        setError(t("FORM_ERR_TICKET_NAME_REQUIRED"));
        return;
      }
      const p = Number(tt.price);
      const s = Number(tt.seats);
      if (!Number.isFinite(p) || p < 0 || !Number.isFinite(s) || s <= 0) {
        setError(t("FORM_ERR_TICKET_PRICE_SEATS"));
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

      for (const tt of ticketTypes) {
        await gql<{ insertTicketType: ActionResponse }>(
          `mutation($input:TicketTypeInsertInput!){
             insertTicketType(input:$input){ acknowledged itemId totalImpactedData message }
           }`,
          {
            input: {
              EventId: eventId,
              Name: tt.name.trim(),
              Price: Number(tt.price),
              SeatAllocation: Number(tt.seats),
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
          <h1 className="events__title">{t("FORM_TITLE_CREATE")}</h1>
          <p className="events__lede">{t("FORM_LEDE_CREATE")}</p>
        </div>
      </header>

      <form className="form create-event__form" onSubmit={onSubmit}>
        {error ? <div className="alert alert--error">{error}</div> : null}

        <div className="field">
          <label className="field__label" htmlFor="name">
            {t("FORM_NAME")}
          </label>
          <input
            id="name"
            className="field__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("FORM_NAME_PLACEHOLDER")}
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="description">
            {t("DESCRIPTION")}
          </label>
          <textarea
            id="description"
            className="field__input"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("FORM_DESC_PLACEHOLDER")}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor="date">
              {t("FORM_DATE")}
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
              {t("FORM_CATEGORY")}
            </label>
            <select
              id="category"
              className="field__input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(CATEGORY_KEYS[c])}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="location">
            {t("FORM_LOCATION")}
          </label>
          <input
            id="location"
            className="field__input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t("FORM_LOCATION_PLACEHOLDER")}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor="maxSeats">
              {t("FORM_MAX_SEATS")}
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
            <h2>{t("FORM_TICKET_TYPES")}</h2>
            <button
              type="button"
              className="nav__cta"
              onClick={() => setTicketTypes((arr) => [...arr, makeDraft()])}
            >
              {t("BTN_ADD_TYPE")}
            </button>
          </div>
          <div className="ticket-types__list">
            {ticketTypes.map((tt, idx) => (
              <div key={tt.id} className="ticket-type-row">
                <div className="field">
                  <label className="field__label">{t("FORM_TICKET_NAME")}</label>
                  <input
                    className="field__input"
                    value={tt.name}
                    onChange={(e) =>
                      setTicketTypes((arr) =>
                        arr.map((x, i) =>
                          i === idx ? { ...x, name: e.target.value } : x
                        )
                      )
                    }
                    placeholder={t("FORM_TICKET_NAME_PLACEHOLDER")}
                  />
                </div>
                <div className="field">
                  <label className="field__label">{t("FORM_TICKET_PRICE")}</label>
                  <input
                    className="field__input"
                    type="number"
                    min={0}
                    step="0.01"
                    value={tt.price}
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
                  <label className="field__label">{t("FORM_TICKET_SEATS")}</label>
                  <input
                    className="field__input"
                    type="number"
                    min={1}
                    value={tt.seats}
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
                  aria-label={t("BTN_REMOVE_TICKET_ARIA")}
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
            {t("FORM_TOTAL_HINT", { count: totalAllocated, max: Number(maxSeats) || 0 })}
          </p>
        </div>

        <button
          type="submit"
          className="btn-primary form__submit"
          disabled={submitting}
        >
          {submitting ? t("BTN_PUBLISHING") : t("BTN_PUBLISH_EVENT")}
        </button>
      </form>
    </section>
  );
}