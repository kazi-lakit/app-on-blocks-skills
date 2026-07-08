import { makeCrud } from "../data/crud";

export interface Event {
  ItemId: string;
  Name: string;
  Description?: string | null;
  EventDate?: string | null;
  Location?: string | null;
  Category?: string | null;
  ImageUrl?: string | null;
  MaxSeats?: number | null;
  CreatedBy?: string | null;
  CreatedByName?: string | null;
}

export type EventInsert = {
  Name: string;
  Description?: string;
  EventDate: string;
  Location: string;
  Category: string;
  ImageUrl?: string;
  MaxSeats: number;
  CreatedByName: string;
};

export type EventUpdate = Partial<Omit<EventInsert, "CreatedByName">>;

export const EVENT_FIELDS =
  "ItemId Name Description EventDate Location Category ImageUrl MaxSeats CreatedBy CreatedByName";

export const eventsCrud = makeCrud<Event, EventInsert, EventUpdate>(
  {
    query: "getEvents",
    insert: "insertEvent",
    update: "updateEvent",
    remove: "deleteEvent",
    filterType: "EventFilterInput",
    sortType: "EventSortInput",
    insertType: "EventInsertInput",
    updateType: "EventUpdateInput",
  },
  EVENT_FIELDS
);