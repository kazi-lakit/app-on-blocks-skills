import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe, getSession, logout, type SessionInfo } from "./sso";

export interface AuthUser {
  userId: string;
  displayName: string;
  email?: string;
}

interface MeClaims {
  sub?: string;
  user_id?: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
}

async function iamFetchSafe<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_BLOCKS_API_URL}/iam/v4${path}`,
      {
        credentials: "include",
        headers: {
          "x-blocks-key": import.meta.env.VITE_BLOCKS_PROJECT_KEY as string,
          Accept: "application/json",
        },
      }
    );
    if (res.status === 401 || res.status === 404 || res.status === 403) {
      return null;
    }
    if (!res.ok) {
      const err: Error & { status?: number } = new Error(
        `iam GET ${path} → ${res.status}`
      );
      err.status = res.status;
      throw err;
    }
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof TypeError) return null;
    throw e;
  }
}

export function useMeQuery() {
  return useQuery<MeClaims | null>({
    queryKey: ["auth", "me"],
    queryFn: () => iamFetchSafe<MeClaims>("/iam/me"),
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useSessionQuery() {
  return useQuery<SessionInfo | null>({
    queryKey: ["auth", "session"],
    queryFn: () => iamFetchSafe<SessionInfo>("/oidc/session"),
    retry: false,
    staleTime: 60_000,
  });
}

export function useCurrentUser(): AuthUser | null {
  const me = useMeQuery();
  const session = useSessionQuery();
  const claims = me.data;
  const sessionAccount = session.data?.accounts?.[0];

  if (claims) {
    return {
      userId: claims.user_id || claims.sub || claims.email || "unknown",
      displayName:
        claims.name ||
        claims.preferred_username ||
        claims.email ||
        "Member",
      email: claims.email,
    };
  }

  if (sessionAccount?.userId) {
    return {
      userId: sessionAccount.userId,
      displayName:
        sessionAccount.displayName || sessionAccount.email || "Member",
      email: sessionAccount.email ?? undefined,
    };
  }

  return null;
}

export function useSignOut() {
  const qc = useQueryClient();
  return async () => {
    try {
      await logout();
    } catch {
      // ignore — we'll still clear local state
    }
    await qc.invalidateQueries({ queryKey: ["auth"] });
    await qc.invalidateQueries({ queryKey: ["data"] });
  };
}

// Re-export for backwards compatibility with any callers still importing the old names
export { getSession, getMe, logout };
export type { SessionInfo };