import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { gql, type GqlResult } from "../data/gateway";
import { useCurrentUser } from "../auth/use-session";
import type { Purchase } from "./api";

const PURCHASE_FIELDS =
  "ItemId EventId EventName TicketTypeId TicketTypeName UserId UserName Quantity TotalPrice Status";

export function MyTicketsPage() {
  const user = useCurrentUser();
  const [params] = useSearchParams();
  const justBought = params.get("just");

  const purchasesQuery = useQuery({
    queryKey: ["data", "getPurchases", { userId: user?.userId }],
    enabled: !!user?.userId,
    queryFn: () =>
      gql<{ getPurchases: GqlResult<Purchase> }>(
        `query($w:PurchaseFilterInput,$p:PaginationInput,$order:[PurchaseSortInput!]){
           getPurchases(where:$w,paging:$p,order:$order){ items { ${PURCHASE_FIELDS} } }
         }`,
        {
          w: { UserId: { eq: user!.userId } },
          p: { pageNo: 1, pageSize: 50 },
          order: [{ ItemId: "DESC" }],
        }
      ).then((d) => d.getPurchases.items),
  });

  if (!user) {
    return (
      <div className="alert alert--info">
        Please <a href="/">sign in</a> to view your tickets.
      </div>
    );
  }

  const items = purchasesQuery.data ?? [];

  return (
    <section className="my-tickets">
      <header className="events__header">
        <div>
          <h1 className="events__title">My tickets</h1>
          <p className="events__lede">
            Everything you have booked, ready to revisit any time.
          </p>
        </div>
      </header>

      {justBought ? (
        <div className="alert alert--info">
          Purchase confirmed! Your tickets are below.
        </div>
      ) : null}

      {purchasesQuery.isPending ? (
        <div className="events__state">
          <div className="spinner spinner--inline" aria-hidden="true" />
          <span>Loading your tickets…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="events__empty">
          <h2>No tickets yet</h2>
          <p>
            Browse <Link to="/events">upcoming events</Link> and grab your first
            seat.
          </p>
        </div>
      ) : (
        <ul className="ticket-list">
          {items.map((p) => (
            <li key={p.ItemId} className="ticket-row">
              <div className="ticket-row__left">
                <span className="tag">{p.TicketTypeName}</span>
                <h3>{p.EventName}</h3>
                <p>
                  {p.Quantity} ticket{p.Quantity > 1 ? "s" : ""} ·{" "}
                  <strong>${p.TotalPrice.toFixed(2)}</strong>
                </p>
              </div>
              <div className="ticket-row__right">
                {p.EventId ? (
                  <Link to={`/events/${p.EventId}`} className="nav__cta">
                    View event
                  </Link>
                ) : null}
                <span
                  className={`badge ${
                    p.Status === "cancelled" ? "badge--sold" : ""
                  }`}
                >
                  {p.Status ?? "confirmed"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}