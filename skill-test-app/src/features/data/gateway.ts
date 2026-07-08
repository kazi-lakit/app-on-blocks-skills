const GATEWAY = `${import.meta.env.VITE_BLOCKS_API_URL}/data/v4/gateway`;
const PROJECT_KEY = import.meta.env.VITE_BLOCKS_PROJECT_KEY as string;

export interface ActionResponse {
  acknowledged: boolean;
  itemId?: string | null;
  totalImpactedData: number;
  message?: string | null;
}

export interface GqlResult<T> {
  items: T[];
  totalCount: number;
  pageNo: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export class GraphQLError extends Error {
  errors: Array<{ message: string }>;
  constructor(errors: Array<{ message: string }>) {
    super(errors.map((e) => e.message).join("; "));
    this.errors = errors;
  }
}

export async function gql<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(GATEWAY, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-blocks-key": PROJECT_KEY,
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };
  if (body.errors?.length) throw new GraphQLError(body.errors);
  if (!body.data) throw new Error(`Gateway ${res.status}: empty response`);
  return body.data;
}