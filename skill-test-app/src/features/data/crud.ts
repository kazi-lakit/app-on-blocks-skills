import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gql, type ActionResponse, type GqlResult } from "./gateway";

export interface CrudNames {
  query: string;
  insert: string;
  update: string;
  remove: string;
  filterType: string;
  sortType: string;
  insertType: string;
  updateType: string;
}

export function makeCrud<TRecord, TInsert, TUpdate>(
  n: CrudNames,
  fieldSelection: string
) {
  function useList(
    vars: {
      where?: unknown;
      paging?: { pageNo: number; pageSize: number };
      order?: unknown;
    } = {}
  ) {
    return useQuery({
      queryKey: ["data", n.query, vars],
      queryFn: () =>
        gql<Record<string, GqlResult<TRecord>>>(
          `query($where:${n.filterType},$paging:PaginationInput,$order:[${n.sortType}!]){
             ${n.query}(where:$where,paging:$paging,order:$order){
               totalCount pageNo pageSize totalPages hasNextPage hasPreviousPage
               items { ${fieldSelection} }
             }
           }`,
          vars
        ).then((d) => d[n.query]),
    });
  }

  function useCreate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (input: TInsert) =>
        gql<Record<string, ActionResponse>>(
          `mutation($input:${n.insertType}!){ ${n.insert}(input:$input){ acknowledged itemId totalImpactedData message } }`,
          { input }
        ).then((d) => d[n.insert]),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["data", n.query] });
      },
    });
  }

  function useUpdate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (v: { where: unknown; input: TUpdate }) =>
        gql<Record<string, ActionResponse>>(
          `mutation($where:${n.filterType},$input:${n.updateType}!){ ${n.update}(where:$where,input:$input){ acknowledged totalImpactedData message } }`,
          v
        ).then((d) => d[n.update]),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["data", n.query] });
      },
    });
  }

  function useDelete() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (where: unknown) =>
        gql<Record<string, ActionResponse>>(
          `mutation($where:${n.filterType}){ ${n.remove}(where:$where){ acknowledged totalImpactedData message } }`,
          { where }
        ).then((d) => d[n.remove]),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["data", n.query] });
      },
    });
  }

  return { useList, useCreate, useUpdate, useDelete };
}