import HomeClient from "./home-client";

export type Service = {
  _id: string;
  title: string;
  description?: string;
  iconUrl?: string;
  category?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type Client = {
  _id: string;
  name: string;
  logoUrl?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type Testimonial = {
  _id: string;
  name: string;
  feedback: string;
  rating: number;
  sortOrder?: number;
  isActive?: boolean;
};

export type ContentBlock = {
  key: string;
  title?: string;
  contentHtml?: string;
};

async function safeFetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
  const cmsBlocksKeysParam =
    "about,whyChooseUs,contactHeading,contactSubheading,contactPhone,contactEmail,contactAddress";

  const [servicesRes, clientsRes, testimonialsRes, cmsRes] = await Promise.all([
    safeFetchJson<{ items: Service[] }>(`${apiBase}/api/services`),
    safeFetchJson<{ items: Client[] }>(`${apiBase}/api/clients`),
    safeFetchJson<{ items: Testimonial[] }>(`${apiBase}/api/testimonials`),
    safeFetchJson<{ blocks: ContentBlock[] }>(`${apiBase}/api/cms/blocks?keys=${cmsBlocksKeysParam}`),
  ]);

  return (
    <HomeClient
      initialData={{
        services: servicesRes?.items ?? [],
        clients: clientsRes?.items ?? [],
        testimonials: testimonialsRes?.items ?? [],
        blocks: cmsRes?.blocks ?? [],
      }}
    />
  );
}

