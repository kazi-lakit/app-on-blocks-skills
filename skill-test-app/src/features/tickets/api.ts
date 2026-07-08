import { makeCrud } from "../data/crud";

export interface Purchase {
  ItemId: string;
  EventId?: string | null;
  EventName?: string | null;
  TicketTypeId?: string | null;
  TicketTypeName?: string | null;
  UserId?: string | null;
  UserName?: string | null;
  Quantity: number;
  TotalPrice: number;
  Status?: string | null;
}

export type PurchaseInsert = {
  EventId: string;
  EventName: string;
  TicketTypeId: string;
  TicketTypeName: string;
  UserId: string;
  UserName: string;
  Quantity: number;
  TotalPrice: number;
  Status: string;
};

export type PurchaseUpdate = Partial<Omit<PurchaseInsert, "EventId" | "TicketTypeId">>;

export const PURCHASE_FIELDS =
  "ItemId EventId EventName TicketTypeId TicketTypeName UserId UserName Quantity TotalPrice Status";

export const purchasesCrud = makeCrud<Purchase, PurchaseInsert, PurchaseUpdate>(
  {
    query: "getPurchases",
    insert: "insertPurchase",
    update: "updatePurchase",
    remove: "deletePurchase",
    filterType: "PurchaseFilterInput",
    sortType: "PurchaseSortInput",
    insertType: "PurchaseInsertInput",
    updateType: "PurchaseUpdateInput",
  },
  PURCHASE_FIELDS
);