import { useRef, useState } from "react";
import { createPortal } from "react-dom";
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

function localizedTimelineText(item: TimelineItem, language: "hr" | "en") {
  return (
    item.meta[`text_${language}`] || item.meta.text_hr || item.meta.text || ""
  );
}

function Timeline({ onBack }: TimelineProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage === "en" ? "en" : "hr";
  const { data: timelineItems, isLoading, error } = useTimeline();
  const items = timelineItems
    .flatMap((item) => {
      const year = timelineYear(item);
      return year === null ? [] : [{ item, year }];
    })
    .sort((first, second) => first.year - second.year);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<WordPressMedia | null>(null);
  const imageDialogRef = useRef<HTMLDialogElement>(null);
  const selectedEntry =
    items.find(({ item }) => item.id === selectedItemId) ?? items[0];
  const mediaIds = items.flatMap(({ item }) =>
    normalizeNumberArray(item.meta.gallery_image_ids),
  );
  const { data: media, isLoading: isMediaLoading } =
    useWordPressMedia(mediaIds);
  const images = selectedEntry
    ? orderedMedia(
        normalizeNumberArray(selectedEntry.item.meta.gallery_image_ids),
        media,
      )
    : [];
  const selectedText = selectedEntry
    ? localizedTimelineText(selectedEntry.item, language)
    : "";

  return (
    <SectionLayout
      title={t("sections.timeline")}
      onBack={onBack}
      className="timeline-section"
    >
      <div className="timeline-layout grid w-full min-w-0 max-w-400 self-start content-start gap-6">
        <nav
          className="timeline-navigation min-w-0 border-2 border-[#426795] bg-[#ffffff] shadow-[8px_8px_0_rgba(66,103,149,0.18)]"
          aria-label={t("timeline.years")}
        >
          <div className="timeline-heading flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-2 border-[#D96543]/55 px-5 py-4 lg:px-6">
            <h2 className="text-2xl font-bold">{t("timeline.years")}</h2>
            {items.length > 1 ? (
              <p className="text-sm font-semibold text-black/65">
                {t("timeline.scrollHint")}
              </p>
            ) : null}
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

          {items.length > 0 ? (
            <div className="timeline-scroll overflow-x-auto">
              <ol className="timeline-track flex w-max min-w-full px-3 py-3">
                {items.map(({ item, year }) => {
                  const isSelected = item.id === selectedEntry?.item.id;

                  return (
                    <li key={item.id} className="timeline-stop relative flex-1">
                      <button
                        type="button"
                        onClick={() => setSelectedItemId(item.id)}
                        aria-pressed={isSelected}
                        className={`relative z-10 flex w-full flex-col items-center rounded-sm transition-colors focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-[#D96543] ${
                          isSelected ? "text-[#a63d22]" : "text-[#426795] hover:text-[#a63d22]"
                        }`}
                      >
                        <span className="flex h-12 items-center px-2 text-2xl font-black tabular-nums">
                          {year}
                        </span>
                        <span className="flex h-12 items-center justify-center" aria-hidden="true">
                          <span
                            className={`size-5 rounded-full border-[3px] border-current ${
                              isSelected ? "bg-[#D96543] ring-4 ring-[#D96543]/25" : "bg-white"
                            }`}
                          />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : null}
        </nav>

        <section
          className="timeline-detail min-h-90 min-w-0 border-2 border-[#426795] bg-[#ffffff] p-5 shadow-[8px_8px_0_rgba(66,103,149,0.18)] lg:p-7"
          aria-live="polite"
        >
          {selectedEntry ? (
            <article>
              <p className="text-5xl font-black tabular-nums text-[#D96543] lg:text-6xl">
                {selectedEntry.year}
              </p>

              {selectedText ? (
                <div
                  className="mt-5 break-words border-t-2 border-[#D96543]/55 pt-5 text-lg leading-relaxed [&_a]:font-bold [&_a]:text-[#426795] [&_p]:mb-3"
                  dangerouslySetInnerHTML={{
                    __html: selectedText,
                  }}
                />
              ) : null}

              {images.length > 0 ? (
                <section className="mt-7 border-t-2 border-[#D96543]/55 pt-5">
                  <div className="mx-auto flex max-w-[49.5rem] flex-wrap justify-center gap-3">
                    {images.map((image) => (
                      <div
                        key={image.id}
                        className="relative aspect-square w-[calc((100%_-_0.75rem)/2)] max-w-64 overflow-hidden border border-black/25 sm:w-[calc((100%_-_1.5rem)/3)]"
                      >
                        <img
                          className="timeline-image-static absolute inset-0 h-full max-h-full w-full max-w-full object-contain"
                          src={image.source_url}
                          alt={image.alt_text || image.caption.rendered || ""}
                        />
                        <button
                          type="button"
                          className="timeline-image-button absolute inset-0 h-full w-full cursor-zoom-in focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-[#D96543]"
                          aria-label={
                            image.alt_text
                              ? `${t("timeline.enlargeImage")}: ${image.alt_text}`
                              : t("timeline.enlargeImage")
                          }
                          onClick={() => {
                            setEnlargedImage(image);
                            imageDialogRef.current?.showModal();
                          }}
                        >
                          <img
                            className="h-full max-h-full w-full max-w-full object-contain"
                            src={image.source_url}
                            alt=""
                          />
                        </button>
                      </div>
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
        {createPortal(
          <dialog
            ref={imageDialogRef}
            aria-label={t("timeline.enlargedImage")}
            onClose={() => setEnlargedImage(null)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.currentTarget.close();
              }
            }}
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                event.currentTarget.close();
              }
            }}
            className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-5xl overflow-auto border-2 border-[#426795] bg-white p-4 text-black backdrop:bg-black/80"
          >
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => imageDialogRef.current?.close()}
                className="border-2 border-[#426795] px-4 py-2 font-bold focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#D96543]"
              >
                {t("timeline.closeImage")}
              </button>
            </div>
            {enlargedImage ? (
              <div className="flex justify-center">
                <img
                  className="max-h-[calc(100dvh-8rem)] max-w-full object-contain"
                  src={enlargedImage.source_url}
                  alt={enlargedImage.alt_text || enlargedImage.caption.rendered || ""}
                />
              </div>
            ) : null}
          </dialog>,
          document.body,
        )}
      </div>
    </SectionLayout>
  );
}

export default Timeline;
