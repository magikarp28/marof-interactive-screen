import { useEffect, useState } from "react";
import {
  fetchCmsCollection,
  type AudioStory,
  type BeforeAfter,
  type CmsResource,
  type Location,
  type TimelineItem,
  type VisitorRoute,
  type WordPressMedia,
  fetchWordPressMedia,
} from "../api/wordpress";

export type CmsCollection<T> = {
  data: T[];
  isLoading: boolean;
  error: Error | null;
};

function useCmsCollection<T>(resource: CmsResource): CmsCollection<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    setIsLoading(true);
    setError(null);

    void fetchCmsCollection<T>(resource, controller.signal)
      .then(setData)
      .catch((fetchError: unknown) => {
        if (
          fetchError instanceof DOMException &&
          fetchError.name === "AbortError"
        ) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError
            : new Error("Could not load CMS content."),
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [resource]);

  return { data, isLoading, error };
}

export function useLocations(): CmsCollection<Location> {
  return useCmsCollection<Location>("locations");
}

export function useWordPressMedia(
  ids: number[],
): CmsCollection<WordPressMedia> {
  const mediaIds = [...new Set(ids)].sort((first, second) => first - second);
  const mediaKey = mediaIds.join(",");
  const [data, setData] = useState<WordPressMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    if (mediaIds.length === 0) {
      setData([]);
      setIsLoading(false);
      setError(null);
      return () => controller.abort();
    }

    setIsLoading(true);
    setError(null);

    void fetchWordPressMedia(mediaIds, controller.signal)
      .then(setData)
      .catch((fetchError: unknown) => {
        if (
          fetchError instanceof DOMException &&
          fetchError.name === "AbortError"
        ) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError
            : new Error("Could not load CMS media."),
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [mediaKey]);

  return { data, isLoading, error };
}

export function useAudioStories(): CmsCollection<AudioStory> {
  return useCmsCollection<AudioStory>("audio-stories");
}

export function useBeforeAfters(): CmsCollection<BeforeAfter> {
  return useCmsCollection<BeforeAfter>("before-afters");
}

export function useTimeline(): CmsCollection<TimelineItem> {
  return useCmsCollection<TimelineItem>("timelines");
}

export function useVisitorRoutes(): CmsCollection<VisitorRoute> {
  return useCmsCollection<VisitorRoute>("routes");
}
