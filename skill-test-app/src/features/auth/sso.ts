const API = import.meta.env.VITE_BLOCKS_API_URL as string;
const PROJECT_KEY = import.meta.env.VITE_BLOCKS_PROJECT_KEY as string;
const CLIENT_ID = import.meta.env.VITE_BLOCKS_OIDC_CLIENT_ID as string;
const REDIRECT_URI = import.meta.env.VITE_BLOCKS_REDIRECT_URI as string;

export async function startLogin() {
  const url =
    `${API}/iam/v4/idp/initiate` +
    `?x-blocks-key=${encodeURIComponent(PROJECT_KEY)}` +
    `&clientId=${encodeURIComponent(CLIENT_ID)}` +
    `&redirectUri=${encodeURIComponent(REDIRECT_URI)}`;

  const res = await fetch(url, {
    headers: { "x-blocks-key": PROJECT_KEY },
  });
  if (!res.ok) throw new Error(`initiate failed: ${res.status}`);
  const { redirect_uri } = (await res.json()) as { redirect_uri: string };
  if (!redirect_uri) throw new Error("initiate returned no redirect_uri");
  window.location.assign(redirect_uri);
}

export async function finishLogin(search: string) {
  const params = new URLSearchParams(search);
  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state) throw new Error("missing code/state on callback");

  const res = await fetch(
    `${API}/iam/v4/idp/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
    {
      headers: { "x-blocks-key": PROJECT_KEY },
      credentials: "include",
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`callback failed: ${res.status} ${text}`);
  }
}

export interface SessionAccount {
  userId?: string | null;
  displayName?: string | null;
  email?: string | null;
}

export interface SessionInfo {
  sessionId?: string | null;
  accounts?: SessionAccount[];
}

async function iamFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}/iam/v4${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "x-blocks-key": PROJECT_KEY,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const err: Error & { status?: number } = new Error(
      `iam ${init.method ?? "GET"} ${path} → ${res.status}`
    );
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

export function getSession(): Promise<SessionInfo> {
  return iamFetch<SessionInfo>("/oidc/session");
}

export function getMe(): Promise<Record<string, unknown>> {
  return iamFetch<Record<string, unknown>>("/iam/me");
}

export function logout(): Promise<unknown> {
  return iamFetch<unknown>("/auth/Logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken: "" }),
  });
}