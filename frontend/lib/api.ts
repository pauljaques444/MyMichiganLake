const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export async function apiFetch<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type PostCategory = "general" | "safety" | "lost_found" | "events" | "recommendations" | "for_sale" | "water_conditions";

export interface Author {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export interface PostMedia {
  id: string;
  url: string;
  mime_type: string;
  position: number;
}

export interface Post {
  id: string;
  author: Author;
  neighborhood_id: string;
  category: PostCategory;
  body: string;
  is_urgent: boolean;
  created_at: string;
  media: PostMedia[];
  comment_count: number;
  reaction_counts: Record<string, number>;
}
