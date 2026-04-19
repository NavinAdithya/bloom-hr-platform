export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 
  (typeof window !== "undefined" && window.location.hostname !== "localhost" 
    ? "https://bloom-api-l0u1.onrender.com" 
    : "http://localhost:4000");

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${path}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

