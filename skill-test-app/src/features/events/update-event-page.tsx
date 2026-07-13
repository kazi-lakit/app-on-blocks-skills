import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { gql, type ActionResponse, type GqlResult } from "../data/gateway";
import { useCurrentUser } from "../auth/use-session";
import { CATEGORIES, CATEGORY_KEYS } from "./constants";
import type { Event } from "./api";
import type { TicketType } from "./ticket-types";
import { ImageUploadField } from "../files/image-upload-field";
import { FormSkeleton } from "../../components/skeleton";
import { useT } from "../i18n";
import { Reveal } from "../../components/reveal";

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
  const t = useT();

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
        {t("PLEASE_SIGN_IN_EDIT")}
      </div>
    );
  }

  if (eventQuery.isPending || ticketTypesQuery.isPending) {
    return <FormSkeleton />;
  }

  if (eventQuery.error || !eventQuery.data) {
    return (
      <div className="alert alert--error">
        {t("EVENT_NOT_FOUND")} <Link to="/events">{t("LINK_BACK_TO_EVENTS")}</Link>
      </div>
    );
  }

  const event = eventQuery.data;
  const currentUser = user;

  if (event.CreatedBy !== currentUser.userId) {
    return (
      <div className="alert alert--error">
        {t("FORM_ERR_OWNER_ONLY_EDIT")}{" "}
        <Link to={`/events/${event.ItemId}`}>{t("LINK_BACK_TO_EVENT")}</Link>
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
      if (tt.existing && tt.itemId) {
        const original = ticketTypesQuery.data!.find((x) => x.ItemId === tt.itemId);
        if (original && s < (original.SoldCount ?? 0)) {
          setError(
            t("FORM_ERR_TICKET_REDUCE_SOLD", { name: tt.name, sold: original.SoldCount ?? 0 })
          );
          return;
        }
      }
    }

    setSubmitting(true);
    try {
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
        throw new Error(t("FORM_ERR_UPDATE_REJECTED"));
      }

      for (const tt of ticketTypes) {
        if (tt.existing && tt.itemId) {
          await gql<{ updateTicketType: ActionResponse }>(
            `mutation($w:TicketTypeFilterInput,$input:TicketTypeUpdateInput!){
               updateTicketType(where:$w,input:$input){ acknowledged totalImpactedData message }
             }`,
            {
              w: { ItemId: { eq: tt.itemId }, EventId: { eq: event.ItemId } },
              input: {
                Name: tt.name.trim(),
                Price: Number(tt.price),
                SeatAllocation: Number(tt.seats),
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
                Name: tt.name.trim(),
                Price: Number(tt.price),
                SeatAllocation: Number(tt.seats),
                SoldCount: 0,
              },
            }
          );
        }
      }

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
      <Reveal variant="up">
        <header className="events__header">
          <div>
            <h1 className="events__title">{t("FORM_TITLE_EDIT")}</h1>
            <p className="events__lede">{t("FORM_LEDE_EDIT")}</p>
          </div>
        </header>
      </Reveal>

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
              onClick={() => setTicketTypes((arr) => [...arr, makeEmpty()])}
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
                    onChange={(e) => updateDraft(idx, { name: e.target.value })}
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
                    onChange={(e) => updateDraft(idx, { price: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label className="field__label">{t("FORM_TICKET_SEATS")}</label>
                  <input
                    className="field__input"
                    type="number"
                    min={1}
                    value={tt.seats}
                    onChange={(e) => updateDraft(idx, { seats: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  className="ticket-type-row__remove"
                  aria-label={t("BTN_REMOVE_TICKET_ARIA")}
                  onClick={() => {
                    if (tt.existing && tt.itemId) setRemovedIds((arr) => [...arr, tt.itemId!]);
                    setTicketTypes((arr) => arr.filter((_, i) => i !== idx));
                  }}
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

        <div className="form__actions">
          <Link to={`/events/${event.ItemId}`} className="btn-ghost form__back">
            {t("BTN_CANCEL")}
          </Link>
          <button
            type="submit"
            className="btn-primary form__submit"
            disabled={submitting}
          >
            {submitting ? t("BTN_SAVING") : t("BTN_SAVE_CHANGES")}
          </button>
        </div>
      </form>
    </section>
  );
}