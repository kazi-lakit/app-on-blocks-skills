const API = import.meta.env.VITE_BLOCKS_API_URL as string;
const PROJECT_KEY = import.meta.env.VITE_BLOCKS_PROJECT_KEY as string;

export interface ActivatePayload {
  code: string;
  password: string;
  firstName: string;
  lastName: string;
}

export async function activateAccount(payload: ActivatePayload) {
  const res = await fetch(`${API}/iam/v4/auth/activate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-blocks-key": PROJECT_KEY,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `activate failed: ${res.status}`);
  }
  return res.json().catch(() => ({}));
}
