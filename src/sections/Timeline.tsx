import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  normalizeNumberArray,
  type TimelineItem,
  type WordPressMedia,
} from "../api/wordpress";
import { useTimeline, useWordPressMedia } from "../hooks/useCmsData";
import SectionLayout from "./SectionLayout";

type TimelineProps = {
  onBack: () => void;
};

function timelineYear(item: TimelineItem) {
  const rawYear = item.meta.year.trim();
  if (!rawYear) {
    return null;
  }

  const year = Number(rawYear);
  return Number.isFinite(year) ? year : null;
}

function orderedMedia(ids: number[], media: WordPressMedia[]) {
  const mediaById = new Map(media.map((item) => [item.id, item]));

  return ids.flatMap((id) => {
    const item = mediaById.get(id);
    return item ? [item] : [];
  });
}

function Timeline({ onBack }: TimelineProps) {
  const { t } = useTranslation();
  const { data: timelineItems, isLoading, error } = useTimeline();
  const items = timelineItems
    .flatMap((item) => {
      const year = timelineYear(item);
      return year === null ? [] : [{ item, year }];
    })
    .sort((first, second) => first.year - second.year);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const selectedEntry =
    items.find(({ item }) => item.id === selectedItemId) ?? items[0];
  const mediaIds = items.flatMap(({ item }) =>
    normalizeNumberArray(item.meta.gallery_image_ids),
  );
  const { data: media, isLoading: isMediaLoading } =
    useWordPressMedia(mediaIds);
  const images = selectedEntry
    ? orderedMedia(normalizeNumberArray(selectedEntry.item.meta.gallery_image_ids), media)
    : [];

  return (
    <SectionLayout title={t("sections.timeline")} onBack={onBack}>
      <div className="grid w-full max-w-400 self-stretch gap-6 portrait:content-start landscape:lg:grid-cols-[minmax(15rem,0.55fr)_minmax(0,1.45fr)] landscape:lg:items-start">
        <aside className="border-2 border-[#426795] bg-[#ffffff] shadow-[8px_8px_0_rgba(66,103,149,0.18)]">
          <div className="border-b-2 border-[#D96543]/55 px-5 py-4 lg:px-6">
            <h2 className="text-2xl font-bold">{t("timeline.years")}</h2>
          </div>

          {isLoading ? (
            <p className="p-5 text-lg font-semibold">{t("timeline.loading")}</p>
          ) : null}

          {error ? (
            <p
              className="m-5 border-2 border-[#ad3427] bg-[#ffffff] px-4 py-3 font-semibold text-[#7b2119]"
              role="alert"
            >
              {t("timeline.error")}
            </p>
          ) : null}

          {!isLoading && !error && items.length === 0 ? (
            <p className="p-5 text-lg font-semibold">{t("timeline.empty")}</p>
          ) : null}

          <ol className="divide-y-2 divide-[#D96543]/35">
            {items.map(({ item, year }) => {
              const isSelected = item.id === selectedEntry?.item.id;

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    aria-pressed={isSelected}
                    className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-[#D96543] lg:px-6 ${
                      isSelected
                        ? "bg-[#D96543] text-black"
                        : "hover:bg-[#D8BF9E]"
                    }`}
                  >
                    <span className="size-3 shrink-0 rounded-full border-2 border-current bg-[#ffffff]" />
                    <span className="text-2xl font-black tabular-nums">
                      {year}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <section
          className="min-h-90 border-2 border-[#426795] bg-[#ffffff] p-5 shadow-[8px_8px_0_rgba(66,103,149,0.18)] lg:p-7"
          aria-live="polite"
        >
          {selectedEntry ? (
            <article>
              <p className="text-5xl font-black tabular-nums text-[#D96543] lg:text-6xl">
                {selectedEntry.year}
              </p>

              {selectedEntry.item.meta.text ? (
                <div
                  className="mt-5 border-t-2 border-[#D96543]/55 pt-5 text-lg leading-relaxed [&_a]:font-bold [&_a]:text-[#426795] [&_p]:mb-3"
                  dangerouslySetInnerHTML={{
                    __html: selectedEntry.item.meta.text,
                  }}
                />
              ) : null}

              {images.length > 0 ? (
                <section className="mt-7 border-t-2 border-[#D96543]/55 pt-5">
                  <h3 className="text-xl font-bold">{t("timeline.images")}</h3>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {images.map((image) => (
                      <img
                        key={image.id}
                        className="aspect-square w-full border border-black/25 object-cover"
                        src={image.source_url}
                        alt={image.alt_text || image.caption.rendered || ""}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {isMediaLoading ? (
                <p className="mt-5 text-sm font-semibold text-black/65">
                  {t("timeline.loadingMedia")}
                </p>
              ) : null}
            </article>
          ) : !isLoading && !error ? (
            <p className="flex min-h-75 items-center text-xl font-semibold leading-relaxed text-black/65">
              {t("timeline.empty")}
            </p>
          ) : null}
        </section>
      </div>
    </SectionLayout>
  );
}

export default Timeline;
