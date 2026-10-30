import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import {
  normalizeNumberArray,
  type AudioStory,
  type Location,
  type WordPressMedia,
} from "../api/wordpress";
import { useAudioStories, useLocations, useWordPressMedia } from "../hooks/useCmsData";
import mapImage from "../assets/images/map.png";
import SectionLayout from "./SectionLayout";

type InteractiveMapProps = {
  onBack: () => void;
};

function localizedLocationTitle(location: Location, language: "hr" | "en") {
  if (language === "en") {
    return location.meta.title_en || location.title.rendered;
  }

  return location.title.rendered;
}

function localizedText(
  location: Location,
  field: "short_description" | "description",
  language: "hr" | "en",
) {
  const localized = location.meta[`${field}_${language}`];
  return localized || location.meta[`${field}_hr`];
}

function orderedMedia(ids: number[], media: WordPressMedia[]) {
  const mediaById = new Map(media.map((item) => [item.id, item]));
  return ids.flatMap((id) => {
    const item = mediaById.get(id);
    return item ? [item] : [];
  });
}

function localizedStoryTitle(story: AudioStory, language: "hr" | "en") {
  return story.title[language] || story.title.hr;
}

function InteractiveMap({ onBack }: InteractiveMapProps) {
  const { t, i18n } = useTranslation();
  const { data: locations, isLoading, error } = useLocations();
  const { data: stories } = useAudioStories();
  const mediaIds = locations.flatMap((location) => [
    ...normalizeNumberArray(location.meta.gallery_image_ids),
    ...normalizeNumberArray(location.meta.video_ids),
  ]);
  const { data: media, isLoading: isMediaLoading } =
    useWordPressMedia(mediaIds);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    null,
  );
  const language = i18n.resolvedLanguage === "en" ? "en" : "hr";
  const selectedLocation = locations.find(
    (location) => location.id === selectedLocationId,
  );

  useEffect(() => {
    if (
      selectedLocationId !== null &&
      !locations.some((location) => location.id === selectedLocationId)
    ) {
      setSelectedLocationId(null);
    }
  }, [locations, selectedLocationId]);

  const images = selectedLocation
    ? orderedMedia(normalizeNumberArray(selectedLocation.meta.gallery_image_ids), media)
    : [];
  const videos = selectedLocation
    ? orderedMedia(normalizeNumberArray(selectedLocation.meta.video_ids), media)
    : [];
  const audioStories = selectedLocation
    ? normalizeNumberArray(selectedLocation.meta.audio_story_ids).flatMap((id) => {
        const story = stories.find((item) => item.id === id);
        const audioUrl = story?.audio[language].url || story?.audio.hr.url;
        return story && audioUrl ? [story] : [];
      })
    : [];

  return (
    <SectionLayout title={t("sections.map")} onBack={onBack}>
      <div className="grid w-full max-w-400 self-stretch gap-6 portrait:content-start landscape:lg:grid-cols-[minmax(0,1.65fr)_minmax(20rem,0.85fr)] landscape:lg:items-start">
        <div className="min-h-0 overflow-hidden border-2 border-[#426795] bg-[#ffffff] shadow-[8px_8px_0_rgba(66,103,149,0.18)]">
          {isLoading ? (
            <p className="p-6 text-xl font-semibold">
              {t("interactiveMap.loading")}
            </p>
          ) : null}

          {error ? (
            <p
              className="m-5 border-2 border-[#ad3427] bg-[#ffffff] px-5 py-4 text-xl font-semibold text-[#7b2119]"
              role="alert"
            >
              {t("interactiveMap.error")}
            </p>
          ) : null}

          {!isLoading && !error && locations.length === 0 ? (
            <p className="p-6 text-xl font-semibold">
              {t("interactiveMap.empty")}
            </p>
          ) : null}

          {!isLoading && !error && locations.length > 0 ? (
            <div className="relative aspect-[16/9] min-h-90">
              <img
                className="absolute inset-0 h-full w-full object-cover"
                src={mapImage}
                alt={t("interactiveMap.mapAlt")}
              />
              {locations.map((location, index) => {
                const isSelected = location.id === selectedLocationId;
                const title = localizedLocationTitle(location, language);

                return (
                  <motion.button
                    key={location.id}
                    type="button"
                    className={`absolute grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] text-sm font-black shadow-[0_3px_0_rgba(0,0,0,0.45)] outline-offset-4 transition-colors focus-visible:outline-4 focus-visible:outline-black sm:size-12 sm:text-base ${
                      isSelected
                        ? "border-[#426795] bg-[#D96543] text-black"
                        : "border-[#F4EFE5] bg-[#426795] text-[#F4EFE5] hover:bg-[#D96543]"
                    }`}
                    style={{
                      left: `${location.map_x}%`,
                      top: `${location.map_y}%`,
                    }}
                    aria-label={t("interactiveMap.openLocation", { title })}
                    aria-pressed={isSelected}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 340,
                      damping: 22,
                    }}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setSelectedLocationId(location.id)}
                  >
                    {index + 1}
                  </motion.button>
                );
              })}
            </div>
          ) : null}
        </div>

        <aside
          className="min-h-60 overflow-y-auto border-2 border-black/30 bg-[#ffffff] p-5 shadow-[6px_6px_0_rgba(66,103,149,0.12)] lg:p-6 landscape:lg:max-h-full"
          aria-live="polite"
        >
          <AnimatePresence mode="wait">
            {selectedLocation ? (
              <motion.article
                key={selectedLocation.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.24 }}
              >
                <p className="text-sm font-bold tracking-[0.14em] text-[#D96543] uppercase">
                  {t("interactiveMap.locationLabel")}
                </p>
                <h2 className="mt-2 text-3xl font-bold leading-tight">
                  {localizedLocationTitle(selectedLocation, language)}
                </h2>

                {localizedText(
                  selectedLocation,
                  "short_description",
                  language,
                ) ? (
                  <p className="mt-4 text-lg font-semibold leading-relaxed text-black/65">
                    {localizedText(
                      selectedLocation,
                      "short_description",
                      language,
                    )}
                  </p>
                ) : null}

                {localizedText(selectedLocation, "description", language) ? (
                  <div
                    className="mt-5 border-t-2 border-[#D96543]/55 pt-5 leading-relaxed [&_a]:font-bold [&_a]:text-[#426795] [&_p]:mb-3"
                    dangerouslySetInnerHTML={{
                      __html: localizedText(
                        selectedLocation,
                        "description",
                        language,
                      ),
                    }}
                  />
                ) : null}

                {images.length > 0 ? (
                  <section className="mt-6 border-t-2 border-[#D96543]/55 pt-5">
                    <h3 className="text-lg font-bold">
                      {t("interactiveMap.images")}
                    </h3>
                    <div className="mt-3 grid grid-cols-2 gap-3">
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

                {videos.length > 0 ? (
                  <section className="mt-6 border-t-2 border-[#D96543]/55 pt-5">
                    <h3 className="text-lg font-bold">
                      {t("interactiveMap.videos")}
                    </h3>
                    <div className="mt-3 space-y-3">
                      {videos.map((video) => (
                        <video
                          key={video.id}
                          className="aspect-video w-full border border-black/25 bg-black"
                          controls
                          preload="metadata"
                          src={video.source_url}
                        >
                          {t("interactiveMap.videoUnsupported")}
                        </video>
                      ))}
                    </div>
                  </section>
                ) : null}

                {audioStories.length > 0 ? (
                  <section className="mt-6 border-t-2 border-[#D96543]/55 pt-5">
                    <h3 className="text-lg font-bold">
                      {t("interactiveMap.audio")}
                    </h3>
                    <div className="mt-3 space-y-3">
                      {audioStories.map((story) => {
                        const audio =
                          story.audio[language].url || story.audio.hr.url;

                        return audio ? (
                          <div
                            key={story.id}
                            className="border-l-4 border-[#D96543] pl-3"
                          >
                            <p className="font-bold">
                              {localizedStoryTitle(story, language)}
                            </p>
                            <audio
                              className="mt-2 w-full"
                              controls
                              preload="metadata"
                              src={audio}
                            >
                              {t("interactiveMap.audioUnsupported")}
                            </audio>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </section>
                ) : null}

                {isMediaLoading ? (
                  <p className="mt-5 text-sm font-semibold text-black/65">
                    {t("interactiveMap.loadingMedia")}
                  </p>
                ) : null}
              </motion.article>
            ) : (
              <motion.p
                key="empty-detail"
                className="flex min-h-48 items-center text-xl font-semibold leading-relaxed text-black/65"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {t("interactiveMap.selectPrompt")}
              </motion.p>
            )}
          </AnimatePresence>
        </aside>
      </div>
    </SectionLayout>
  );
}

export default InteractiveMap;
