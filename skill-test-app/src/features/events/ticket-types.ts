import { makeCrud } from "../data/crud";

export interface TicketType {
  ItemId: string;
  EventId?: string | null;
  Name: string;
  Price: number;
  SeatAllocation: number;
  SoldCount?: number | null;
}

export type TicketTypeInsert = {
  EventId: string;
  Name: string;
  Price: number;
  SeatAllocation: number;
  SoldCount?: number;
};

export type TicketTypeUpdate = Partial<Omit<TicketTypeInsert, "EventId">>;

export const TICKET_TYPE_FIELDS =
  "ItemId EventId Name Price SeatAllocation SoldCount";

export const ticketTypesCrud = makeCrud<TicketType, TicketTypeInsert, TicketTypeUpdate>(
  {
    query: "getTicketTypes",
    insert: "insertTicketType",
    update: "updateTicketType",
    remove: "deleteTicketType",
    filterType: "TicketTypeFilterInput",
    sortType: "TicketTypeSortInput",
    insertType: "TicketTypeInsertInput",
    updateType: "TicketTypeUpdateInput",
  },
  TICKET_TYPE_FIELDS
);