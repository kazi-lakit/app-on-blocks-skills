import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { gql, type GqlResult } from "../data/gateway";
import { useCurrentUser } from "../auth/use-session";
import type { Purchase } from "./api";
import { TicketListSkeleton } from "../../components/skeleton";
import { useT, useTn } from "../i18n";
import { Reveal } from "../../components/reveal";

const PURCHASE_FIELDS =
  "ItemId EventId EventName TicketTypeId TicketTypeName UserId UserName Quantity TotalPrice Status";

export function MyTicketsPage() {
  const user = useCurrentUser();
  const [params] = useSearchParams();
  const justBought = params.get("just");
  const t = useT();
  const tn = useTn();

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
        {t("PLEASE_SIGN_IN_TICKETS")}
      </div>
    );
  }

  const items = purchasesQuery.data ?? [];

  return (
    <section className="my-tickets">
      <Reveal variant="up">
        <header className="events__header">
          <div>
            <h1 className="events__title">{t("TICKETS_TITLE")}</h1>
            <p className="events__lede">{t("TICKETS_LEDE")}</p>
          </div>
        </header>
      </Reveal>

      {justBought ? (
        <div className="alert alert--info">
          {t("PURCHASE_CONFIRMED_BANNER")}
        </div>
      ) : null}

      {purchasesQuery.isPending ? (
        <TicketListSkeleton count={4} />
      ) : items.length === 0 ? (
        <Reveal variant="up">
          <div className="events__empty">
            <h2>{t("TICKETS_EMPTY_TITLE")}</h2>
            <p>
              {t("TICKETS_EMPTY_DESC_PRE")}{" "}
              <Link to="/events">{t("NAV_EVENTS")}</Link>{" "}
              {t("TICKETS_EMPTY_DESC_POST")}
            </p>
          </div>
        </Reveal>
      ) : (
        <ul className="ticket-list reveal--stagger is-visible">
          {items.map((p, i) => (
            <li
              key={p.ItemId}
              className="ticket-row"
              style={{ ["--stagger-index" as string]: i % 6 }}
            >
              <div className="ticket-row__left">
                <span className="tag">{p.TicketTypeName}</span>
                <h3>{p.EventName}</h3>
                <p>
                  {tn("TICKETS_LINE", p.Quantity, { count: p.Quantity })} ·{" "}
                  <strong>${p.TotalPrice.toFixed(2)}</strong>
                </p>
              </div>
              <div className="ticket-row__right">
                {p.EventId ? (
                  <Link to={`/events/${p.EventId}`} className="nav__cta">
                    {t("BTN_VIEW_EVENT")}
                  </Link>
                ) : null}
                <span
                  className={`badge ${
                    p.Status === "cancelled" ? "badge--sold" : ""
                  }`}
                >
                  {p.Status === "cancelled"
                    ? t("TICKETS_STATUS_CANCELLED")
                    : t("TICKETS_STATUS_CONFIRMED")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}