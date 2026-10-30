export type RenderedText = {
  rendered: string;
};

export type WordPressPost<Meta> = {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  link: string;
  title: RenderedText;
  meta: Meta;
  featured_media: number;
};

export type LocalizedTitle = {
  hr: string;
  en: string;
};

export type LocationMeta = {
  title_en: string;
  short_description_hr: string;
  short_description_en: string;
  description_hr: string;
  description_en: string;
  map_x: number | string | null;
  map_y: number | string | null;
  gallery_image_ids: number[];
  audio_story_ids: number[];
  video_ids: number[];
};

export type Location = WordPressPost<LocationMeta> & {
  map_x: number;
  map_y: number;
};

export type WordPressMediaSize = {
  source_url: string;
  width: number;
  height: number;
};

export type WordPressMedia = {
  id: number;
  alt_text: string;
  caption: RenderedText;
  description: RenderedText;
  mime_type: string;
  source_url: string;
  media_details?: {
    sizes?: Record<string, WordPressMediaSize>;
  };
};

export type AudioStory = Omit<WordPressPost<Record<string, never>>, "title"> & {
  title: LocalizedTitle;
  audio: {
    hr: {
      url: string | null;
      transcript: string;
    };
    en: {
      url: string | null;
      transcript: string;
    };
  };
  author: string;
};

export type BeforeAfterMeta = {
  before_image_id: number;
  after_image_id: number;
};

export type BeforeAfter = WordPressPost<BeforeAfterMeta>;

export type TimelineMeta = {
  year: string;
  text: string;
  gallery_image_ids: number[];
  location_ids: number[];
};

export type TimelineItem = WordPressPost<TimelineMeta>;

export type RouteEventType =
  | "strucna_tura"
  | "obiteljska_tura"
  | "radionica_za_djecu"
  | "vecernja_setnja"
  | "koncert"
  | "predavanje"
  | "ostalo"
  | "";

export type RouteMeta = {
  title_en: string;
  date_from: string;
  date_to: string;
  event_time: string;
  duration: string;
  age_group: string;
  text_hr: string;
  text_en: string;
  canceled: boolean;
  event_type: RouteEventType;
};

export type VisitorRoute = WordPressPost<RouteMeta> & {
  qr_code: number;
};

export type CmsResource =
  | "locations"
  | "audio-stories"
  | "before-afters"
  | "timelines"
  | "routes";

export function normalizeNumberArray(value: unknown): number[] {
  if (value == null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeNumberArray(item));
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return [value];
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed || trimmed === "null" || trimmed === "undefined") {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) || typeof parsed === "number") {
        return normalizeNumberArray(parsed);
      }
    } catch {
      // fall through to CSV parsing below
    }

    return trimmed
      .replace(/^\[|\]$/g, "")
      .split(/[\s,]+/)
      .map((part) => Number(part.replace(/[\[\]"'`]/g, "").trim()))
      .filter((num): num is number => Number.isFinite(num));
  }

  return [];
}

export function normalizeSingleNumber(value: unknown): number | null {
  const normalized = normalizeNumberArray(value);
  return normalized[0] ?? null;
}

const apiBaseUrl = (
  import.meta.env.VITE_WORDPRESS_API_BASE_URL ?? "/wp-json/wp/v2"
).replace(/\/$/, "");

export async function fetchCmsCollection<T>(
  resource: CmsResource,
  signal?: AbortSignal,
): Promise<T[]> {
  const response = await fetch(`${apiBaseUrl}/${resource}?per_page=100`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `Could not load ${resource}: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<T[]>;
}

export async function fetchWordPressMedia(
  ids: number[],
  signal?: AbortSignal,
): Promise<WordPressMedia[]> {
  if (ids.length === 0) {
    return [];
  }

  const response = await fetch(
    `${apiBaseUrl}/media?include=${ids.join(",")}&per_page=100`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(
      `Could not load media: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<WordPressMedia[]>;
}
